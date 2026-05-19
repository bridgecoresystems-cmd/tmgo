import { Elysia } from 'elysia';
import { requireDriverWithProfile } from './guard';
import { createChangeRequestBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import {
  listChangeRequests, listUnlockedKeys, createChangeRequest, cancelChangeRequest,
} from './service';

export const cabinetDriverChangeRequestsRoutes = new Elysia({ prefix: '/cabinet/driver/change-requests' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => requireDriverWithProfile(request))

  .get('/', ({ carrierProfile }) => listChangeRequests(carrierProfile.id))

  .get('/unlocked', ({ carrierProfile }) => listUnlockedKeys(carrierProfile.id))

  .post('/', ({ carrierProfile, body }) => createChangeRequest(carrierProfile, body), {
    body: createChangeRequestBody,
  })

  .delete('/:requestId', ({ carrierProfile, params }) =>
    cancelChangeRequest(carrierProfile.id, params.requestId));
