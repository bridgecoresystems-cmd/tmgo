import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';

export function getToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') ?? '';
  return cookie.match(/better-auth\.session_token=([^;]+)/)?.[1] ?? null;
}

export async function getUserFromRequest(request: Request) {
  const token = getToken(request);
  if (!token) return null;

  const now = new Date();
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);

  if (!session) return null;

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user ?? null;
}
