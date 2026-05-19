import { Elysia } from 'elysia';
import { mapErrorToResponse } from '../../lib/errors';
import { stopImpersonation, startImpersonation } from './service';

const isProduction = process.env.NODE_ENV === 'production';
const IMPERSONATE_COOKIE_OPTS = `HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 4}${isProduction ? '; Secure' : ''}`;
const IMPERSONATE_COOKIE_CLEAR = 'better-auth.impersonate_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax';

export const adminImpersonateRoutes = new Elysia({ prefix: '/admin' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))

  // Важно: /stop должен быть раньше /:userId чтобы не перехватился параметром
  .post('/impersonate/stop', async ({ request, set }) => {
    await stopImpersonation(request);
    set.headers['Set-Cookie'] = IMPERSONATE_COOKIE_CLEAR;
    return { success: true };
  })

  .post('/impersonate/:userId', async ({ params, request, set }) => {
    const { token, targetUser } = await startImpersonation(request, params.userId);
    set.headers['Set-Cookie'] = `better-auth.impersonate_token=${token}; ${IMPERSONATE_COOKIE_OPTS}`;
    return { success: true, targetUser };
  });
