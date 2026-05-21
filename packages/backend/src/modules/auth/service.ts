import { basename } from 'path';
import { randomUUID } from 'crypto';
import { storage } from '../../lib/storage';
import { db } from '../../db';
import { users, sessions, accounts, verificationTokens } from '../../db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { getImpersonateToken, getUserFromRequest } from '../../lib/auth';
import { sendOtpEmail, sendPasswordResetEmail } from '../../lib/email';

// auth исторически отдаёт РАЗНЫЕ формы тел ошибок ({error:{message}} и {error:'code'}).
// AuthError несёт точное тело и статус — сохраняем contract 1:1.
export class AuthError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super('AuthError');
    this.status = status;
    this.body = body;
  }
}

const isProduction = process.env.NODE_ENV === 'production';
// SameSite=None; Secure — нужно для Capacitor (capacitor://localhost → https://...).
// В dev — Lax без Secure чтобы работал HTTP.
const useSecureSessionCookie = isProduction && (process.env.BETTER_AUTH_URL || '').startsWith('https');

export const COOKIE_OPTS = useSecureSessionCookie
  ? `HttpOnly; SameSite=None; Secure; Path=/; Max-Age=${60 * 60 * 24 * 30}`
  : `HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}`;
export const COOKIE_CLEAR = useSecureSessionCookie
  ? 'better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=None; Secure'
  : 'better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax';

function generateId(len = 32) {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, len - 32);
}

function getToken(request: Request) {
  const cookie = request.headers.get('Cookie') ?? '';
  return cookie.match(/better-auth\.session_token=([^;]+)/)?.[1] ?? null;
}

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

async function createSession(userId: string, request: Request) {
  const token = generateId(64);
  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    userId,
    token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    ipAddress: request.headers.get('X-Forwarded-For') ?? null,
    userAgent: request.headers.get('User-Agent') ?? null,
  });
  return token;
}

export async function getSession(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return { session: null, user: null, isImpersonating: false };
  return {
    session: { id: 'session', expiresAt: new Date(Date.now() + 86400000) },
    user,
    isImpersonating: !!getImpersonateToken(request),
  };
}

export async function signInEmail(
  body: { email: string; password: string },
  request: Request,
) {
  const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
  if (!user) throw new AuthError(401, { error: { message: 'Неверный email или пароль' } });
  if (!user.isActive) throw new AuthError(401, { error: { message: 'Аккаунт деактивирован' } });

  const [acct] = await db.select().from(accounts)
    .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, 'credential')))
    .limit(1);
  if (!acct?.password) throw new AuthError(401, { error: { message: 'Неверный email или пароль' } });

  const valid = await Bun.password.verify(body.password, acct.password);
  if (!valid) throw new AuthError(401, { error: { message: 'Неверный email или пароль' } });

  const token = await createSession(user.id, request);
  return { user, token };
}

export async function signUpEmail(
  body: { email: string; password: string; name?: string; role?: string },
  request: Request,
) {
  const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
  if (existing.length > 0) {
    throw new AuthError(400, { error: { message: 'Пользователь с таким email уже существует' } });
  }

  const hashedPassword = await Bun.password.hash(body.password, { algorithm: 'bcrypt', cost: 10 });
  const userId = crypto.randomUUID();

  await db.insert(users).values({
    id: userId,
    name: body.name || body.email.split('@')[0],
    email: body.email,
    emailVerified: false,
    role: (['client', 'driver'].includes(body.role ?? '') ? body.role : 'client') as 'client' | 'driver',
  });

  await db.insert(accounts).values({
    id: crypto.randomUUID(),
    accountId: body.email,
    providerId: 'credential',
    userId,
    password: hashedPassword,
  });

  const token = await createSession(userId, request);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  // OTP верификации — best-effort, не блокирует ответ.
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await db.delete(verificationTokens).where(
      and(eq(verificationTokens.userId, userId), eq(verificationTokens.type, 'email'))
    );
    await db.insert(verificationTokens).values({
      userId,
      type: 'email',
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    await sendOtpEmail(user.email, code);
  } catch (err) {
    console.warn('[email] Failed to send OTP email:', err);
  }

  return { user, token };
}

export async function signOut(request: Request) {
  const token = getToken(request);
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
}

export async function changePassword(
  body: { currentPassword: string; newPassword: string },
  request: Request,
) {
  const userId = await getUserIdFromToken(request);
  if (!userId) throw new AuthError(401, { error: { message: 'Необходима авторизация' } });

  const [acct] = await db.select().from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'credential')))
    .limit(1);
  if (!acct?.password) throw new AuthError(400, { error: { message: 'Пароль нельзя изменить' } });

  const valid = await Bun.password.verify(body.currentPassword, acct.password);
  if (!valid) throw new AuthError(400, { error: { message: 'Неверный текущий пароль' } });
  if (body.newPassword.length < 6) {
    throw new AuthError(400, { error: { message: 'Пароль должен быть не менее 6 символов' } });
  }

  const hashedPassword = await Bun.password.hash(body.newPassword, { algorithm: 'bcrypt', cost: 10 });
  await db.update(accounts).set({ password: hashedPassword }).where(eq(accounts.id, acct.id));

  // Инвалидируем все сессии и создаём новую для текущего запроса.
  await db.delete(sessions).where(eq(sessions.userId, userId));
  const token = await createSession(userId, request);
  return { token };
}

