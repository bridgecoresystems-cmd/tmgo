import { Elysia } from 'elysia';
import { requireDriverProfile, requireAdmin } from './guard';
import { mapErrorToResponse } from '../../lib/errors';
import { updateLocation, listOnlineDriverLocations } from './service';
import { updateLocationBody } from './schema';

export const cabinetDriverLocationRoutes = new Elysia({ prefix: '/cabinet/driver' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => await requireDriverProfile(request))

  .post('/location', ({ carrierProfile, body }) =>
    updateLocation(carrierProfile, body.lat, body.lng), { body: updateLocationBody });

export const adminDriverLocationsRoutes = new Elysia({ prefix: '/admin/drivers' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ adminUser: await requireAdmin(request) }))

  .get('/online-locations', ({ query }) => {
    const stale = Number((query as { stale_minutes?: string }).stale_minutes ?? 5);
    return listOnlineDriverLocations(Number.isFinite(stale) && stale > 0 ? stale : 5);
  });
