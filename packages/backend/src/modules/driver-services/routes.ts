import { Elysia } from 'elysia';
import { requireDriverWithProfile } from './guard';
import { createServiceBody, patchServiceBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import {
  listOwnServices, getOwnService, createService, updateService, deleteService,
} from './service';

export const cabinetDriverServicesRoutes = new Elysia({ prefix: '/cabinet/driver/services' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => requireDriverWithProfile(request))

  .get('/', ({ carrierProfile }) => listOwnServices(carrierProfile.id))

  .get('/:id', ({ carrierProfile, params }) => getOwnService(carrierProfile.id, params.id))

  .post('/', ({ carrierProfile, body }) => createService(carrierProfile.id, body), {
    body: createServiceBody,
  })

  .patch('/:id', ({ carrierProfile, params, body }) =>
    updateService(carrierProfile.id, params.id, body), { body: patchServiceBody })

  .delete('/:id', ({ carrierProfile, params }) =>
    deleteService(carrierProfile.id, params.id));