export async function uploadAvatar(request: Request, file: { name?: string; size: number; arrayBuffer(): Promise<ArrayBuffer> } | undefined) {
  const userId = await getUserIdFromToken(request);
  if (!userId) throw new AuthError(401, { error: { message: 'Необходима авторизация' } });

  if (!file || !file.size) throw new AuthError(400, { error: { message: 'Файл не загружен' } });
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'jpg';
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    throw new AuthError(400, { error: { message: 'Только JPG, PNG, GIF, WEBP (макс. 2 МБ)' } });
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new AuthError(400, { error: { message: 'Файл слишком большой (макс. 2 МБ)' } });
  }

  const safeUserId = userId.replace(/[^a-z0-9-]/gi, '');
  const filename = `${safeUserId}_${randomUUID()}.${ext}`;
  await storage.put(`avatars/${filename}`, await file.arrayBuffer());
  const url = `/api/auth/avatars/${filename}`;
  await db.update(users).set({ image: url, updatedAt: new Date() }).where(eq(users.id, userId));
  return { url };
}

export async function updateProfile(
  request: Request,
  body: { name?: string; phone?: string | null },
) {
  const userId = await getUserIdFromToken(request);
  if (!userId) throw new AuthError(401, { error: { message: 'Необходима авторизация' } });

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.phone !== undefined) updateData.phone = body.phone;
  const [updated] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
  return { user: updated };
}

export async function sendVerification(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) throw new AuthError(401, { error: 'Unauthorized' });
  if (user.emailVerified) return { message: 'already_verified' };

  await db.delete(verificationTokens).where(
    and(eq(verificationTokens.userId, user.id), eq(verificationTokens.type, 'email'))
  );
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await db.insert(verificationTokens).values({
    userId: user.id,
    type: 'email',
    code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  await sendOtpEmail(user.email, code);
  return { success: true };
}

export async function verifyEmailCode(request: Request, code: string) {
  const userId = await getUserIdFromToken(request);
  if (!userId) throw new AuthError(401, { error: { message: 'Необходима авторизация' } });

  const [verToken] = await db.select().from(verificationTokens)
    .where(and(
      eq(verificationTokens.userId, userId),
      eq(verificationTokens.type, 'email'),
      eq(verificationTokens.code, code),
      gt(verificationTokens.expiresAt, new Date()),
      isNull(verificationTokens.usedAt),
    )).limit(1);
  if (!verToken) throw new AuthError(400, { error: { message: 'Неверный или просроченный код' } });

  await db.update(verificationTokens).set({ usedAt: new Date() }).where(eq(verificationTokens.id, verToken.id));
  await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.id, userId));
  return { success: true };
}

export async function forgotPassword(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new AuthError(404, { error: { message: 'Пользователь с таким email не найден' } });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await db.delete(verificationTokens).where(
    and(eq(verificationTokens.userId, user.id), eq(verificationTokens.type, 'password_reset'))
  );
  await db.insert(verificationTokens).values({
    userId: user.id,
    type: 'password_reset',
    code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  await sendPasswordResetEmail(email, code);
  return { success: true };
}

export async function resetPassword(email: string, code: string, password: string) {
  if (password.length < 6) {
    throw new AuthError(400, { error: { message: 'Пароль должен быть не менее 6 символов' } });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new AuthError(400, { error: { message: 'Неверный или просроченный код' } });

  const [resetToken] = await db.select().from(verificationTokens)
    .where(and(
      eq(verificationTokens.userId, user.id),
      eq(verificationTokens.type, 'password_reset'),
      eq(verificationTokens.code, code),
      gt(verificationTokens.expiresAt, new Date()),
      isNull(verificationTokens.usedAt),
    )).limit(1);
  if (!resetToken) throw new AuthError(400, { error: { message: 'Неверный или просроченный код' } });

  const hashedPassword = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
  await db.update(accounts)
    .set({ password: hashedPassword })
    .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, 'credential')));
  await db.update(verificationTokens).set({ usedAt: new Date() }).where(eq(verificationTokens.id, resetToken.id));
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  return { success: true };
}

// Возвращает URL для редиректа (route ставит 302). Ошибки — через AuthError.
export async function verifyEmail(token: string | undefined) {
  if (!token) throw new AuthError(400, { error: 'token_required' });

  const [verToken] = await db.select().from(verificationTokens)
    .where(eq(verificationTokens.token, token))
    .limit(1);
  if (!verToken) throw new AuthError(400, { error: 'token_not_found' });
  if (verToken.expiresAt < new Date()) throw new AuthError(400, { error: 'token_expired' });
  if (verToken.usedAt) throw new AuthError(400, { error: 'token_used' });

  await db.update(verificationTokens).set({ usedAt: new Date() }).where(eq(verificationTokens.id, verToken.id));
  await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.id, verToken.userId));

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl}/cabinet?verified=true`;
}

const AVATAR_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
};

export async function readAvatar(filename: string) {
  const buf = await storage.get(`avatars/${basename(filename)}`);
  if (!buf) return null;
  const ext = filename.split('.').pop()?.toLowerCase();
  return { buf, contentType: AVATAR_TYPES[ext || ''] || 'application/octet-stream' };
}
