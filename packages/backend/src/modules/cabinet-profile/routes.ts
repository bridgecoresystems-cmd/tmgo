import { Elysia, t } from 'elysia';
import { requireProfileUser } from './guard';
import { mapErrorToResponse } from '../../lib/errors';
import { switchRole, getUnifiedProfile } from './service';

export const cabinetProfileRoutes = new Elysia({ prefix: '/cabinet/profile' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireProfileUser(request) }))

  // Переключить роль между client и driver.
  // Неверная роль — 400 с прежней формой тела (фронт читает error.message).
  .patch('/role', ({ user, body, set }) => {
    const newRole = body.role;
    if (newRole !== 'client' && newRole !== 'driver') {
      set.status = 400;
      return { error: { message: 'Недопустимая роль' } };
    }
    return switchRole(user.id, newRole);
  }, { body: t.Object({ role: t.String() }) })

  .get('/', ({ user }) => getUnifiedProfile(user));
