import { Elysia, t } from 'elysia';
import { db } from '../../db';
import {
  orders, orderCargo, orderBids, orderStatusLog,
  carrierProfiles, clientProfiles,
} from '../../db/schema';
import { eq, desc, and, inArray, notInArray, sql } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

export const cabinetDriverOrdersRoutes = new Elysia({ prefix: '/cabinet/driver/orders' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'driver') {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    let [profile] = await db.select().from(carrierProfiles)
      .where(eq(carrierProfiles.userId, user.id)).limit(1);
    if (!profile) {
      const [created] = await db.insert(carrierProfiles).values({ userId: user.id }).returning();
      profile = created!;
    }
    return { user, carrierProfile: profile };
  })

  // GET /cabinet/driver/orders — мои заказы (где я сделал ставку)
  .get('/', async ({ carrierProfile }) => {
    const myBids = await db.select({
      orderId: orderBids.orderId,
      bidStatus: orderBids.status,
      amount: orderBids.amount,
      currency: orderBids.currency,
    })
      .from(orderBids)
      .where(eq(orderBids.carrierProfileId, carrierProfile.id));

    if (myBids.length === 0) return { orders: [] };

    const orderIds = myBids.map(b => b.orderId);
    const rows = await db.select({
      id: orders.id,
      status: orders.status,
      title: orders.title,
      fromCountry: orders.fromCountry,
      fromCity: orders.fromCity,
      toCountry: orders.toCountry,
      toCity: orders.toCity,
      readyDate: orders.readyDate,
      price: orders.price,
      currency: orders.currency,
      createdAt: orders.createdAt,
    })
      .from(orders)
      .where(inArray(orders.id, orderIds))
      .orderBy(desc(orders.createdAt));

    const bidMap = new Map(myBids.map(b => [b.orderId, b]));

    return {
      orders: rows.map(r => ({
        ...r,
        myBidStatus: bidMap.get(r.id)?.bidStatus,
        myBidAmount: bidMap.get(r.id)?.amount,
        myBidCurrency: bidMap.get(r.id)?.currency,
      })),
    };
  })

  // GET /cabinet/driver/orders/available — доступные заявки (published/negotiating)
  .get('/available', async ({ carrierProfile, query }) => {
    const params = query as {
      fromCountry?: string;
      toCountry?: string;
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, parseInt(params.page ?? '1'));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? '20')));
    const offset = (page - 1) * limit;

    // Заказы на которые уже сделал ставку — исключаем
    const myBidOrderIds = await db.select({ orderId: orderBids.orderId })
      .from(orderBids)
      .where(and(
        eq(orderBids.carrierProfileId, carrierProfile.id),
        inArray(orderBids.status, ['pending', 'accepted']),
      ));
    const excludeIds = myBidOrderIds.map(b => b.orderId);

    const whereBase = inArray(orders.status, ['published', 'negotiating']);
    const where = excludeIds.length > 0
      ? and(whereBase, notInArray(orders.id, excludeIds))
      : whereBase;

    const rows = await db.select({
      id: orders.id,
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
      price: orders.price,
      currency: orders.currency,
      priceType: orders.priceType,
      publishedAt: orders.publishedAt,
      expiresAt: orders.expiresAt,
      createdAt: orders.createdAt,
      cargoType: orderCargo.cargoType,
      weightKg: orderCargo.weightKg,
      volumeM3: orderCargo.volumeM3,
      tempControlled: orderCargo.tempControlled,
    })
      .from(orders)
      .leftJoin(orderCargo, eq(orderCargo.orderId, orders.id))
      .where(where)
      .orderBy(desc(orders.publishedAt))
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

  // GET /cabinet/driver/orders/:id — детали заказа
  .get('/:id', async ({ carrierProfile, params, set }) => {
    const [order] = await db.select().from(orders)
      .where(eq(orders.id, params.id)).limit(1);
    if (!order) { set.status = 404; return { error: 'not_found' }; }

    const [cargo] = await db.select().from(orderCargo)
      .where(eq(orderCargo.orderId, order.id)).limit(1);

    const [myBid] = await db.select().from(orderBids)
      .where(and(
        eq(orderBids.orderId, order.id),
        eq(orderBids.carrierProfileId, carrierProfile.id),
      )).limit(1);

    const statusLogs = await db.select().from(orderStatusLog)
      .where(eq(orderStatusLog.orderId, order.id))
      .orderBy(desc(orderStatusLog.createdAt));

    return { order, cargo, myBid: myBid ?? null, statusLogs };
  });
