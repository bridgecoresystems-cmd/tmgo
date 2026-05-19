// Повар: вся бизнес-логика отзывов. Не знает про HTTP — бросает AppError,
// которые routes.ts маппит в ответ через mapErrorToResponse.
import { db } from '../../db';
import {
  orders, orderBids, reviews, carrierProfiles, clientProfiles, users,
} from '../../db/schema';
import { eq, and, avg, count, desc } from 'drizzle-orm';
import { BadRequest, Forbidden, NotFound, Conflict } from '../../lib/errors';
import { ORDER_STATUS } from '../../constants/statuses';

type Direction = 'client_to_carrier' | 'carrier_to_client';

// Резолвит участников заказа: заказчик и принятый перевозчик.
async function resolveParticipants(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new NotFound('not_found');

  const [clientProfile] = await db.select({ userId: clientProfiles.userId })
    .from(clientProfiles).where(eq(clientProfiles.id, order.clientProfileId)).limit(1);

  let carrierUserId: string | null = null;
  if (order.acceptedBidId) {
    const [bid] = await db.select({ carrierProfileId: orderBids.carrierProfileId })
      .from(orderBids).where(eq(orderBids.id, order.acceptedBidId)).limit(1);
    if (bid) {
      const [cp] = await db.select({ userId: carrierProfiles.userId })
        .from(carrierProfiles).where(eq(carrierProfiles.id, bid.carrierProfileId)).limit(1);
      carrierUserId = cp?.userId ?? null;
    }
  }

  return {
    order,
    clientUserId: clientProfile?.userId ?? null,
    carrierUserId,
  };
}

// Пересчитывает кэшированный рейтинг перевозчика по всем полученным отзывам.
async function recomputeCarrierRating(carrierUserId: string) {
  const [agg] = await db
    .select({ avgRating: avg(reviews.rating) })
    .from(reviews)
    .where(and(
      eq(reviews.toUserId, carrierUserId),
      eq(reviews.direction, 'client_to_carrier'),
    ));

  const value = agg?.avgRating ? Number(agg.avgRating).toFixed(2) : '0.00';
  await db.update(carrierProfiles)
    .set({ rating: value })
    .where(eq(carrierProfiles.userId, carrierUserId));
}

export async function createReview(input: {
  userId: string;
  orderId: string;
  rating: number;
  comment?: string;
}) {
  const parts = await resolveParticipants(input.orderId);
  if (parts.order.status !== ORDER_STATUS.COMPLETED) {
    throw new BadRequest('order_not_completed');
  }

  let direction: Direction;
  let toUserId: string | null;
  if (input.userId === parts.clientUserId) {
    direction = 'client_to_carrier';
    toUserId = parts.carrierUserId;
  } else if (input.userId === parts.carrierUserId) {
    direction = 'carrier_to_client';
    toUserId = parts.clientUserId;
  } else {
    throw new Forbidden('forbidden');
  }
  if (!toUserId) throw new BadRequest('counterparty_not_found');

  const [existing] = await db.select({ id: reviews.id }).from(reviews)
    .where(and(eq(reviews.orderId, input.orderId), eq(reviews.fromUserId, input.userId))).limit(1);
  if (existing) throw new Conflict('already_reviewed');

  const [created] = await db.insert(reviews).values({
    orderId: input.orderId,
    fromUserId: input.userId,
    toUserId,
    direction,
    rating: input.rating,
    comment: input.comment?.trim() || null,
  }).returning();

  if (direction === 'client_to_carrier') {
    await recomputeCarrierRating(toUserId);
  }

  return { review: created };
}

export async function getOrderReviews(input: { userId: string; orderId: string }) {
  const parts = await resolveParticipants(input.orderId);

  const isClient = input.userId === parts.clientUserId;
  const isCarrier = input.userId === parts.carrierUserId;
  if (!isClient && !isCarrier) throw new Forbidden('forbidden');

  const rows = await db.select({
    id: reviews.id,
    fromUserId: reviews.fromUserId,
    toUserId: reviews.toUserId,
    direction: reviews.direction,
    rating: reviews.rating,
    comment: reviews.comment,
    createdAt: reviews.createdAt,
    fromName: users.name,
  }).from(reviews)
    .leftJoin(users, eq(users.id, reviews.fromUserId))
    .where(eq(reviews.orderId, input.orderId));

  const mine = rows.find(r => r.fromUserId === input.userId) ?? null;
  const received = rows.find(r => r.toUserId === input.userId) ?? null;

  return {
    role: isClient ? 'client' : 'carrier',
    canReview: parts.order.status === ORDER_STATUS.COMPLETED && !mine,
    mine,
    received,
  };
}

async function aggregateFor(userId: string) {
  const [agg] = await db.select({
    avgRating: avg(reviews.rating),
    total: count(reviews.id),
  }).from(reviews).where(eq(reviews.toUserId, userId));

  return {
    average: agg?.avgRating ? Number(Number(agg.avgRating).toFixed(2)) : 0,
    total: Number(agg?.total ?? 0),
  };
}

export async function getUserReviews(userId: string) {
  const rows = await db.select({
    id: reviews.id,
    direction: reviews.direction,
    rating: reviews.rating,
    comment: reviews.comment,
    createdAt: reviews.createdAt,
    fromName: users.name,
  }).from(reviews)
    .leftJoin(users, eq(users.id, reviews.fromUserId))
    .where(eq(reviews.toUserId, userId));

  return { reviews: rows, ...(await aggregateFor(userId)) };
}

export async function getMyReviews(userId: string) {
  const rows = await db.select({
    id: reviews.id,
    orderId: reviews.orderId,
    orderSeqNo: orders.seqNo,
    orderTitle: orders.title,
    direction: reviews.direction,
    rating: reviews.rating,
    comment: reviews.comment,
    createdAt: reviews.createdAt,
    fromName: users.name,
  }).from(reviews)
    .leftJoin(users, eq(users.id, reviews.fromUserId))
    .leftJoin(orders, eq(orders.id, reviews.orderId))
    .where(eq(reviews.toUserId, userId))
    .orderBy(desc(reviews.createdAt));

  return { reviews: rows, ...(await aggregateFor(userId)) };
}
