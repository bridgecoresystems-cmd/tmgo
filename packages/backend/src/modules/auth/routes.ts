// Официант: куки/заголовки/redirect — здесь (HTTP-слой), вся логика — в service.
import { Elysia } from 'elysia';
import { rateLimit } from 'elysia-rate-limit';
import {
  signInBody, signUpBody, changePasswordBody, uploadAvatarBody, updateProfileBody,
  verifyEmailCodeBody, forgotPasswordBody, resetPasswordBody,
} from './schema';
import {
  AuthError, COOKIE_OPTS, COOKIE_CLEAR,
  getSession, signInEmail, signUpEmail, signOut, changePassword,
  uploadAvatar, updateProfile, sendVerification, verifyEmail, readAvatar,
  verifyEmailCode, forgotPassword, resetPassword,
} from './service';

const signInRateLimit = rateLimit({
  max: 10,
  duration: 15 * 60 * 1000,
  generator: (req, server) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : server?.requestIP?.(req)?.address ?? 'unknown';
    return `signin:${ip}`;
  },
  skip: (req) => {
    try {
      const url = new URL(req.url);
      const p = url.pathname;
    if (req.method !== 'POST') return true;
    return !(p.endsWith('/sign-in/email') || p.endsWith('/forgot-password'));
    } catch {
      return true;
    }
  },
  errorResponse: new Response(
    JSON.stringify({ error: { message: 'Слишком много попыток входа. Попробуйте через 15 минут.' } }),
    { status: 429, headers: { 'Content-Type': 'application/json' } },
  ),
});

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(signInRateLimit)
  .onError(({ error, set }) => {
    if (error instanceof AuthError) {
      set.status = error.status;
      return error.body;
    }
    return undefined;
  })

  .get('/get-session', ({ request }) => getSession(request))

  .post('/sign-in/email', async ({ body, set, request }) => {
    const { user, token } = await signInEmail(body, request);
    set.headers['Set-Cookie'] = `better-auth.session_token=${token}; ${COOKIE_OPTS}`;
    return { user };
  }, { body: signInBody })

  .post('/sign-up/email', async ({ body, set, request }) => {
    const { user, token } = await signUpEmail(body, request);
    set.headers['Set-Cookie'] = `better-auth.session_token=${token}; ${COOKIE_OPTS}`;
    return { user };
  }, { body: signUpBody })

  .post('/sign-out', async ({ request, set }) => {
    await signOut(request);
    set.headers['Set-Cookie'] = COOKIE_CLEAR;
    return { success: true };
  })

  .post('/change-password', async ({ body, request, set }) => {
    const { token } = await changePassword(body, request);
    set.headers['Set-Cookie'] = `better-auth.session_token=${token}; ${COOKIE_OPTS}`;
    return { success: true };
  }, { body: changePasswordBody })

  .post('/upload-avatar', ({ body, request }) => uploadAvatar(request, body.file), {
    body: uploadAvatarBody,
  })

  .patch('/update-profile', ({ body, request }) => updateProfile(request, body), {
    body: updateProfileBody,
  })

  .post('/send-verification', ({ request }) => sendVerification(request))

  .get('/verify-email', async ({ query, set }) => {
    const redirectUrl = await verifyEmail((query as { token?: string }).token);
    set.status = 302;
    set.headers['Location'] = redirectUrl;
    return null;
  })

  .post('/verify-email-code', ({ body, request }) => verifyEmailCode(request, body.code), {
    body: verifyEmailCodeBody,
  })

  .post('/forgot-password', ({ body }) => forgotPassword(body.email), {
    body: forgotPasswordBody,
  })

  .post('/reset-password', ({ body }) => resetPassword(body.email, body.code, body.password), {
    body: resetPasswordBody,
  })

  .get('/avatars/:filename', async ({ params, set }) => {
    const result = await readAvatar(params.filename);
    if (!result) {
      set.status = 404;
      return 'Not found';
    }
    set.headers['Content-Type'] = result.contentType;
    return result.buf;
  });
