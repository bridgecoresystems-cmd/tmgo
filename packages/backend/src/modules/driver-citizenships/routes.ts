import { Elysia } from 'elysia';
import { requireDriverWithProfile } from './guard';
import { createCitizenshipBody, revokeCitizenshipBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import { listCitizenships, addCitizenship, revokeCitizenship } from './service';

export const cabinetDriverCitizenshipsRoutes = new Elysia({ prefix: '/cabinet/driver/citizenships' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => requireDriverWithProfile(request))

  .get('/', ({ carrierProfile }) => listCitizenships(carrierProfile.id))

  .post('/', ({ carrierProfile, body }) => addCitizenship(carrierProfile, body), {
    body: createCitizenshipBody,
  })

  .delete('/:id', ({ carrierProfile, params }) =>
    revokeCitizenship(carrierProfile, params.id), { body: revokeCitizenshipBody });
