import { db } from '../../db';
import { orders, orderCargo } from '../../db/schema';
import { eq, and, inArray, desc, ilike, sql } from 'drizzle-orm';

type PublicOrderQuery = {
  fromCity?: string; toCity?: string;
  fromCountry?: string; toCountry?: string;
  fromRegion?: string; toRegion?: string;
  cargoType?: string;
  weightMin?: string; weightMax?: string;
  volumeMin?: string; volumeMax?: string;
  packaging?: string;
  readyFrom?: string;
  page?: string; limit?: string;
};

export async function listPublicOrders(params: PublicOrderQuery) {
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? '20')));
  const offset = (page - 1) * limit;

  const conditions = [inArray(orders.status, ['published', 'negotiating'])];

  if (params.fromCity) conditions.push(ilike(orders.fromCity, `%${params.fromCity}%`));
  if (params.toCity) conditions.push(ilike(orders.toCity, `%${params.toCity}%`));
  if (params.fromCountry) conditions.push(eq(orders.fromCountry, params.fromCountry));
  if (params.toCountry) conditions.push(eq(orders.toCountry, params.toCountry));
  if (params.fromRegion) conditions.push(ilike(orders.fromRegion, `%${params.fromRegion}%`));
  if (params.toRegion) conditions.push(ilike(orders.toRegion, `%${params.toRegion}%`));
  if (params.cargoType) conditions.push(ilike(orderCargo.cargoType, `%${params.cargoType}%`));
  if (params.weightMin) conditions.push(sql`${orderCargo.weightKg} >= ${parseFloat(params.weightMin)}`);
  if (params.weightMax) conditions.push(sql`${orderCargo.weightKg} <= ${parseFloat(params.weightMax)}`);
  if (params.volumeMin) conditions.push(sql`${orderCargo.volumeM3} >= ${parseFloat(params.volumeMin)}`);
  if (params.volumeMax) conditions.push(sql`${orderCargo.volumeM3} <= ${parseFloat(params.volumeMax)}`);
  if (params.packaging) conditions.push(eq(orderCargo.packaging, params.packaging));
  if (params.readyFrom) conditions.push(sql`${orders.readyDate} >= ${params.readyFrom}`);

  const rows = await db.select({
    id: orders.id,
    orderType: orders.orderType,
    status: orders.status,
    title: orders.title,
    fromCountry: orders.fromCountry,
    fromRegion: orders.fromRegion,
    fromCity: orders.fromCity,
    toCountry: orders.toCountry,
    toRegion: orders.toRegion,
    toCity: orders.toCity,
    readyDate: orders.readyDate,
    deadlineDate: orders.deadlineDate,
    publishedAt: orders.publishedAt,
    cargoType: orderCargo.cargoType,
    weightKg: orderCargo.weightKg,
    volumeM3: orderCargo.volumeM3,
    packaging: orderCargo.packaging,
  })
    .from(orders)
    .leftJoin(orderCargo, eq(orderCargo.orderId, orders.id))
    .where(and(...conditions))
    .orderBy(desc(orders.publishedAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` })
    .from(orders)
    .leftJoin(orderCargo, eq(orderCargo.orderId, orders.id))
    .where(and(...conditions));

  return { orders: rows, total, page, limit };
}
