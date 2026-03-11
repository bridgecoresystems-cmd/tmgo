import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { auth } from './auth';

const app = new Elysia()
  .use(cors({
    origin: (request) => {
        const origin = request.headers.get('origin')
        if (!origin) return false
        return true
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }))
  .use(swagger())
  .get('/', () => ({ status: 'ok', message: 'TMGO API is running' }))
  .mount(auth.handler)
  .listen(8000);

console.log(`🚀 Backend is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
