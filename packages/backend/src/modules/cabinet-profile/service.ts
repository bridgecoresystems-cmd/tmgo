import { db } from '../../db';
import { users, carrierProfiles } from '../../db/schema';
import { eq } from 'drizzle-orm';

type SessionUser = typeof users.$inferSelect;

export async function switchRole(userId: string, newRole: 'client' | 'driver') {
  const [updated] = await db.update(users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return { user: updated };
}

export async function getUnifiedProfile(user: SessionUser) {
  if (user.role === 'driver') {
    const [profile] = await db.select().from(carrierProfiles)
      .where(eq(carrierProfiles.userId, user.id)).limit(1);
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
}
