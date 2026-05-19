import { Elysia } from 'elysia';
import { requireAdmin } from './guard';
import { patchProgressBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import { getRoadmapProgress, saveRoadmapProgress } from './service';

export const adminMvpRoadmapRoutes = new Elysia({ prefix: '/admin/mvp-roadmap' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireAdmin(request) }))

  .get('/progress', () => getRoadmapProgress())

  .patch('/progress', ({ user, body }) => saveRoadmapProgress(user.id, body.tasks), {
    body: patchProgressBody,
  });
