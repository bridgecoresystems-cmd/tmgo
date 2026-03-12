import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { authRoutes } from './routes/auth';
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
    origin: (request) => {
      const origin = request.headers.get('origin');
      if (!origin) return false;
      return true;
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposeHeaders: ['Set-Cookie'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  }))
  .use(swagger())
  .get('/', () => ({ status: 'ok', message: 'TMGO API is running' }))
  .get('/uploads/chat/:filename', async ({ params, set }) => {
    try {
      const filepath = join(process.cwd(), 'public', 'uploads', 'chat', params.filename);
      const buf = await readFile(filepath);
      const ext = params.filename.split('.').pop()?.toLowerCase();
      const types: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
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
  .use(adminMailingRoutes)
  .use(adminCitiesRoutes)
  .use(cabinetMailingRoutes)
  .use(cabinetOrdersRoutes)
  .use(cabinetClientServicesRoutes)
  .use(cabinetDriverVehiclesRoutes)
  .use(cabinetDriverOrdersRoutes)
  .use(cabinetDriverServicesRoutes)
  .use(cabinetChatRoutes)
  .listen(8000);

console.log(`🚀 Backend is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
