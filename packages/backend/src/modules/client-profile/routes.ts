import { Elysia } from 'elysia';
import { requireUser } from './guard';
import { createProfileBody, patchProfileBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import { getProfile, createProfile, updateProfile } from './service';

export const cabinetClientProfileRoutes = new Elysia({ prefix: '/cabinet/client/profile' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireUser(request) }))

  .get('/', ({ user }) => getProfile(user.id))

  .post('/', ({ user, body }) => createProfile(user.id, body), { body: createProfileBody })

  .patch('/', ({ user, body }) => updateProfile(user.id, body), { body: patchProfileBody });
