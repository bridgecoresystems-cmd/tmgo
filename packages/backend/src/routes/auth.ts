import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { Elysia, t } from 'elysia';
import { db } from '../db';
import { users, sessions, accounts } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { getImpersonateToken, getUserFromRequest } from '../lib/auth';

const isProduction = process.env.NODE_ENV === 'production';

async function getUserIdFromToken(request: Request): Promise<string | null> {
  const token = getToken(request);
  if (!token) return null;
  const now = new Date();
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);
  return session?.userId ?? null;
}
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
  // При impersonate возвращает целевого пользователя и isImpersonating: true
  .get('/get-session', async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user) return { session: null, user: null, isImpersonating: false };

    const isImpersonating = !!getImpersonateToken(request);
    return {
      session: { id: 'session', expiresAt: new Date(Date.now() + 86400000) },
      user,
      isImpersonating,
    };
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
  })

  // POST /api/auth/change-password - смена пароля
  .post('/change-password', async ({ body, request, set }) => {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      set.status = 401;
      return { error: { message: 'Необходима авторизация' } };
    }
    const [acct] = await db.select().from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'credential')))
      .limit(1);
    if (!acct?.password) {
      set.status = 400;
      return { error: { message: 'Пароль нельзя изменить' } };
    }
    const valid = await Bun.password.verify(body.currentPassword, acct.password);
    if (!valid) {
      set.status = 400;
      return { error: { message: 'Неверный текущий пароль' } };
    }
    if (body.newPassword.length < 6) {
      set.status = 400;
      return { error: { message: 'Пароль должен быть не менее 6 символов' } };
    }
    const hashedPassword = await Bun.password.hash(body.newPassword, { algorithm: 'bcrypt', cost: 10 });
    await db.update(accounts).set({ password: hashedPassword }).where(eq(accounts.id, acct.id));
    return { success: true };
  }, {
    body: t.Object({
      currentPassword: t.String(),
      newPassword: t.String(),
    }),
  })

  // POST /api/auth/upload-avatar - загрузка аватара
  .post('/upload-avatar', async ({ body, request, set }) => {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      set.status = 401;
      return { error: { message: 'Необходима авторизация' } };
    }
    const file = body.file;
    if (!file || !file.size) {
      set.status = 400;
      return { error: { message: 'Файл не загружен' } };
    }
    const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'jpg';
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      set.status = 400;
      return { error: { message: 'Только JPG, PNG, GIF, WEBP (макс. 2 МБ)' } };
    }
    if (file.size > 2 * 1024 * 1024) {
      set.status = 400;
      return { error: { message: 'Файл слишком большой (макс. 2 МБ)' } };
    }
    const uploadDir = join(process.cwd(), 'storage', 'avatars');
    await mkdir(uploadDir, { recursive: true });
    const filename = `${userId}_${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);
    const buf = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buf));
    const url = `/api/auth/avatars/${filename}`;
    await db.update(users).set({ image: url, updatedAt: new Date() }).where(eq(users.id, userId));
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
    }),
  })

  // PATCH /api/auth/update-profile - обновление имени и телефона (для client/admin)
  .patch('/update-profile', async ({ body, request, set }) => {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      set.status = 401;
      return { error: { message: 'Необходима авторизация' } };
    }
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    const [updated] = await db.update(users).set(updateData as any).where(eq(users.id, userId)).returning();
    return { user: updated };
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      phone: t.Optional(t.Nullable(t.String())),
    }),
  })

  // GET /api/auth/avatars/:filename - отдача аватара
  .get('/avatars/:filename', async ({ params, set }) => {
    const filepath = join(process.cwd(), 'storage', 'avatars', params.filename);
    try {
      const { readFile } = await import('fs/promises');
      const buf = await readFile(filepath);
      const ext = params.filename.split('.').pop()?.toLowerCase();
      const types: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
      };
      set.headers['Content-Type'] = types[ext || ''] || 'application/octet-stream';
      return buf;
    } catch {
      set.status = 404;
      return 'Not found';
    }
  });
