import { db } from '../../db';
import {
  orders, orderCargo, orderBids, orderStatusLog, clientProfiles, carrierProfiles,
} from '../../db/schema';
import { eq, and, inArray, ne, sql, desc } from 'drizzle-orm';
import { BadRequest, NotFound, Forbidden } from '../../lib/errors';
import { geoPoint } from '../../db/schema/postgis';

// Разрешённые переходы статусов для перевозчика.
const CARRIER_TRANSITIONS: Record<string, string> = {
  confirmed: 'pickup',
  pickup: 'in_transit',
  in_transit: 'delivering',
  delivering: 'delivered',
};

// invalid_status_transition отдаёт доп. поле allowed — несём его через ошибку.
export class InvalidTransitionError extends BadRequest {
  allowed: string | undefined;
  constructor(allowed: string | undefined) {
    super('invalid_status_transition');
    this.allowed = allowed;
  }
}

async function clientProfileOf(userId: string) {
  const [profile] = await db.select().from(clientProfiles)
    .where(eq(clientProfiles.userId, userId)).limit(1);
  return profile ?? null;
}

async function carrierProfileOf(userId: string) {
  const [profile] = await db.select().from(carrierProfiles)
    .where(eq(carrierProfiles.userId, userId)).limit(1);
  return profile ?? null;
}

export async function listBoard(query: Record<string, string | undefined>) {
  const page = Math.max(1, parseInt(query.page ?? '1'));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '20')));
  const offset = (page - 1) * limit;
  const statusFilter = (query.status ?? 'published,negotiating').split(',');

  const rows = await db.select({
    id: orders.id,
    seqNo: orders.seqNo,
    orderType: orders.orderType,
    status: orders.status,
    title: orders.title,
    price: orders.price,
    currency: orders.currency,
    priceType: orders.priceType,
    fromCountry: orders.fromCountry,
    fromRegion: orders.fromRegion,
    fromCity: orders.fromCity,
    toCountry: orders.toCountry,
    toRegion: orders.toRegion,
    toCity: orders.toCity,
    readyDate: orders.readyDate,
    deadlineDate: orders.deadlineDate,
    publishedAt: orders.publishedAt,
    expiresAt: orders.expiresAt,
    createdAt: orders.createdAt,
    cargoType: orderCargo.cargoType,
    weightKg: orderCargo.weightKg,
    volumeM3: orderCargo.volumeM3,
    packaging: orderCargo.packaging,
    tempControlled: orderCargo.tempControlled,
  })
    .from(orders)
    .leftJoin(orderCargo, eq(orderCargo.orderId, orders.id))
    .where(inArray(orders.status, statusFilter))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  const bidsCount = await db.select({
    orderId: orderBids.orderId,
    count: sql<number>`count(*)::int`,
  })
    .from(orderBids)
    .where(inArray(orderBids.orderId, rows.map((r) => r.id)))
    .groupBy(orderBids.orderId);

  const bidsMap = new Map(bidsCount.map((b) => [b.orderId, b.count]));

  return {
    orders: rows.map((r) => ({ ...r, bidsCount: bidsMap.get(r.id) ?? 0 })),
    page,
    limit,
  };
}

export async function listMyOrders(userId: string, query: Record<string, string | undefined>) {
  const profile = await clientProfileOf(userId);
  if (!profile) throw new NotFound('profile_required');

  const page = Math.max(1, parseInt(query.page ?? '1'));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '20')));
  const offset = (page - 1) * limit;

  const whereClause = query.status
    ? and(eq(orders.clientProfileId, profile.id), inArray(orders.status, query.status.split(',')))
    : eq(orders.clientProfileId, profile.id);

  const rows = await db.select()
    .from(orders)
    .leftJoin(orderCargo, eq(orderCargo.orderId, orders.id))
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  return { orders: rows, page, limit };
}

