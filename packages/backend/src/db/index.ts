import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('DATABASE_URL is required in production'); })()
    : 'postgresql://tmgo_user:tmgo_pass123@localhost:5432/tmgo');
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
