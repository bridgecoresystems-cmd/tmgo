import { Elysia } from 'elysia';
import { requireAdmin } from './guard';
import { mapErrorToResponse } from '../../lib/errors';
import { getDashboardStats } from './service';

export const adminDashboardRoutes = new Elysia({ prefix: '/admin/dashboard' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireAdmin(request) }))

  .get('/stats', () => getDashboardStats());
