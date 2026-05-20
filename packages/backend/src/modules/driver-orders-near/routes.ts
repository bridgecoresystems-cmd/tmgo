import { Elysia } from 'elysia';
import { requireDriverProfile } from './guard';
import { mapErrorToResponse } from '../../lib/errors';
import { listOrdersNearDriver } from './service';

export const cabinetDriverOrdersNearRoutes = new Elysia({ prefix: '/cabinet/driver/orders' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => await requireDriverProfile(request))

  .get('/near', ({ carrierProfile, query }) => {
    const q = query as { radius?: string; limit?: string };
    const radius = Number(q.radius ?? 50);
    const limit = Number(q.limit ?? 100);
    return listOrdersNearDriver(
      carrierProfile,
      Number.isFinite(radius) && radius > 0 ? radius : 50,
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 100,
    );
  });
