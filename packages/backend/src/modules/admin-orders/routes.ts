import { Elysia } from 'elysia';
import { requireAdmin } from './guard';
import { mapErrorToResponse } from '../../lib/errors';
import { listOrders, deleteOrder, listNearbyDrivers } from './service';

export const adminOrdersRoutes = new Elysia({ prefix: '/admin/orders' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireAdmin(request) }))

  .get('/', ({ query }) => listOrders(query as { search?: string; status?: string }))

  .get('/:id/nearby-drivers', ({ params, query }) => {
    const q = query as { radius?: string; stale_minutes?: string; limit?: string };
    const radius = Number(q.radius ?? 200);
    const stale = Number(q.stale_minutes ?? 30);
    const limit = Number(q.limit ?? 100);
    return listNearbyDrivers(
      params.id,
      Number.isFinite(radius) && radius > 0 ? radius : 200,
      Number.isFinite(stale) && stale > 0 ? stale : 30,
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 100,
    );
  })

  .delete('/:id', ({ params }) => deleteOrder(params.id));
