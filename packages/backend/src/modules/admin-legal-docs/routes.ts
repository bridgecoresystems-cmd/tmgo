import { Elysia } from 'elysia';
import { requireAdmin } from './guard';
import { upsertLegalDocBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import {
  listLegalDocs, getLegalDoc, upsertLegalDoc, setLegalDocPublished, getPublishedLegalDoc,
} from './service';

export const adminLegalDocsRoutes = new Elysia({ prefix: '/admin/legal-docs' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireAdmin(request) }))

  .get('/', () => listLegalDocs())

  .get('/:docType/:locale', ({ params }) => getLegalDoc(params.docType, params.locale))

  .put('/:docType/:locale', ({ user, params, body }) =>
    upsertLegalDoc(params.docType, params.locale, user.id, body), { body: upsertLegalDocBody })

  .post('/:docType/:locale/publish', ({ params }) =>
    setLegalDocPublished(params.docType, params.locale, true))

  .post('/:docType/:locale/unpublish', ({ params }) =>
    setLegalDocPublished(params.docType, params.locale, false));

// Public route (no auth required)
export const publicLegalDocsRoutes = new Elysia({ prefix: '/legal' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .get('/:docType/:locale', ({ params }) =>
    getPublishedLegalDoc(params.docType, params.locale));
