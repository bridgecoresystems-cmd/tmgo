import { Elysia } from 'elysia';
import { requireDriverWithProfile } from './guard';
import { createVehicleBody, patchVehicleBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import {
  listMakes, listModels, listVehicles, createVehicle, getVehicle, updateVehicle, deleteVehicle,
} from './service';

export const cabinetDriverVehiclesRoutes = new Elysia({ prefix: '/cabinet/driver/vehicles' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => requireDriverWithProfile(request))

  .get('/makes', () => listMakes())

  .get('/makes/:makeId/models', ({ params, query }) =>
    listModels(params.makeId, (query as { vehicleType?: string }).vehicleType))

  .get('/', ({ carrierProfile }) => listVehicles(carrierProfile.id))

  .post('/', ({ carrierProfile, body }) => createVehicle(carrierProfile.id, body), {
    body: createVehicleBody,
  })

  .get('/:id', ({ carrierProfile, params }) => getVehicle(carrierProfile.id, params.id))

  .patch('/:id', ({ carrierProfile, params, body }) =>
    updateVehicle(carrierProfile.id, params.id, body), { body: patchVehicleBody })

  .delete('/:id', ({ carrierProfile, params }) => deleteVehicle(carrierProfile.id, params.id));
