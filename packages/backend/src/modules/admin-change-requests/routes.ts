import { Elysia } from 'elysia';
import { requireAdmin } from './guard';
import { approveBody, rejectBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import { listChangeRequests, approveChangeRequest, rejectChangeRequest } from './service';

export const adminChangeRequestsRoutes = new Elysia({ prefix: '/admin/change-requests' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ admin: await requireAdmin(request) }))

  .get('/', ({ query }) => listChangeRequests(query as { status?: string; page?: string }))

  .post('/:requestId/approve', ({ admin, params, body }) =>
    approveChangeRequest(admin.id, params.requestId, body), { body: approveBody })

  .post('/:requestId/reject', ({ admin, params, body }) =>
    rejectChangeRequest(admin.id, params.requestId, body), { body: rejectBody });
