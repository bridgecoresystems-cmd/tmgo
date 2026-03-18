import { Elysia } from 'elysia';
import { db } from '../../db';
import { users, sessions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest, getImpersonateToken } from '../../lib/auth';

const isProduction = process.env.NODE_ENV === 'production';
const IMPERSONATE_COOKIE_OPTS = `HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 4}${isProduction ? '; Secure' : ''}`;
const IMPERSONATE_COOKIE_CLEAR = `better-auth.impersonate_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;

function generateToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

export const adminImpersonateRoutes = new Elysia({ prefix: '/admin' })

  // Важно: /stop должен быть раньше /:userId чтобы не перехватился параметром
  .post('/impersonate/stop', async ({ set }) => {
    set.headers['Set-Cookie'] = IMPERSONATE_COOKIE_CLEAR;
    return { success: true };
  })

  .post('/impersonate/:userId', async ({ params, request, set }) => {
    const admin = await getUserFromRequest(request);
    if (!admin || admin.role !== 'admin') {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    if (admin.id === params.userId) {
      set.status = 400;
      return { error: 'Нельзя войти под собственной учётной записью' };
    }

    // Нельзя impersonate когда сам уже в режиме impersonate
    const alreadyImpersonating = !!getImpersonateToken(request);
    if (alreadyImpersonating) {
      set.status = 400;
      return { error: 'Сначала выйдите из режима просмотра' };
    }

    const [target] = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    if (!target) {
      set.status = 404;
      return { error: 'Пользователь не найден' };
    }

    if (target.role === 'admin') {
      set.status = 403;
      return { error: 'Нельзя войти под другим администратором' };
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 4); // 4 часа

    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId: target.id,
      token,
      expiresAt,
      ipAddress: request.headers.get('X-Forwarded-For') ?? null,
      userAgent: request.headers.get('User-Agent') ?? null,
    });

    set.headers['Set-Cookie'] = `better-auth.impersonate_token=${token}; ${IMPERSONATE_COOKIE_OPTS}`;
    return {
      success: true,
      targetUser: { id: target.id, name: target.name, email: target.email, role: target.role },
    };
  });
