import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { authRoutes } from './routes/auth';
import { verifyAttachmentToken, serveAttachment } from './lib/chat-attachments';
import { adminUsersRoutes } from './routes/admin/users';
import { adminMailingRoutes } from './routes/admin/mailing';
import { adminCitiesRoutes, publicCitiesRoutes } from './routes/admin/cities';
import { cabinetMailingRoutes } from './routes/cabinet/mailing';
import { cabinetOrdersRoutes } from './routes/cabinet/orders';
import { cabinetDriverVehiclesRoutes } from './routes/cabinet/driver-vehicles';
import { cabinetDriverOrdersRoutes } from './routes/cabinet/driver-orders';
import { cabinetDriverServicesRoutes } from './routes/cabinet/driver-services';
import { cabinetClientServicesRoutes } from './routes/cabinet/client-services';
import { cabinetChatRoutes } from './routes/cabinet/chat';

const app = new Elysia()
  .use(cors({
    origin: true,
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
    if (!token || !verifyAttachmentToken(params.filename, token)) {
      set.status = 403;
      return 'Forbidden';
    }
    const result = await serveAttachment(params.filename);
    if (!result) {
      set.status = 404;
      return 'Not found';
    }
    set.headers['Content-Type'] = result.contentType;
    return result.buf;
  })
  .use(authRoutes)
  .use(publicCitiesRoutes)
  .use(adminUsersRoutes)
  .use(adminMailingRoutes)
  .use(adminCitiesRoutes)
  .use(cabinetMailingRoutes)
  .use(cabinetOrdersRoutes)
  .use(cabinetClientServicesRoutes)
  .use(cabinetDriverVehiclesRoutes)
  .use(cabinetDriverOrdersRoutes)
  .use(cabinetDriverServicesRoutes)
  .use(cabinetChatRoutes)
  .listen({ port: 8000, hostname: '0.0.0.0' });

console.log(`🚀 Backend is running at http://0.0.0.0:8000 (LAN: http://<your-IP>:8000)`);

export type App = typeof app;
