import { Elysia } from 'elysia';
import { requireAdmin } from './guard';
import { createMailingBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import {
  listMessages, getMessage, createMessage, sendMessage, deleteMessage,
} from './service';

export const adminMailingRoutes = new Elysia({ prefix: '/admin/mailing' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireAdmin(request) }))

  .get('/', () => listMessages())

  .get('/:id', async ({ params, error }) => {
    const msg = await getMessage(params.id);
    if (!msg) return error(404, 'Not found');
    return msg;
  })

  .post('/', ({ user, body }) => createMessage(user.id, body), { body: createMailingBody })

  .post('/:id/send', ({ params }) => sendMessage(params.id))

  .delete('/:id', async ({ params, error }) => {
    const result = await deleteMessage(params.id);
    if (!result) return error(404, 'Not found');
    return result;
  });
