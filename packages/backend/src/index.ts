import { join, basename } from 'path';
import { readFile } from 'fs/promises';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { authRoutes } from './routes/auth';
import { verifyAttachmentToken, serveAttachment } from './lib/chat-attachments';
import { getUserFromRequest } from './lib/auth';
import { db } from './db';
import { carrierProfiles } from './db/schema';
import { eq } from 'drizzle-orm';
import { adminUsersRoutes } from './routes/admin/users';
import { adminVehiclesRoutes } from './routes/admin/vehicles';
import { adminImpersonateRoutes } from './routes/admin/impersonate';
import { adminMailingRoutes } from './routes/admin/mailing';
import { adminCitiesRoutes, publicCitiesRoutes } from './routes/admin/cities';
import { cabinetMailingRoutes } from './routes/cabinet/mailing';
import { cabinetOrdersRoutes } from './routes/cabinet/orders';
import { cabinetDriverVehiclesRoutes } from './routes/cabinet/driver-vehicles';
import { cabinetDriverTrailersRoutes, cabinetDriverCouplingsRoutes } from './routes/cabinet/driver-trailers';
import { cabinetDriverOrdersRoutes } from './routes/cabinet/driver-orders';
import { cabinetDriverServicesRoutes } from './routes/cabinet/driver-services';
import { cabinetDriverProfileRoutes } from './routes/cabinet/driver-profile';
import { cabinetDriverCitizenshipsRoutes } from './routes/cabinet/driver-citizenships';
import { cabinetDriverContactsRoutes } from './routes/cabinet/driver-contacts';
import { cabinetDriverDocumentsRoutes } from './routes/cabinet/driver-documents';
import { cabinetDriverChangeRequestsRoutes } from './routes/cabinet/driver-change-requests';
import { adminChangeRequestsRoutes } from './routes/admin/change-requests';
import { adminDriversVerifyRoutes } from './routes/admin/drivers-verify';
import { adminLegalDocsRoutes, publicLegalDocsRoutes } from './routes/admin/legal-docs';
import { adminMvpRoadmapRoutes } from './routes/admin/mvp-roadmap';
import { cabinetClientServicesRoutes } from './routes/cabinet/client-services';
import { cabinetClientProfileRoutes } from './routes/cabinet/client-profile';
import { cabinetChatRoutes } from './routes/cabinet/chat';
import { cabinetProfileRoutes } from './routes/cabinet/profile';
import { startWorker } from './lib/queues';

const app = new Elysia()
  .onAfterHandle(({ set }) => {
    set.headers['X-Content-Type-Options'] = 'nosniff';
    set.headers['X-Frame-Options'] = 'DENY';
    set.headers['X-XSS-Protection'] = '1; mode=block';
  })
  .use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'https://tmgo.example.com').split(',')
      : true,
    credentials: true,
    allowedHeaders: true, // Эхо заголовков из preflight — важно для мобильных браузеров
    exposeHeaders: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    maxAge: 86400,
  }))
  .use(swagger())
  .get('/', () => ({ status: 'ok', message: 'TMGO API is running' }))
  .get('/cabinet/chat/attachments/:filename', async ({ params, query, set }) => {
    const token = (query as { token?: string }).token;
    const safeFilename = params.filename.replace(/[^a-z0-9_.-]/gi, '');
    if (!token || !verifyAttachmentToken(safeFilename, token)) {
      set.status = 403;
      return 'Forbidden';
    }
    const result = await serveAttachment(safeFilename);
    if (!result) {
      set.status = 404;
      return 'Not found';
    }
    set.headers['Content-Type'] = result.contentType;
    return result.buf;
  })
  .get('/cabinet/driver/document-files/:carrierId/:filename', async ({ request, params, set }) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      set.status = 401;
      return 'Unauthorized';
    }
    const safeCarrierId = params.carrierId.replace(/[^a-z0-9-]/gi, '');
    const safeFilename = params.filename.replace(/[^a-z0-9_.-]/gi, '');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.id, safeCarrierId)).limit(1);
    if (!profile || (profile.userId !== user.id && user.role !== 'admin')) {
      set.status = 403;
      return 'Forbidden';
    }
    const filepath = join(process.cwd(), 'storage', 'driver-docs', safeCarrierId, safeFilename);
    try {
      const buf = await readFile(filepath);
      const ext = safeFilename.split('.').pop()?.toLowerCase();
      const types: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
        pdf: 'application/pdf',
      };
      set.headers['Content-Type'] = types[ext || ''] || 'application/octet-stream';
      return buf;
    } catch {
      set.status = 404;
      return 'Not found';
    }
  })
  .use(authRoutes)
  .use(publicCitiesRoutes)
  .use(adminUsersRoutes)
  .use(adminVehiclesRoutes)
  .use(adminChangeRequestsRoutes)
  .use(adminDriversVerifyRoutes)
  .use(adminImpersonateRoutes)
  .use(adminMailingRoutes)
  .use(adminCitiesRoutes)
  .use(adminLegalDocsRoutes)
  .use(adminMvpRoadmapRoutes)
  .use(publicLegalDocsRoutes)
  .use(cabinetMailingRoutes)
  .use(cabinetOrdersRoutes)
  .use(cabinetClientServicesRoutes)
  .use(cabinetClientProfileRoutes)
  .use(cabinetDriverVehiclesRoutes)
  .use(cabinetDriverTrailersRoutes)
  .use(cabinetDriverCouplingsRoutes)
  .use(cabinetDriverProfileRoutes)
  .use(cabinetDriverCitizenshipsRoutes)
  .use(cabinetDriverContactsRoutes)
  .use(cabinetDriverDocumentsRoutes)
  .use(cabinetDriverChangeRequestsRoutes)
  .use(cabinetDriverOrdersRoutes)
  .use(cabinetDriverServicesRoutes)
  .use(cabinetChatRoutes)
  .use(cabinetProfileRoutes)
  .listen({ port: 8000, hostname: '0.0.0.0' });

console.log(`🚀 Backend is running at http://0.0.0.0:8000 (LAN: http://<your-IP>:8000)`);

startWorker().catch((err) => {
  console.warn('[BullMQ] Worker failed to start (Redis may be unavailable):', err.message);
});

export type App = typeof app;
