import { Elysia } from 'elysia';
import { requireAdmin } from './guard';
import { optionalCommentBody, requiredCommentBody, suspendBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import {
  MissingFieldsError,
  getVerificationHistory, verifyDriver, rejectDriver, suspendDriver, restoreDriver,
} from './service';

export const adminDriversVerifyRoutes = new Elysia({ prefix: '/admin/drivers' })
  .onError(({ error, set }) => {
    // /verify: 400 с доп. полем missing_fields — особый contract.
    if (error instanceof MissingFieldsError) {
      set.status = 400;
      return { error: error.code, missing_fields: error.missingFields };
    }
    return mapErrorToResponse(error, set);
  })
  .derive(async ({ request }) => ({ admin: await requireAdmin(request) }))

  .get('/:driverId/verification-history', ({ params }) =>
    getVerificationHistory(params.driverId))

  .post('/:driverId/verify', ({ admin, params, body }) =>
    verifyDriver(admin.id, params.driverId, body.comment), { body: optionalCommentBody })

  .post('/:driverId/reject', ({ admin, params, body }) =>
    rejectDriver(admin.id, params.driverId, body.comment), { body: requiredCommentBody })

  .post('/:driverId/suspend', ({ admin, params, body }) =>
    suspendDriver(admin.id, params.driverId, body.comment), { body: suspendBody })

  .post('/:driverId/restore', ({ admin, params, body }) =>
    restoreDriver(admin.id, params.driverId, body.comment), { body: optionalCommentBody });
