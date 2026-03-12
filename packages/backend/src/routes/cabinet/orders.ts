import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { orders, cities, orderResponses, carrierProfiles, vehicles, users } from '../../db/schema';
import { eq, desc, and, ne } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

export const cabinetOrdersRoutes = new Elysia({ prefix: '/cabinet/orders' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    if (user.role !== 'client') {
      set.status = 403;
      throw new Error('Forbidden: only clients can create orders');
    }
    return { user };
  })
  .get('/', async ({ user }) => {
    const rows = await db
      .select({
        id: orders.id,
        status: orders.status,
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
      .where(eq(orders.clientId, user.id))
      .orderBy(desc(orders.createdAt));

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      from_city: r.fromCityName || r.fromAddress,
      to_city: r.toAddress,
      price: r.price,
      currency: r.currency,
      cargo_name: r.cargoName,
      cargo_description: r.cargoDescription,
      created_at: r.createdAt?.toISOString(),
    }));
  })
  .post('/', async ({ user, body, set }) => {
    const fromCityId = body.from_city_id as string;
    const toCityId = body.to_city_id as string;
    const price = parseFloat(body.price as string);
    const cargoName = (body.cargo_name as string)?.trim() || null;
    const cargoDescription = (body.cargo_description as string)?.trim() || null;

    if (!fromCityId || !toCityId || isNaN(price) || price <= 0) {
      set.status = 400;
      return { error: 'from_city_id, to_city_id and price are required' };
    }

    const [fromCity] = await db.select().from(cities).where(eq(cities.id, fromCityId)).limit(1);
    const [toCity] = await db.select().from(cities).where(eq(cities.id, toCityId)).limit(1);

    if (!fromCity || !toCity) {
      set.status = 400;
      return { error: 'Invalid city' };
    }

    const pickupDate = new Date();
    pickupDate.setDate(pickupDate.getDate() + 1);

    const [created] = await db
      .insert(orders)
      .values({
        clientId: user.id,
        fromCityId,
        toCityId,
        fromAddress: fromCity.name,
        toAddress: toCity.name,
        pickupDate,
        cargoType: 'general',
        weight: '1',
        cargoName,
        cargoDescription,
        price: price.toString(),
        currency: 'TMT',
        status: 'PENDING',
      })
      .returning();

    return {
      id: created.id,
      status: created.status,
      from_city: fromCity.name,
      to_city: toCity.name,
      price: created.price,
      currency: created.currency,
      created_at: created.createdAt?.toISOString(),
    };
  }, {
    body: t.Object({
      from_city_id: t.String(),
      to_city_id: t.String(),
      price: t.Union([t.String(), t.Number()]),
      cargo_name: t.Optional(t.String()),
      cargo_description: t.Optional(t.String()),
    }),
  })
  .get('/:id', async ({ user, params, set }) => {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.clientId, user.id), eq(orders.id, params.id)))
      .limit(1);
    if (!order) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const [fromCity] = order.fromCityId
      ? await db.select().from(cities).where(eq(cities.id, order.fromCityId)).limit(1)
      : [null];
    const [toCity] = order.toCityId
      ? await db.select().from(cities).where(eq(cities.id, order.toCityId)).limit(1)
      : [null];

    const responses = await db
      .select()
      .from(orderResponses)
      .where(eq(orderResponses.orderId, params.id));

    const pendingResponses: any[] = [];
    const acceptedResponses: any[] = [];

    for (const r of responses) {
      const [carrier] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.id, r.carrierId)).limit(1);
      const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, r.vehicleId)).limit(1);
      const [carrierUser] = carrier ? await db.select().from(users).where(eq(users.id, carrier.userId)).limit(1) : [null];
      const item = {
        id: r.id,
        carrier_id: r.carrierId,
        vehicle_id: r.vehicleId,
        vehicle_plate: vehicle?.plateNumber,
        vehicle_type: vehicle?.type,
        company_name: carrier?.companyName,
        driver_name: carrierUser?.name,
        status: r.status,
        created_at: r.createdAt?.toISOString(),
      };
      if (r.status === 'PENDING') pendingResponses.push(item);
      else if (r.status === 'ACCEPTED') acceptedResponses.push(item);
    }

    return {
      id: order.id,
      status: order.status,
      from_city_id: order.fromCityId,
      to_city_id: order.toCityId,
      from_city: fromCity?.name || order.fromAddress,
      to_city: toCity?.name || order.toAddress,
      from_address: order.fromAddress,
      to_address: order.toAddress,
      price: order.price,
      currency: order.currency,
      cargo_name: order.cargoName,
      cargo_description: order.cargoDescription,
      created_at: order.createdAt?.toISOString(),
      pending_responses: pendingResponses,
      accepted_responses: acceptedResponses,
    };
  })
  .post('/:id/responses/:responseId/accept', async ({ user, params, set }) => {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.clientId, user.id), eq(orders.id, params.id)))
      .limit(1);
    if (!order) {
      set.status = 404;
      return { error: 'Order not found' };
    }
    if (order.carrierId) {
      set.status = 400;
      return { error: 'Order already has an accepted driver' };
    }

    const [resp] = await db
      .select()
      .from(orderResponses)
      .where(and(eq(orderResponses.orderId, params.id), eq(orderResponses.id, params.responseId), eq(orderResponses.status, 'PENDING')))
      .limit(1);
    if (!resp) {
      set.status = 404;
      return { error: 'Response not found' };
    }

    await db.transaction(async (tx) => {
      await tx.update(orders).set({
        carrierId: resp.carrierId,
        vehicleId: resp.vehicleId,
        status: 'ACCEPTED',
        updatedAt: new Date(),
      }).where(eq(orders.id, params.id));
      await tx.update(orderResponses).set({ status: 'ACCEPTED' }).where(eq(orderResponses.id, params.responseId));
      await tx.update(orderResponses).set({ status: 'REJECTED' }).where(and(eq(orderResponses.orderId, params.id), eq(orderResponses.status, 'PENDING'), ne(orderResponses.id, params.responseId)));
    });

    return { message: 'Driver accepted', order_id: params.id };
  })
  .post('/:id/responses/:responseId/reject', async ({ user, params, set }) => {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.clientId, user.id), eq(orders.id, params.id)))
      .limit(1);
    if (!order) {
      set.status = 404;
      return { error: 'Order not found' };
    }

    const [resp] = await db
      .select()
      .from(orderResponses)
      .where(and(eq(orderResponses.orderId, params.id), eq(orderResponses.id, params.responseId), eq(orderResponses.status, 'PENDING')))
      .limit(1);
    if (!resp) {
      set.status = 404;
      return { error: 'Response not found' };
    }

    await db.update(orderResponses).set({ status: 'REJECTED' }).where(eq(orderResponses.id, params.responseId));
    return { message: 'Response rejected', order_id: params.id };
  })
  .patch('/:id', async ({ user, params, body, set }) => {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.clientId, user.id), eq(orders.id, params.id)))
      .limit(1);
    if (!order) {
      set.status = 404;
      return { error: 'Not found' };
    }
    if (order.status !== 'PENDING') {
      set.status = 400;
      return { error: 'Can only edit orders with PENDING status' };
    }

    const fromCityId = body.from_city_id as string | undefined;
    const toCityId = body.to_city_id as string | undefined;
    const price = body.price != null ? parseFloat(String(body.price)) : undefined;
    const cargoName = body.cargo_name !== undefined ? ((body.cargo_name as string)?.trim() || null) : undefined;
    const cargoDescription = body.cargo_description !== undefined ? ((body.cargo_description as string)?.trim() || null) : undefined;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (fromCityId) {
      const [fromCity] = await db.select().from(cities).where(eq(cities.id, fromCityId)).limit(1);
      if (fromCity) {
        updateData.fromCityId = fromCityId;
        updateData.fromAddress = fromCity.name;
      }
    }
    if (toCityId) {
      const [toCity] = await db.select().from(cities).where(eq(cities.id, toCityId)).limit(1);
      if (toCity) {
        updateData.toCityId = toCityId;
        updateData.toAddress = toCity.name;
      }
    }
    if (price != null && !isNaN(price) && price > 0) updateData.price = price.toString();
    if (cargoName !== undefined) updateData.cargoName = cargoName;
    if (cargoDescription !== undefined) updateData.cargoDescription = cargoDescription;

    const [updated] = await db
      .update(orders)
      .set(updateData as any)
      .where(eq(orders.id, params.id))
      .returning();

    if (!updated) return { error: 'Update failed' };

    return {
      id: updated.id,
      status: updated.status,
      from_city: (updateData.fromAddress as string) || order.fromAddress,
      to_city: (updateData.toAddress as string) || order.toAddress,
      price: updated.price,
      currency: updated.currency,
      cargo_name: updated.cargoName,
      cargo_description: updated.cargoDescription,
    };
  }, {
    body: t.Object({
      from_city_id: t.Optional(t.String()),
      to_city_id: t.Optional(t.String()),
      price: t.Optional(t.Union([t.String(), t.Number()])),
      cargo_name: t.Optional(t.String()),
      cargo_description: t.Optional(t.String()),
    }),
  });
