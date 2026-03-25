import { Elysia, t } from 'elysia';
import { db } from '../../db';
import {
  orders, orderCargo, orderBids, orderStatusLog, clientProfiles,
} from '../../db/schema';
import { eq, and, inArray, ne, sql, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

// Разрешённые переходы статусов для перевозчика
const CARRIER_TRANSITIONS: Record<string, string> = {
  confirmed: 'pickup',
  pickup: 'in_transit',
  in_transit: 'delivering',
  delivering: 'delivered',
};

export const cabinetOrdersRoutes = new Elysia({ prefix: '/cabinet/orders' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { user };
  })

  // GET /cabinet/orders — доска заявок (для перевозчиков, публичные статусы)
  .get('/', async ({ query }) => {
    const params = query as {
      status?: string;
      fromCountry?: string;
      toCountry?: string;
      fromCity?: string;
      toCity?: string;
      cargoType?: string;
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, parseInt(params.page ?? '1'));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? '20')));
    const offset = (page - 1) * limit;
    const statusFilter = (params.status ?? 'published,negotiating').split(',');

    const rows = await db.select({
      id: orders.id,
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
      .where(inArray(orderBids.orderId, rows.map(r => r.id)))
      .groupBy(orderBids.orderId);

    const bidsMap = new Map(bidsCount.map(b => [b.orderId, b.count]));

    return {
      orders: rows.map(r => ({ ...r, bidsCount: bidsMap.get(r.id) ?? 0 })),
      page,
      limit,
    };
  })

  // GET /cabinet/orders/my — мои заказы (для заказчика)
  .get('/my', async ({ user, query, set }) => {
    const [profile] = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);
    if (!profile) {
      set.status = 404;
      return { error: 'profile_required' };
    }

    const params = query as { status?: string; page?: string; limit?: string };
    const page = Math.max(1, parseInt(params.page ?? '1'));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? '20')));
    const offset = (page - 1) * limit;

    const whereClause = params.status
      ? and(eq(orders.clientProfileId, profile.id), inArray(orders.status, params.status.split(',')))
      : eq(orders.clientProfileId, profile.id);

    const rows = await db.select()
      .from(orders)
      .leftJoin(orderCargo, eq(orderCargo.orderId, orders.id))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return { orders: rows, page, limit };
  })

  // POST /cabinet/orders — создать заявку (draft)
  .post('/', async ({ user, body, set }) => {
    const [profile] = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);
    if (!profile) {
      set.status = 400;
      return { error: 'profile_required' };
    }

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
  }, {
    body: t.Object({
      title: t.String(),
      fromCountry: t.String({ minLength: 2, maxLength: 2 }),
      fromRegion: t.Optional(t.String()),
      fromCity: t.String(),
      toCountry: t.String({ minLength: 2, maxLength: 2 }),
      toRegion: t.Optional(t.String()),
      toCity: t.String(),
      readyDate: t.String(),
      deadlineDate: t.Optional(t.String()),
      price: t.Optional(t.Number()),
      currency: t.Optional(t.String()),
      cargo: t.Object({
        cargoType: t.String(),
        weightKg: t.Optional(t.Number()),
        volumeM3: t.Optional(t.Number()),
        packaging: t.Optional(t.String()),
        tempControlled: t.Optional(t.Boolean()),
        tempMin: t.Optional(t.Number()),
        tempMax: t.Optional(t.Number()),
        notes: t.Optional(t.String()),
      }),
    }),
  })

  // GET /cabinet/orders/:id — получить заказ
  .get('/:id', async ({ user, params, set }) => {
    const [profile] = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);

    const [order] = await db.select().from(orders)
      .where(eq(orders.id, params.id)).limit(1);
    if (!order) {
      set.status = 404;
      return { error: 'not_found' };
    }

    const [cargo] = await db.select().from(orderCargo)
      .where(eq(orderCargo.orderId, order.id)).limit(1);

    const statusLogs = await db.select().from(orderStatusLog)
      .where(eq(orderStatusLog.orderId, order.id))
      .orderBy(desc(orderStatusLog.createdAt));

    // Ставки видны только владельцу заказа
    const isOwner = profile && order.clientProfileId === profile.id;
    const bids = isOwner
      ? await db.select().from(orderBids).where(eq(orderBids.orderId, order.id))
      : [];

    return { order, cargo, bids, statusLogs };
  })

  // PATCH /cabinet/orders/:id/publish — опубликовать заявку
  .patch('/:id/publish', async ({ user, params, set }) => {
    const [profile] = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);
    if (!profile) { set.status = 400; return { error: 'profile_required' }; }

    const [order] = await db.select().from(orders)
      .where(and(eq(orders.id, params.id), eq(orders.clientProfileId, profile.id))).limit(1);
    if (!order) { set.status = 404; return { error: 'not_found' }; }
    if (order.status !== 'draft') { set.status = 400; return { error: 'only_draft_can_be_published' }; }

    // expiresAt = readyDate + 7 дней
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
      changedBy: user.id,
      oldStatus: 'draft',
      newStatus: 'published',
    });

    return { order: updated };
  })

  // POST /cabinet/orders/:id/bids — сделать ставку (для перевозчика)
  .post('/:id/bids', async ({ user, params, body, set }) => {
    const [order] = await db.select().from(orders)
      .where(eq(orders.id, params.id)).limit(1);
    if (!order) { set.status = 404; return { error: 'not_found' }; }
    if (!['published', 'negotiating'].includes(order.status)) {
      set.status = 400;
      return { error: 'order_not_accepting_bids' };
    }

    // Проверяем что перевозчик не является владельцем заказа
    const [clientProfile] = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);
    if (clientProfile && order.clientProfileId === clientProfile.id) {
      set.status = 400;
      return { error: 'cannot_bid_on_own_order' };
    }

    // Получаем carrier_profile_id из carrierProfiles
    const { carrierProfiles } = await import('../../db/schema');
    const [carrierProfile] = await db.select().from(carrierProfiles)
      .where(eq(carrierProfiles.userId, user.id)).limit(1);
    if (!carrierProfile) { set.status = 400; return { error: 'carrier_profile_required' }; }

    // Если уже есть ставка — обновляем
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

      // При первой ставке меняем статус на negotiating
      if (order.status === 'published') {
        await db.update(orders).set({ status: 'negotiating', updatedAt: new Date() })
          .where(eq(orders.id, order.id));
        await db.insert(orderStatusLog).values({
          orderId: order.id,
          changedBy: user.id,
          oldStatus: 'published',
          newStatus: 'negotiating',
        });
      }
    }

    return { bid };
  }, {
    body: t.Object({
      amount: t.Number(),
      currency: t.Optional(t.String()),
      comment: t.Optional(t.String()),
    }),
  })

  // PATCH /cabinet/orders/:id/bids/:bidId/accept — принять ставку (для заказчика)
  .patch('/:id/bids/:bidId/accept', async ({ user, params, set }) => {
    const [profile] = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);
    if (!profile) { set.status = 400; return { error: 'profile_required' }; }

    const [order] = await db.select().from(orders)
      .where(and(eq(orders.id, params.id), eq(orders.clientProfileId, profile.id))).limit(1);
    if (!order) { set.status = 404; return { error: 'not_found' }; }
    if (order.status !== 'negotiating') { set.status = 400; return { error: 'order_not_in_negotiating' }; }

    const [bid] = await db.select().from(orderBids)
      .where(and(eq(orderBids.id, params.bidId), eq(orderBids.orderId, order.id))).limit(1);
    if (!bid) { set.status = 404; return { error: 'bid_not_found' }; }

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
      changedBy: user.id,
      oldStatus: 'negotiating',
      newStatus: 'confirmed',
    });

    return { order: updated };
  })

  // PATCH /cabinet/orders/:id/status — обновить статус заказа (для перевозчика)
  .patch('/:id/status', async ({ user, params, body, set }) => {
    const { carrierProfiles } = await import('../../db/schema');
    const [carrierProfile] = await db.select().from(carrierProfiles)
      .where(eq(carrierProfiles.userId, user.id)).limit(1);
    if (!carrierProfile) { set.status = 400; return { error: 'carrier_profile_required' }; }

    const [order] = await db.select().from(orders)
      .where(eq(orders.id, params.id)).limit(1);
    if (!order) { set.status = 404; return { error: 'not_found' }; }

    // Проверяем что это именно принятый перевозчик
    if (!order.acceptedBidId) { set.status = 400; return { error: 'no_accepted_bid' }; }
    const [acceptedBid] = await db.select().from(orderBids)
      .where(and(eq(orderBids.id, order.acceptedBidId), eq(orderBids.carrierProfileId, carrierProfile.id))).limit(1);
    if (!acceptedBid) { set.status = 403; return { error: 'forbidden' }; }

    const allowedNext = CARRIER_TRANSITIONS[order.status];
    if (!allowedNext || allowedNext !== body.status) {
      set.status = 400;
      return { error: 'invalid_status_transition', allowed: allowedNext };
    }

    const [updated] = await db.update(orders).set({
      status: body.status,
      updatedAt: new Date(),
    }).where(eq(orders.id, order.id)).returning();

    await db.insert(orderStatusLog).values({
      orderId: order.id,
      changedBy: user.id,
      oldStatus: order.status,
      newStatus: body.status,
      comment: body.comment ?? null,
      photoUrl: body.photoUrl ?? null,
    });

    return { order: updated };
  }, {
    body: t.Object({
      status: t.String(),
      comment: t.Optional(t.String()),
      photoUrl: t.Optional(t.String()),
    }),
  })

  // PATCH /cabinet/orders/:id/complete — завершить заказ (для заказчика)
  .patch('/:id/complete', async ({ user, params, set }) => {
    const [profile] = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);
    if (!profile) { set.status = 400; return { error: 'profile_required' }; }

    const [order] = await db.select().from(orders)
      .where(and(eq(orders.id, params.id), eq(orders.clientProfileId, profile.id))).limit(1);
    if (!order) { set.status = 404; return { error: 'not_found' }; }
    if (order.status !== 'delivered') { set.status = 400; return { error: 'order_not_delivered' }; }

    const now = new Date();
    const [updated] = await db.update(orders).set({
      status: 'completed',
      completedAt: now,
      updatedAt: now,
    }).where(eq(orders.id, order.id)).returning();

    await db.insert(orderStatusLog).values({
      orderId: order.id,
      changedBy: user.id,
      oldStatus: 'delivered',
      newStatus: 'completed',
    });

    return { order: updated };
  })

  // PATCH /cabinet/orders/:id/cancel — отменить заказ
  .patch('/:id/cancel', async ({ user, params, body, set }) => {
    const [profile] = await db.select().from(clientProfiles)
      .where(eq(clientProfiles.userId, user.id)).limit(1);
    if (!profile) { set.status = 400; return { error: 'profile_required' }; }

    const [order] = await db.select().from(orders)
      .where(and(eq(orders.id, params.id), eq(orders.clientProfileId, profile.id))).limit(1);
    if (!order) { set.status = 404; return { error: 'not_found' }; }
    if (!['draft', 'published', 'negotiating'].includes(order.status)) {
      set.status = 400;
      return { error: 'cannot_cancel_after_confirmation' };
    }

    const [updated] = await db.update(orders).set({
      status: 'cancelled',
      updatedAt: new Date(),
    }).where(eq(orders.id, order.id)).returning();

    await db.insert(orderStatusLog).values({
      orderId: order.id,
      changedBy: user.id,
      oldStatus: order.status,
      newStatus: 'cancelled',
      comment: body?.reason ?? null,
    });

    return { order: updated };
  }, {
    body: t.Optional(t.Object({
      reason: t.Optional(t.String()),
    })),
  });
