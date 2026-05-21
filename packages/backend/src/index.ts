import { join, basename } from 'path';
import { readFile } from 'fs/promises';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { authRoutes } from './modules/auth';
import { verifyAttachmentToken, serveAttachment } from './lib/chat-attachments';
import { getUserFromRequest } from './lib/auth';
import { db } from './db';
import { carrierProfiles } from './db/schema';
import { eq } from 'drizzle-orm';
import { adminUsersRoutes } from './modules/admin-users';
import { adminVehiclesRoutes } from './modules/admin-vehicles';
import { adminImpersonateRoutes } from './modules/admin-impersonate';
import { adminMailingRoutes } from './modules/admin-mailing';
import { adminCitiesRoutes, publicCitiesRoutes } from './modules/admin-cities';
import { cabinetMailingRoutes } from './modules/cabinet-mailing';
import { cabinetOrdersRoutes } from './modules/client-orders';
import { reviewsModule } from './modules/reviews';
import { cabinetDriverVehiclesRoutes } from './modules/driver-vehicles';
import { cabinetDriverTrailersRoutes, cabinetDriverCouplingsRoutes } from './modules/driver-trailers';
import { cabinetDriverOrdersRoutes } from './routes/cabinet/driver/driver-orders';
import { cabinetDriverServicesRoutes } from './modules/driver-services';
import { cabinetDriverProfileRoutes } from './modules/driver-profile';
import { cabinetDriverLocationRoutes, adminDriverLocationsRoutes } from './modules/driver-location';
import { cabinetDriverOrdersNearRoutes } from './modules/driver-orders-near';
import { cabinetDriverCitizenshipsRoutes } from './modules/driver-citizenships';
import { cabinetDriverContactsRoutes } from './modules/driver-contacts';
import { cabinetDriverDocumentsRoutes } from './modules/driver-documents';
import { cabinetDriverChangeRequestsRoutes } from './modules/driver-change-requests';
import { adminChangeRequestsRoutes } from './modules/admin-change-requests';
import { adminDriversVerifyRoutes } from './modules/admin-drivers-verify';
import { adminLegalDocsRoutes, publicLegalDocsRoutes } from './modules/admin-legal-docs';
import { adminMvpRoadmapRoutes } from './modules/admin-mvp-roadmap';
import { adminDashboardRoutes } from './modules/admin-dashboard';
import { adminOrdersRoutes } from './modules/admin-orders';
import { cabinetClientServicesRoutes } from './modules/client-services';
import { cabinetClientProfileRoutes } from './modules/client-profile';
import { cabinetChatRoutes } from './modules/chat';
import { cabinetProfileRoutes } from './modules/cabinet-profile';
import { publicOrdersRoutes } from './modules/public-orders';
import { publicContactsRoutes } from './modules/public-contacts';
import { adminContactsRoutes } from './modules/admin-contacts';
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
  .use(publicContactsRoutes)
  .use(adminContactsRoutes)
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
  .use(adminDashboardRoutes)
  .use(adminOrdersRoutes)
  .use(publicLegalDocsRoutes)
  .use(publicOrdersRoutes)
  .use(cabinetMailingRoutes)
  .use(cabinetOrdersRoutes)
  .use(reviewsModule)
  .use(cabinetClientServicesRoutes)
  .use(cabinetClientProfileRoutes)
  .use(cabinetDriverVehiclesRoutes)
  .use(cabinetDriverTrailersRoutes)
  .use(cabinetDriverCouplingsRoutes)
  .use(cabinetDriverProfileRoutes)
  .use(cabinetDriverLocationRoutes)
  .use(cabinetDriverOrdersNearRoutes)
  .use(adminDriverLocationsRoutes)
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
