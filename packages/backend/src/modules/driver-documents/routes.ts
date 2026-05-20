import { Elysia } from 'elysia';
import { requireDriverWithProfile } from './guard';
import { createDocBody, patchDocBody, renewDocBody, uploadDocBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import {
  listDocuments, getDocument, createDocument, updateDocument,
  renewDocument, deleteDocument, uploadScan,
} from './service';

export const cabinetDriverDocumentsRoutes = new Elysia({ prefix: '/cabinet/driver/documents' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => requireDriverWithProfile(request))

  .get('/', ({ carrierProfile, query }) =>
    listDocuments(carrierProfile.id, (query as { show_history?: string }).show_history === 'true'))

  .get('/:id', ({ carrierProfile, params }) => getDocument(carrierProfile.id, params.id))

  .post('/', ({ carrierProfile, body }) => createDocument(carrierProfile, body), {
    body: createDocBody,
  })

  .patch('/:id', ({ carrierProfile, params, body }) =>
    updateDocument(carrierProfile, params.id, body), { body: patchDocBody })

  .post('/:id/renew', ({ carrierProfile, params, body }) =>
    renewDocument(carrierProfile, params.id, body), { body: renewDocBody })

  .delete('/:id', ({ carrierProfile, params }) => deleteDocument(carrierProfile, params.id))

  .post('/upload', ({ carrierProfile, body }) =>
    uploadScan(carrierProfile.id, (body as { doc_type?: string }).doc_type || 'document', body.file), {
    body: uploadDocBody,
  });
