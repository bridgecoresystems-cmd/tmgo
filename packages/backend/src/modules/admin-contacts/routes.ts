import { Elysia } from 'elysia';
import { requireAdmin } from './guard';
import { updateStatusBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import { listContactMessages, setContactStatus } from './service';

export const adminContactsRoutes = new Elysia({ prefix: '/admin/contacts' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireAdmin(request) }))

  .get('', () => listContactMessages())

  .patch('/:id/status', ({ params, body }) => setContactStatus(params.id, body.status), {
    body: updateStatusBody,
  });
