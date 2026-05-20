import { Elysia } from 'elysia';
import { requireAdmin } from './guard';
import { patchVehicleBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import {
  listMakes, listModels, listAllVehicles, getVehicle, updateVehicle,
  activateVehicle, deactivateVehicle,
} from './service';

export const adminVehiclesRoutes = new Elysia({ prefix: '/admin/vehicles' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ admin: await requireAdmin(request) }))

  .get('/makes', () => listMakes())

  .get('/makes/:makeId/models', ({ params, query }) =>
    listModels(params.makeId, (query as { vehicleType?: string }).vehicleType))

  .get('/', ({ query }) => listAllVehicles(query as {
    include_inactive?: string; inactive_only?: string; search?: string;
  }))

  .get('/:id', ({ params }) => getVehicle(params.id))

  .patch('/:id', ({ params, body }) => updateVehicle(params.id, body), { body: patchVehicleBody })

  .post('/:id/activate', ({ params }) => activateVehicle(params.id))

  .post('/:id/deactivate', ({ params }) => deactivateVehicle(params.id));
