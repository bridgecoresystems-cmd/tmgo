import { Elysia } from 'elysia';
import { requireAdmin } from './guard';
import { mapErrorToResponse } from '../../lib/errors';
import { listOrders, deleteOrder } from './service';

export const adminOrdersRoutes = new Elysia({ prefix: '/admin/orders' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireAdmin(request) }))

  .get('/', ({ query }) => listOrders(query as { search?: string; status?: string }))

  .delete('/:id', ({ params }) => deleteOrder(params.id));
