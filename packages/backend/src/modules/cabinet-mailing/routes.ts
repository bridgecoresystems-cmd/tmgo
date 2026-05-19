import { Elysia } from 'elysia';
import { requireUser } from './guard';
import { mapErrorToResponse } from '../../lib/errors';
import { listInbox, markAllRead, markRead } from './service';

export const cabinetMailingRoutes = new Elysia({ prefix: '/cabinet/mailing' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireUser(request) }))

  .get('/', ({ user }) => listInbox(user.id))

  .post('/read-all', ({ user }) => markAllRead(user.id))

  .post('/:id/read', ({ user, params }) => markRead(user.id, params.id));
