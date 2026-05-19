import { Elysia } from 'elysia';
import { contactBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import { submitContact } from './service';

export const publicContactsRoutes = new Elysia({ prefix: '/public/contacts' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .post('', ({ body }) => submitContact(body), { body: contactBody });
