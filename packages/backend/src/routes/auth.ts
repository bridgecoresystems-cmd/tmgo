import { Elysia, t } from 'elysia';
import { db } from '../db';
import { users, sessions, accounts } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';

const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = `HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}${isProduction ? '; Secure' : ''}`;
const COOKIE_CLEAR = `better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;

function generateId(len = 32) {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, len - 32);
}

function getToken(request: Request) {
  const cookie = request.headers.get('Cookie') ?? '';
  return cookie.match(/better-auth\.session_token=([^;]+)/)?.[1] ?? null;
}

async function createSession(userId: string, request: Request) {
  const token = generateId(64);
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    token,
    expiresAt,
    ipAddress: request.headers.get('X-Forwarded-For') ?? null,
    userAgent: request.headers.get('User-Agent') ?? null,
  });

  return token;
}

export const authRoutes = new Elysia({ prefix: '/api/auth' })

  // GET /api/auth/get-session
  .get('/get-session', async ({ request, set }) => {
    const token = getToken(request);
    if (!token) return { session: null, user: null };

    const now = new Date();
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
      .limit(1);

    if (!session) {
      set.headers['Set-Cookie'] = COOKIE_CLEAR;
      return { session: null, user: null };
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) return { session: null, user: null };

    return { session: { id: session.id, expiresAt: session.expiresAt }, user };
  })

  // POST /api/auth/sign-in/email
  .post('/sign-in/email', async ({ body, set, request }) => {
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!user) {
      set.status = 401;
      return { error: { message: 'Неверный email или пароль' } };
    }
    if (!user.isActive) {
      set.status = 401;
      return { error: { message: 'Аккаунт деактивирован' } };
    }

    const [acct] = await db.select().from(accounts)
      .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, 'credential')))
      .limit(1);

    if (!acct?.password) {
      set.status = 401;
      return { error: { message: 'Неверный email или пароль' } };
    }

    const valid = await Bun.password.verify(body.password, acct.password);
    if (!valid) {
      set.status = 401;
      return { error: { message: 'Неверный email или пароль' } };
    }

    const token = await createSession(user.id, request);
    set.headers['Set-Cookie'] = `better-auth.session_token=${token}; ${COOKIE_OPTS}`;
    return { user };
  }, {
    body: t.Object({ email: t.String(), password: t.String(), callbackURL: t.Optional(t.String()) }),
  })

  // POST /api/auth/sign-up/email
  .post('/sign-up/email', async ({ body, set, request }) => {
    const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) {
      set.status = 400;
      return { error: { message: 'Пользователь с таким email уже существует' } };
    }

    const hashedPassword = await Bun.password.hash(body.password, { algorithm: 'bcrypt', cost: 10 });
    const userId = crypto.randomUUID();

    await db.insert(users).values({
      id: userId,
      name: body.name || body.email.split('@')[0],
      email: body.email,
      emailVerified: false,
      role: (body.role?.toLowerCase() as any) || 'client',
    });

    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: body.email,
      providerId: 'credential',
      userId,
      password: hashedPassword,
    });

    const token = await createSession(userId, request);
    set.headers['Set-Cookie'] = `better-auth.session_token=${token}; ${COOKIE_OPTS}`;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return { user };
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
      name: t.Optional(t.String()),
      role: t.Optional(t.String()),
      callbackURL: t.Optional(t.String()),
    }),
  })

  // POST /api/auth/sign-out
  .post('/sign-out', async ({ request, set }) => {
    const token = getToken(request);
    if (token) await db.delete(sessions).where(eq(sessions.token, token));
    set.headers['Set-Cookie'] = COOKIE_CLEAR;
    return { success: true };
  });
