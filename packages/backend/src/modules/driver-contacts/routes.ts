import { Elysia } from 'elysia';
import { requireDriverWithProfile } from './guard';
import { createContactBody, patchContactBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import { listContacts, createContact, updateContact, deleteContact } from './service';

export const cabinetDriverContactsRoutes = new Elysia({ prefix: '/cabinet/driver/contacts' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => requireDriverWithProfile(request))

  .get('/', ({ carrierProfile }) => listContacts(carrierProfile.id))

  .post('/', ({ carrierProfile, body }) => createContact(carrierProfile.id, body), {
    body: createContactBody,
  })

  .patch('/:id', ({ carrierProfile, params, body }) =>
    updateContact(carrierProfile.id, params.id, body), { body: patchContactBody })

  .delete('/:id', ({ carrierProfile, params }) =>
    deleteContact(carrierProfile.id, params.id));