export async function createOrder(userId: string, body: Record<string, any>) {
  const profile = await clientProfileOf(userId);
  if (!profile) throw new BadRequest('profile_required');

  // Координаты — опциональные. Yandex API на фронте отдаёт {lat,lng} адреса;
  // если клиент в форме оставил только текст города — сохраняем без геометрии.
  const hasFromGeom = typeof body.fromLat === 'number' && typeof body.fromLng === 'number';
  const hasToGeom = typeof body.toLat === 'number' && typeof body.toLng === 'number';

  const [order] = await db.insert(orders).values({
    clientProfileId: profile.id,
    title: body.title,
    fromCountry: body.fromCountry,
    fromRegion: body.fromRegion ?? null,
    fromCity: body.fromCity,
    toCountry: body.toCountry,
    toRegion: body.toRegion ?? null,
    toCity: body.toCity,
    readyDate: body.readyDate,
    deadlineDate: body.deadlineDate ?? null,
    price: body.price?.toString() ?? null,
    currency: body.currency ?? 'USD',
    status: 'draft',
    fromGeom: hasFromGeom ? sql`${geoPoint(body.fromLat, body.fromLng)}` as any : null,
    toGeom: hasToGeom ? sql`${geoPoint(body.toLat, body.toLng)}` as any : null,
  }).returning();

  const [cargo] = await db.insert(orderCargo).values({
    orderId: order.id,
    cargoType: body.cargo.cargoType,
    weightKg: body.cargo.weightKg?.toString() ?? null,
    volumeM3: body.cargo.volumeM3?.toString() ?? null,
    packaging: body.cargo.packaging ?? null,
    tempControlled: body.cargo.tempControlled ?? false,
    tempMin: body.cargo.tempMin?.toString() ?? null,
    tempMax: body.cargo.tempMax?.toString() ?? null,
    notes: body.cargo.notes ?? null,
  }).returning();

  return { order, cargo, clientVerified: profile.verificationStatus === 'verified' };
}

export async function getOrder(userId: string, id: string) {
  const profile = await clientProfileOf(userId);

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) throw new NotFound('not_found');

  const isOwner = !!profile && order.clientProfileId === profile.id;
  const isPublicStatus = ['published', 'negotiating'].includes(order.status);
  if (!isOwner && !isPublicStatus) throw new Forbidden('forbidden');

  const [cargo] = await db.select().from(orderCargo)
    .where(eq(orderCargo.orderId, order.id)).limit(1);
  const statusLogs = await db.select().from(orderStatusLog)
    .where(eq(orderStatusLog.orderId, order.id))
    .orderBy(desc(orderStatusLog.createdAt));
  const bids = isOwner
    ? await db.select().from(orderBids).where(eq(orderBids.orderId, order.id))
    : [];

  return { order, cargo, bids, statusLogs };
}

async function ownedOrder(userId: string, id: string) {
  const profile = await clientProfileOf(userId);
  if (!profile) throw new BadRequest('profile_required');
  const [order] = await db.select().from(orders)
    .where(and(eq(orders.id, id), eq(orders.clientProfileId, profile.id))).limit(1);
  if (!order) throw new NotFound('not_found');
  return { profile, order };
}

export async function publishOrder(userId: string, id: string) {
  const { order } = await ownedOrder(userId, id);
  if (order.status !== 'draft') throw new BadRequest('only_draft_can_be_published');

  const readyDate = new Date(order.readyDate);
  const expiresAt = new Date(readyDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [updated] = await db.update(orders).set({
    status: 'published',
    publishedAt: now,
    expiresAt,
    updatedAt: now,
  }).where(eq(orders.id, order.id)).returning();

  await db.insert(orderStatusLog).values({
    orderId: order.id,
    changedBy: userId,
    oldStatus: 'draft',
    newStatus: 'published',
  });

  return { order: updated };
}

export async function placeBid(userId: string, id: string, body: { amount: number; currency?: string; comment?: string }) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) throw new NotFound('not_found');
  if (!['published', 'negotiating'].includes(order.status)) {
    throw new BadRequest('order_not_accepting_bids');
  }

  const clientProfile = await clientProfileOf(userId);
  if (clientProfile && order.clientProfileId === clientProfile.id) {
    throw new BadRequest('cannot_bid_on_own_order');
  }

  const carrierProfile = await carrierProfileOf(userId);
  if (!carrierProfile) throw new BadRequest('carrier_profile_required');

  const [existingBid] = await db.select().from(orderBids)
    .where(and(
      eq(orderBids.orderId, order.id),
      eq(orderBids.carrierProfileId, carrierProfile.id),
    )).limit(1);

  let bid;
  if (existingBid) {
    [bid] = await db.update(orderBids).set({
      amount: body.amount.toString(),
      currency: body.currency ?? 'USD',
      comment: body.comment ?? null,
      updatedAt: new Date(),
    }).where(eq(orderBids.id, existingBid.id)).returning();
  } else {
    [bid] = await db.insert(orderBids).values({
      orderId: order.id,
      carrierProfileId: carrierProfile.id,
      amount: body.amount.toString(),
      currency: body.currency ?? 'USD',
      comment: body.comment ?? null,
    }).returning();

    if (order.status === 'published') {
      await db.update(orders).set({ status: 'negotiating', updatedAt: new Date() })
        .where(eq(orders.id, order.id));
      await db.insert(orderStatusLog).values({
        orderId: order.id,
        changedBy: userId,
        oldStatus: 'published',
        newStatus: 'negotiating',
      });
    }
  }

  return { bid };
}

