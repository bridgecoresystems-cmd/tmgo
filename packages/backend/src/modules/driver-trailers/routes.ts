import { Elysia } from 'elysia';
import { requireDriverWithProfile } from './guard';
import { createTrailerBody, patchTrailerBody, createCouplingBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import {
  listTrailers, createTrailer, getTrailer, updateTrailer, deleteTrailer,
  listCouplings, createCoupling, deleteCoupling,
} from './service';

export const cabinetDriverTrailersRoutes = new Elysia({ prefix: '/cabinet/driver/trailers' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => requireDriverWithProfile(request))

  .get('/', ({ carrierProfile }) => listTrailers(carrierProfile.id))

  .post('/', ({ carrierProfile, body }) => createTrailer(carrierProfile.id, body), {
    body: createTrailerBody,
  })

  .get('/:id', ({ carrierProfile, params }) => getTrailer(carrierProfile.id, params.id))

  .patch('/:id', ({ carrierProfile, params, body }) =>
    updateTrailer(carrierProfile.id, params.id, body), { body: patchTrailerBody })

  .delete('/:id', ({ carrierProfile, params }) => deleteTrailer(carrierProfile.id, params.id));

export const cabinetDriverCouplingsRoutes = new Elysia({ prefix: '/cabinet/driver/couplings' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => requireDriverWithProfile(request))

  .get('/', ({ carrierProfile }) => listCouplings(carrierProfile.id))

  .post('/', ({ carrierProfile, body }) => createCoupling(carrierProfile.id, body), {
    body: createCouplingBody,
  })

  .delete('/:id', ({ carrierProfile, params }) => deleteCoupling(carrierProfile.id, params.id));
