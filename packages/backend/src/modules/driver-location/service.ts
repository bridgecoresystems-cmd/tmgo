import { and, eq, gt, isNotNull, sql } from 'drizzle-orm';
import { db } from '../../db';
import { carrierProfiles, users } from '../../db/schema';
import { geoPoint, geoLat, geoLng } from '../../db/schema/postgis';

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

// Список водителей, которые недавно слали координату (по умолчанию — за 5 минут).
// Используется в админ-карте: показываем только «свежих». Сортировка — последняя
// активность сверху, чтобы в выпадушках/списках были самые актуальные.
export async function listOnlineDriverLocations(staleMinutes = 5) {
  const cutoff = new Date(Date.now() - staleMinutes * 60_000);

  const rows = await db
    .select({
      id: carrierProfiles.id,
      userId: carrierProfiles.userId,
      name: users.name,
      surname: carrierProfiles.surname,
      givenName: carrierProfiles.givenName,
      lat: geoLat(carrierProfiles.currentLocation),
      lng: geoLng(carrierProfiles.currentLocation),
      lastLocationAt: carrierProfiles.lastLocationAt,
      isOnline: carrierProfiles.isOnline,
      verificationStatus: carrierProfiles.verificationStatus,
    })
    .from(carrierProfiles)
    .innerJoin(users, eq(users.id, carrierProfiles.userId))
    .where(and(
      isNotNull(carrierProfiles.currentLocation),
      gt(carrierProfiles.lastLocationAt, cutoff),
    ))
    .orderBy(sql`${carrierProfiles.lastLocationAt} DESC`);

  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    // Полное имя: surname+givenName из карточки, fallback на users.name.
    name: [r.surname, r.givenName].filter(Boolean).join(' ').trim() || r.name,
    lat: r.lat,
    lng: r.lng,
    last_location_at: r.lastLocationAt?.toISOString() ?? null,
    is_online: r.isOnline ?? false,
    verification_status: r.verificationStatus ?? 'not_submitted',
  }));
}
