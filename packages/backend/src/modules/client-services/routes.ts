import { Elysia } from 'elysia';
import { requireClient } from './guard';
import { mapErrorToResponse } from '../../lib/errors';
import { listActiveServices, getActiveService } from './service';

export const cabinetClientServicesRoutes = new Elysia({ prefix: '/cabinet/client/services' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireClient(request) }))

  .get('/', () => listActiveServices())

  .get('/:id', ({ params }) => getActiveService(params.id));
