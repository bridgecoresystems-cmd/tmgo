import { db } from '../../db';
import { orders, clientProfiles, carrierProfiles, orderBids, orderCargo, users } from '../../db/schema';
import { and, desc, eq, gt, inArray, isNotNull, sql } from 'drizzle-orm';
import { NotFound } from '../../lib/errors';

export async function listOrders(query: { search?: string; status?: string }) {
  const { search, status } = query;

  const allOrders = await db.select({
    id: orders.id,
    seqNo: orders.seqNo,
    title: orders.title,
    status: orders.status,
    price: orders.price,
    currency: orders.currency,
    fromCity: orders.fromCity,
    toCity: orders.toCity,
    createdAt: orders.createdAt,
    clientName: clientProfiles.displayName,
    carrierName: carrierProfiles.givenName,
    carrierSurname: carrierProfiles.surname,
    cargoType: orderCargo.cargoType,
    weight: orderCargo.weightKg,
  })
    .from(orders)
    .leftJoin(clientProfiles, eq(orders.clientProfileId, clientProfiles.id))
    .leftJoin(orderBids, eq(orders.acceptedBidId, orderBids.id))
    .leftJoin(carrierProfiles, eq(orderBids.carrierProfileId, carrierProfiles.id))
    .leftJoin(orderCargo, eq(orders.id, orderCargo.orderId))
    .orderBy(desc(orders.createdAt));

  let filtered = allOrders;
  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((o) =>
      (o.seqNo && o.seqNo.toString().includes(s)) ||
      o.title.toLowerCase().includes(s) ||
      o.clientName?.toLowerCase().includes(s) ||
      o.fromCity.toLowerCase().includes(s) ||
      o.toCity.toLowerCase().includes(s),
    );
  }

  return filtered.map((o) => ({
    id: o.id,
    shortId: `ORD${o.seqNo}`,
    client: o.clientName || '---',
    carrier: o.carrierName ? `${o.carrierName} ${o.carrierSurname || ''}`.trim() : null,
    route: `${o.fromCity} → ${o.toCity}`,
    status: o.status,
    price: parseFloat(o.price || '0').toLocaleString('ru-RU'),
    date: new Date(o.createdAt).toLocaleDateString('ru-RU'),
    cargoType: o.cargoType || '---',
    weight: o.weight || '0',
    title: o.title,
  }));
}

export async function deleteOrder(id: string) {
  await db.delete(orders).where(eq(orders.id, id));
  return { success: true };
}

// Водители рядом с пунктом погрузки конкретного заказа.
// Используется в админ-карте/панели заказа: «кому показать груз», «кто рядом».
// По умолчанию radius=200 км, окно свежести last_location 30 минут.
//
// Возвращает пустой массив если у заказа нет from_geom (старые заказы или
// клиент не передал координаты).
export async function listNearbyDrivers(
  orderId: string,
  radiusKm: number,
  staleMinutes: number,
  limit: number,
) {
  const [order] = await db.select({ fromGeom: orders.fromGeom })
    .from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new NotFound('not_found');
  if (!order.fromGeom) return [];

  const radiusMeters = Math.max(1, Math.min(radiusKm, 5000)) * 1000;
  const cutoff = new Date(Date.now() - staleMinutes * 60_000);
  const fromGeom = order.fromGeom as unknown as object;

  const rows = await db
    .select({
      id: carrierProfiles.id,
      userId: carrierProfiles.userId,
      name: users.name,
      surname: carrierProfiles.surname,
      givenName: carrierProfiles.givenName,
      verificationStatus: carrierProfiles.verificationStatus,
      isOnline: carrierProfiles.isOnline,
      lastLocationAt: carrierProfiles.lastLocationAt,
      lat: sql<number>`ST_Y(${carrierProfiles.currentLocation}::geometry)::float`,
      lng: sql<number>`ST_X(${carrierProfiles.currentLocation}::geometry)::float`,
      distanceM: sql<number>`ST_Distance(${carrierProfiles.currentLocation}, ${fromGeom})::float`,
    })
    .from(carrierProfiles)
    .innerJoin(users, eq(users.id, carrierProfiles.userId))
    .where(and(
      isNotNull(carrierProfiles.currentLocation),
      gt(carrierProfiles.lastLocationAt, cutoff),
      sql`ST_DWithin(${carrierProfiles.currentLocation}, ${fromGeom}, ${radiusMeters})`,
    ))
    .orderBy(sql`ST_Distance(${carrierProfiles.currentLocation}, ${fromGeom}) ASC`)
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    name: [r.surname, r.givenName].filter(Boolean).join(' ').trim() || r.name,
    lat: r.lat,
    lng: r.lng,
    last_location_at: r.lastLocationAt?.toISOString() ?? null,
    is_online: r.isOnline ?? false,
    verification_status: r.verificationStatus ?? 'not_submitted',
    distance_km: Math.round((r.distanceM ?? 0) / 100) / 10,
  }));
}
