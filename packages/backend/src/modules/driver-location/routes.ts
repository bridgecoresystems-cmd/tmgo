import { Elysia } from 'elysia';
import { requireDriverProfile } from './guard';
import { mapErrorToResponse } from '../../lib/errors';
import { updateLocation } from './service';
import { updateLocationBody } from './schema';

export const cabinetDriverLocationRoutes = new Elysia({ prefix: '/cabinet/driver' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => await requireDriverProfile(request))

  .post('/location', ({ carrierProfile, body }) =>
    updateLocation(carrierProfile, body.lat, body.lng), { body: updateLocationBody });
