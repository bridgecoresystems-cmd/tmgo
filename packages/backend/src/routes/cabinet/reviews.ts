import { Elysia, t } from 'elysia';
import { db } from '../../db';
import {
  orders, orderBids, reviews, carrierProfiles, clientProfiles, users,
} from '../../db/schema';
import { eq, and, avg, count } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

// Резолвит пользователей-участников заказа: заказчик и принятый перевозчик.
async function resolveParticipants(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;

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

// Пересчитывает кэшированный рейтинг перевозчика по всем полученным им отзывам.
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

export const cabinetReviewsRoutes = new Elysia({ prefix: '/cabinet' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { user };
  })

  // POST /cabinet/orders/:id/review — оставить отзыв по завершённому заказу
  .post('/orders/:id/review', async ({ user, params, body, set }) => {
    const parts = await resolveParticipants(params.id);
    if (!parts) { set.status = 404; return { error: 'not_found' }; }
    if (parts.order.status !== 'completed') {
      set.status = 400; return { error: 'order_not_completed' };
    }

    let direction: 'client_to_carrier' | 'carrier_to_client';
    let toUserId: string | null;
    if (user.id === parts.clientUserId) {
      direction = 'client_to_carrier';
      toUserId = parts.carrierUserId;
    } else if (user.id === parts.carrierUserId) {
      direction = 'carrier_to_client';
      toUserId = parts.clientUserId;
    } else {
      set.status = 403; return { error: 'forbidden' };
    }
    if (!toUserId) { set.status = 400; return { error: 'counterparty_not_found' }; }

    const [existing] = await db.select({ id: reviews.id }).from(reviews)
      .where(and(eq(reviews.orderId, params.id), eq(reviews.fromUserId, user.id))).limit(1);
    if (existing) { set.status = 409; return { error: 'already_reviewed' }; }

    const [created] = await db.insert(reviews).values({
      orderId: params.id,
      fromUserId: user.id,
      toUserId,
      direction,
      rating: body.rating,
      comment: body.comment?.trim() || null,
    }).returning();

    if (direction === 'client_to_carrier') {
      await recomputeCarrierRating(toUserId);
    }

    return { review: created };
  }, {
    body: t.Object({
      rating: t.Integer({ minimum: 1, maximum: 5 }),
      comment: t.Optional(t.String({ maxLength: 1000 })),
    }),
  })

  // GET /cabinet/orders/:id/reviews — отзывы по заказу + право текущего юзера оставить отзыв
  .get('/orders/:id/reviews', async ({ user, params, set }) => {
    const parts = await resolveParticipants(params.id);
    if (!parts) { set.status = 404; return { error: 'not_found' }; }

    const isClient = user.id === parts.clientUserId;
    const isCarrier = user.id === parts.carrierUserId;
    if (!isClient && !isCarrier) { set.status = 403; return { error: 'forbidden' }; }

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
      .where(eq(reviews.orderId, params.id));

    const mine = rows.find(r => r.fromUserId === user.id) ?? null;
    const received = rows.find(r => r.toUserId === user.id) ?? null;

    return {
      role: isClient ? 'client' : 'carrier',
      canReview: parts.order.status === 'completed' && !mine,
      mine,
      received,
    };
  })

  // GET /cabinet/reviews/user/:userId — все полученные отзывы юзера + агрегат
  .get('/reviews/user/:userId', async ({ params }) => {
    const rows = await db.select({
      id: reviews.id,
      direction: reviews.direction,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      fromName: users.name,
    }).from(reviews)
      .leftJoin(users, eq(users.id, reviews.fromUserId))
      .where(eq(reviews.toUserId, params.userId));

    const [agg] = await db.select({
      avgRating: avg(reviews.rating),
      total: count(reviews.id),
    }).from(reviews).where(eq(reviews.toUserId, params.userId));

    return {
      reviews: rows,
      average: agg?.avgRating ? Number(Number(agg.avgRating).toFixed(2)) : 0,
      total: Number(agg?.total ?? 0),
    };
  });
