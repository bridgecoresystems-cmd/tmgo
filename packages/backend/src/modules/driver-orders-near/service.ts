import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { db } from '../../db';
import { orders, orderCargo, carrierProfiles } from '../../db/schema';

type CarrierProfile = typeof carrierProfiles.$inferSelect;

// Заказы рядом с текущей позицией водителя. По умолчанию radius=50 км.
// Если у водителя ещё нет current_location (мобилка не отправила ни одной точки) —
// возвращаем пустой массив. Это не ошибка, просто «пока пусто».
//
// Фильтр:
//   - status IN (published, negotiating) — открытые заказы
//   - from_geom IS NOT NULL — есть координата погрузки
//   - ST_DWithin(from_geom, driver_loc, radius_meters) — GIST использует индекс
// Сортировка по дистанции от ближайшего.
export async function listOrdersNearDriver(carrierProfile: CarrierProfile, radiusKm: number, limit: number) {
  if (!carrierProfile.currentLocation) return [];

  const radiusMeters = Math.max(1, Math.min(radiusKm, 2000)) * 1000;
  const driverLoc = carrierProfile.currentLocation;

  const rows = await db
    .select({
      id: orders.id,
      title: orders.title,
      status: orders.status,
      fromCountry: orders.fromCountry,
      fromRegion: orders.fromRegion,
      fromCity: orders.fromCity,
      toCountry: orders.toCountry,
      toRegion: orders.toRegion,
      toCity: orders.toCity,
      readyDate: orders.readyDate,
      deadlineDate: orders.deadlineDate,
      price: orders.price,
      currency: orders.currency,
      priceType: orders.priceType,
      cargoType: orderCargo.cargoType,
      weightKg: orderCargo.weightKg,
      volumeM3: orderCargo.volumeM3,
      distanceM: sql<number>`ST_Distance(${orders.fromGeom}, ${driverLoc as unknown as object})::float`,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(orderCargo, eq(orderCargo.orderId, orders.id))
    .where(and(
      inArray(orders.status, ['published', 'negotiating']),
      isNotNull(orders.fromGeom),
      sql`ST_DWithin(${orders.fromGeom}, ${driverLoc as unknown as object}, ${radiusMeters})`,
    ))
    .orderBy(sql`ST_Distance(${orders.fromGeom}, ${driverLoc as unknown as object}) ASC`)
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    from_country: r.fromCountry,
    from_region: r.fromRegion,
    from_city: r.fromCity,
    to_country: r.toCountry,
    to_region: r.toRegion,
    to_city: r.toCity,
    ready_date: r.readyDate,
    deadline_date: r.deadlineDate,
    price: r.price,
    currency: r.currency,
    price_type: r.priceType,
    cargo_type: r.cargoType,
    weight_kg: r.weightKg,
    volume_m3: r.volumeM3,
    distance_km: Math.round((r.distanceM ?? 0) / 100) / 10, // округлено до 0.1 км
    created_at: r.createdAt?.toISOString() ?? null,
  }));
}
