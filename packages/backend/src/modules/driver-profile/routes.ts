import { Elysia } from 'elysia';
import { requireDriverProfile } from './guard';
import { mapErrorToResponse } from '../../lib/errors';
import {
  getProfile, getVerificationStatus, listEditRequests,
  updateProfile, updateOnlineStatus,
  submitForVerification, resubmitProfile, createChangeRequest,
  uploadPassport, uploadExtraPassport, uploadLicense, uploadMedical,
} from './service';
import {
  updateProfileBody, submitForVerificationBody, resubmitBody,
  onlineStatusBody, changeRequestBody, uploadFileBody, uploadExtraPassportBody,
} from './schema';

export const cabinetDriverProfileRoutes = new Elysia({ prefix: '/cabinet/driver/profile' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => await requireDriverProfile(request))

  .get('/', ({ user, carrierProfile }) => getProfile(user, carrierProfile))

  .get('/verification-status', ({ carrierProfile }) => getVerificationStatus(carrierProfile))

  .get('/edit-requests', ({ carrierProfile }) => listEditRequests(carrierProfile))

  .patch('/', ({ carrierProfile, body }) =>
    updateProfile(carrierProfile, body as Record<string, unknown>), { body: updateProfileBody })

  .patch('/online-status', ({ carrierProfile, body }) =>
    updateOnlineStatus(carrierProfile, body.is_online), { body: onlineStatusBody })

  .post('/submit-for-verification', ({ carrierProfile, body }) =>
    submitForVerification(carrierProfile, body as Record<string, unknown>), { body: submitForVerificationBody })

  .post('/resubmit', ({ carrierProfile, body }) =>
    resubmitProfile(carrierProfile, body as Record<string, unknown> | undefined), { body: resubmitBody })

  .post('/change-request', ({ carrierProfile, body }) =>
    createChangeRequest(carrierProfile, body), { body: changeRequestBody })

  .post('/upload-passport', ({ carrierProfile, body }) =>
    uploadPassport(carrierProfile, body.file), { body: uploadFileBody })

  .post('/upload-extra-passport', ({ carrierProfile, body }) =>
    uploadExtraPassport(carrierProfile, body.file, body.index), { body: uploadExtraPassportBody })

  .post('/upload-license', ({ carrierProfile, body }) =>
    uploadLicense(carrierProfile, body.file), { body: uploadFileBody })

  .post('/upload-medical', ({ carrierProfile, body }) =>
    uploadMedical(carrierProfile, body.file), { body: uploadFileBody });
