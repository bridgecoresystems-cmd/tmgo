import { Elysia } from 'elysia';
import { requireAdmin } from './guard';
import { mapErrorToResponse } from '../../lib/errors';
import {
  PlainError,
  createUser, listUsers, getUser, updateUser, activateUser, deactivateUser, deleteUser,
  getDriverProfile, updateDriverProfile,
  listEditRequests, listChangeRequests, approveEditRequest, verifyDriver,
  uploadPassportScan, uploadExtraPassportScan, uploadLicenseScan, uploadMedicalScan,
  listAdminDocuments, updateAdminDocument, deleteAdminDocument, updateAdminDocumentStatus,
  uploadDocumentScan, createAdminDocument,
} from './service';
import {
  createUserBody, updateUserBody, updateDriverProfileBody,
  uploadFileBody, uploadExtraPassportBody, uploadDocumentBody,
  updateDocumentBody, updateDocumentStatusBody, createDocumentBody,
} from './schema';

export const adminUsersRoutes = new Elysia({ prefix: '/admin/users' })
  // PlainError → raw-string body (исторический контракт error()).
  // Остальные AppError → {error: code} через mapErrorToResponse.
  .onError(({ error, set }) => {
    if (error instanceof PlainError) {
      set.status = error.status;
      return error.code;
    }
    return mapErrorToResponse(error, set);
  })
  .derive(async ({ request }) => ({ adminUser: await requireAdmin(request) }))

  .post('/', ({ body }) => createUser(body), { body: createUserBody })

  .get('/', ({ query }) => listUsers(query as Record<string, string | undefined>))

  .get('/:id', ({ params }) => getUser(params.id))

  .patch('/:id', ({ params, body }) => updateUser(params.id, body), { body: updateUserBody })

  .post('/:id/activate', ({ params }) => activateUser(params.id))

  .post('/:id/deactivate', ({ params }) => deactivateUser(params.id))

  .delete('/:id', ({ params }) => deleteUser(params.id))

  .get('/:id/driver-profile', ({ params }) => getDriverProfile(params.id))

  .patch('/:id/driver-profile', ({ params, body }) =>
    updateDriverProfile(params.id, body as Record<string, unknown>),
  { body: updateDriverProfileBody })

  .get('/:id/edit-requests', ({ params }) => listEditRequests(params.id))

  .get('/:id/change-requests', ({ params, query }) =>
    listChangeRequests(params.id, (query as { status?: string }).status))

  .post('/:id/edit-requests/:requestId/approve', ({ params, adminUser }) =>
    approveEditRequest(params.id, params.requestId, adminUser?.id ?? null))

  .post('/:id/verify', ({ params }) => verifyDriver(params.id))

  .post('/:id/driver-profile/upload-passport', ({ params, body }) =>
    uploadPassportScan(params.id, body.file), { body: uploadFileBody })

  .post('/:id/driver-profile/upload-extra-passport', ({ params, body }) =>
    uploadExtraPassportScan(params.id, body.file, body.index), { body: uploadExtraPassportBody })

  .post('/:id/driver-profile/upload-license', ({ params, body }) =>
    uploadLicenseScan(params.id, body.file), { body: uploadFileBody })

  .post('/:id/driver-profile/upload-medical', ({ params, body }) =>
    uploadMedicalScan(params.id, body.file), { body: uploadFileBody })

  // ── driverDocuments (паспорта/ВУ из «Добавить документы») ──
  .get('/:id/documents', ({ params }) => listAdminDocuments(params.id))

  .patch('/:id/documents/:docId', ({ params, body }) =>
    updateAdminDocument(params.id, params.docId, body), { body: updateDocumentBody })

  .delete('/:id/documents/:docId', ({ params }) =>
    deleteAdminDocument(params.id, params.docId))

  .patch('/:id/documents/:docId/status', ({ params, body }) =>
    updateAdminDocumentStatus(params.id, params.docId, body.status),
  { body: updateDocumentStatusBody })

  .post('/:id/documents/upload', ({ params, body }) =>
    uploadDocumentScan(params.id, body.file, body.doc_type), { body: uploadDocumentBody })

  .post('/:id/documents', ({ params, body }) =>
    createAdminDocument(params.id, body), { body: createDocumentBody });
