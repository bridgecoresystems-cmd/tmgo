// Только driver. Дополнительно резолвит (создаёт при отсутствии) carrier_profile.
import { db } from '../../db';
import { carrierProfiles } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '../../lib/guard';
import { ROLES } from '../../constants/roles';

export async function requireDriverWithProfile(request: Request) {
  const user = await requireRole(request, ROLES.DRIVER);
  let [profile] = await db.select().from(carrierProfiles)
    .where(eq(carrierProfiles.userId, user.id)).limit(1);
  if (!profile) {
    const [created] = await db.insert(carrierProfiles).values({ userId: user.id }).returning();
    profile = created!;
  }
  return { user, carrierProfile: profile };
}
