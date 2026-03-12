import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { authRoutes } from './routes/auth';
import { adminUsersRoutes } from './routes/admin/users';
import { adminCitiesRoutes, publicCitiesRoutes } from './routes/admin/cities';

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
  .use(authRoutes)
  .use(publicCitiesRoutes)
  .use(adminUsersRoutes)
  .use(adminCitiesRoutes)
  .listen(8000);

console.log(`🚀 Backend is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
