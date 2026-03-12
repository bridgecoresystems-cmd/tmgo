import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { orders, carrierProfiles, cities, vehicles, orderResponses } from '../../db/schema';
import { eq, desc, and, isNull, notInArray } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

export const cabinetDriverOrdersRoutes = new Elysia({ prefix: '/cabinet/driver/orders' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'driver') {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    let [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, user.id)).limit(1);
    if (!profile) {
      const [created] = await db.insert(carrierProfiles).values({ userId: user.id }).returning();
      profile = created!;
    }
    return { user, carrierProfile: profile };
  })
  .get('/', async ({ carrierProfile }) => {
    const rows = await db
      .select({
        id: orders.id,
        status: orders.status,
        fromAddress: orders.fromAddress,
        toAddress: orders.toAddress,
        price: orders.price,
        currency: orders.currency,
        cargoName: orders.cargoName,
        orderVehicleId: orders.vehicleId,
        responseVehicleId: orderResponses.vehicleId,
        createdAt: orders.createdAt,
        fromCityName: cities.name,
      })
      .from(orders)
      .innerJoin(orderResponses, and(eq(orderResponses.orderId, orders.id), eq(orderResponses.carrierId, carrierProfile.id)))
      .leftJoin(cities, eq(orders.fromCityId, cities.id))
      .orderBy(desc(orders.createdAt));

    const vehicleMap = new Map<string, string>();
    for (const r of rows) {
      const vid = r.orderVehicleId || r.responseVehicleId;
      if (vid && !vehicleMap.has(vid)) {
        const [v] = await db.select({ plateNumber: vehicles.plateNumber }).from(vehicles).where(eq(vehicles.id, vid)).limit(1);
        if (v) vehicleMap.set(vid, v.plateNumber);
      }
    }

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      from_city: r.fromCityName || r.fromAddress,
      to_city: r.toAddress,
      cargo_name: r.cargoName,
      vehicle_plate: vehicleMap.get(r.orderVehicleId || r.responseVehicleId!) || '—',
      price: r.price,
      currency: r.currency,
      created_at: r.createdAt?.toISOString(),
    }));
  })
  .get('/available', async ({ carrierProfile }) => {
    const respondedOrderIds = await db
      .select({ orderId: orderResponses.orderId })
      .from(orderResponses)
      .where(eq(orderResponses.carrierId, carrierProfile.id));
    const ids = respondedOrderIds.map((r) => r.orderId);

    const rows = await db
      .select({
        id: orders.id,
        fromAddress: orders.fromAddress,
        toAddress: orders.toAddress,
        price: orders.price,
        currency: orders.currency,
        cargoName: orders.cargoName,
        cargoDescription: orders.cargoDescription,
        createdAt: orders.createdAt,
        fromCityName: cities.name,
      })
      .from(orders)
      .leftJoin(cities, eq(orders.fromCityId, cities.id))
      .where(
        ids.length > 0
          ? and(isNull(orders.carrierId), eq(orders.status, 'PENDING'), notInArray(orders.id, ids))
          : and(isNull(orders.carrierId), eq(orders.status, 'PENDING'))
      )
      .orderBy(desc(orders.createdAt));

    return rows.map((r) => ({
      id: r.id,
      from_city: r.fromCityName || r.fromAddress,
      to_city: r.toAddress,
      cargo_name: r.cargoName,
      cargo_description: r.cargoDescription,
      price: r.price,
      currency: r.currency,
      created_at: r.createdAt?.toISOString(),
    }));
  })
  .post('/:id/respond', async ({ carrierProfile, params, body, set }) => {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, params.id), isNull(orders.carrierId), eq(orders.status, 'PENDING')))
      .limit(1);

    if (!order) {
      set.status = 404;
      return { error: 'Order not found or already taken' };
    }

    const [existing] = await db
      .select()
      .from(orderResponses)
      .where(and(eq(orderResponses.orderId, params.id), eq(orderResponses.carrierId, carrierProfile.id)))
      .limit(1);
    if (existing) {
      set.status = 400;
      return { error: 'You already responded to this order' };
    }

    const vehicleId = body.vehicle_id as string;
    if (!vehicleId) {
      set.status = 400;
      return { error: 'vehicle_id is required' };
    }

    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.carrierId, carrierProfile.id)))
      .limit(1);

    if (!vehicle) {
      set.status = 400;
      return { error: 'Invalid vehicle' };
    }

    const [resp] = await db
      .insert(orderResponses)
      .values({
        orderId: params.id,
        carrierId: carrierProfile.id,
        vehicleId,
        status: 'PENDING',
      })
      .returning();

    return { message: 'Response sent', response_id: resp.id, order_id: params.id };
  }, {
    body: t.Object({ vehicle_id: t.String() }),
  })
  .get('/:id', async ({ carrierProfile, params, set }) => {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, params.id))
      .limit(1);

    if (!order) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const [resp] = await db
      .select()
      .from(orderResponses)
      .where(and(eq(orderResponses.orderId, params.id), eq(orderResponses.carrierId, carrierProfile.id)))
      .limit(1);
    if (!resp) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const vehicleId = order.vehicleId || resp.vehicleId;
    const [fromCity] = order.fromCityId
      ? await db.select().from(cities).where(eq(cities.id, order.fromCityId)).limit(1)
      : [null];
    const [toCity] = order.toCityId
      ? await db.select().from(cities).where(eq(cities.id, order.toCityId)).limit(1)
      : [null];
    const [vehicle] = vehicleId
      ? await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1)
      : [null];

    return {
      id: order.id,
      status: order.status,
      response_status: resp.status,
      from_city_id: order.fromCityId,
      to_city_id: order.toCityId,
      from_city: fromCity?.name || order.fromAddress,
      to_city: toCity?.name || order.toAddress,
      price: order.price,
      currency: order.currency,
      cargo_name: order.cargoName,
      cargo_description: order.cargoDescription,
      vehicle_id: vehicleId,
      vehicle_plate: vehicle?.plateNumber,
      created_at: order.createdAt?.toISOString(),
    };
  });
