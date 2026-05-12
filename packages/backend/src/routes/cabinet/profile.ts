import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { users, carrierProfiles } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

/**
 * Унифицированный профиль для driver и client.
 * Driver: имя/фамилия/телефоны из carrier_profiles.
 * Client: имя/телефон из user.
 */
export const cabinetProfileRoutes = new Elysia({ prefix: '/cabinet/profile' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || (user.role !== 'driver' && user.role !== 'client' && user.role !== 'admin')) {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { user };
  })
  // PATCH /cabinet/profile/role — переключить роль между client и driver
  .patch('/role', async ({ user, body, set }) => {
    const newRole = (body as any)?.role
    if (!['client', 'driver'].includes(newRole)) {
      set.status = 400
      return { error: { message: 'Недопустимая роль' } }
    }
    const [updated] = await db.update(users)
      .set({ role: newRole as 'client' | 'driver', updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning()
    return { user: updated }
  })

  .get('/', async ({ user }) => {
    if (user.role === 'driver') {
      const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, user.id)).limit(1);
      const surname = profile?.surname ?? '';
      const givenName = profile?.givenName ?? '';
      const phones = (profile?.phone ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        role: 'driver',
        surname,
        given_name: givenName,
        displayName: [surname, givenName].filter(Boolean).join(' ') || user.name,
        email: user.email,
        image: user.image,
        phones: phones.length ? phones : [],
      };
    }
    return {
      role: user.role,
      name: user.name,
      displayName: user.name,
      email: user.email,
      image: user.image,
      phone: user.phone ?? '',
      phones: user.phone ? user.phone.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
  });
