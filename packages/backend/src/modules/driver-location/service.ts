import { eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { carrierProfiles } from '../../db/schema';
import { geoPoint } from '../../db/schema/postgis';

type CarrierProfile = typeof carrierProfiles.$inferSelect;

export async function updateLocation(carrierProfile: CarrierProfile, lat: number, lng: number) {
  const now = new Date();
  await db
    .update(carrierProfiles)
    .set({
      currentLocation: sql`${geoPoint(lat, lng)}`,
      lastLocationAt: now,
    })
    .where(eq(carrierProfiles.id, carrierProfile.id));

  return {
    success: true,
    updated_at: now.toISOString(),
  };
}