export async function acceptBid(userId: string, id: string, bidId: string) {
  const { order } = await ownedOrder(userId, id);
  if (order.status !== 'negotiating') throw new BadRequest('order_not_in_negotiating');

  const [bid] = await db.select().from(orderBids)
    .where(and(eq(orderBids.id, bidId), eq(orderBids.orderId, order.id))).limit(1);
  if (!bid) throw new NotFound('bid_not_found');

  const now = new Date();
  await db.update(orderBids).set({ status: 'accepted', updatedAt: now })
    .where(eq(orderBids.id, bid.id));
  await db.update(orderBids).set({ status: 'rejected', updatedAt: now })
    .where(and(eq(orderBids.orderId, order.id), ne(orderBids.id, bid.id)));

  const [updated] = await db.update(orders).set({
    status: 'confirmed',
    acceptedBidId: bid.id,
    confirmedAt: now,
    updatedAt: now,
  }).where(eq(orders.id, order.id)).returning();

  await db.insert(orderStatusLog).values({
    orderId: order.id,
    changedBy: userId,
    oldStatus: 'negotiating',
    newStatus: 'confirmed',
  });

  return { order: updated };
}

export async function updateOrderStatus(
  userId: string,
  id: string,
  body: { status: string; comment?: string; photoUrl?: string },
) {
  const carrierProfile = await carrierProfileOf(userId);
  if (!carrierProfile) throw new BadRequest('carrier_profile_required');

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) throw new NotFound('not_found');

  if (!order.acceptedBidId) throw new BadRequest('no_accepted_bid');
  const [acceptedBid] = await db.select().from(orderBids)
    .where(and(eq(orderBids.id, order.acceptedBidId), eq(orderBids.carrierProfileId, carrierProfile.id))).limit(1);
  if (!acceptedBid) throw new Forbidden('forbidden');

  const allowedNext = CARRIER_TRANSITIONS[order.status];
  if (!allowedNext || allowedNext !== body.status) {
    throw new InvalidTransitionError(allowedNext);
  }

  const [updated] = await db.update(orders).set({
    status: body.status,
    updatedAt: new Date(),
  }).where(eq(orders.id, order.id)).returning();

  await db.insert(orderStatusLog).values({
    orderId: order.id,
    changedBy: userId,
    oldStatus: order.status,
    newStatus: body.status,
    comment: body.comment ?? null,
    photoUrl: body.photoUrl ?? null,
  });

  return { order: updated };
}

export async function completeOrder(userId: string, id: string) {
  const { order } = await ownedOrder(userId, id);
  if (order.status !== 'delivered') throw new BadRequest('order_not_delivered');

  const now = new Date();
  const [updated] = await db.update(orders).set({
    status: 'completed',
    completedAt: now,
    updatedAt: now,
  }).where(eq(orders.id, order.id)).returning();

  await db.insert(orderStatusLog).values({
    orderId: order.id,
    changedBy: userId,
    oldStatus: 'delivered',
    newStatus: 'completed',
  });

  return { order: updated };
}

export async function cancelOrder(userId: string, id: string, body: { reason?: string } | undefined) {
  const { order } = await ownedOrder(userId, id);
  if (!['draft', 'published', 'negotiating'].includes(order.status)) {
    throw new BadRequest('cannot_cancel_after_confirmation');
  }

  const [updated] = await db.update(orders).set({
    status: 'cancelled',
    updatedAt: new Date(),
  }).where(eq(orders.id, order.id)).returning();

  await db.insert(orderStatusLog).values({
    orderId: order.id,
    changedBy: userId,
    oldStatus: order.status,
    newStatus: 'cancelled',
    comment: body?.reason ?? null,
  });

  return { order: updated };
}
