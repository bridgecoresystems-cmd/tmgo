import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { driverServices, carrierProfiles, cities, vehicles } from '../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

export const cabinetDriverServicesRoutes = new Elysia({ prefix: '/cabinet/driver/services' })
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
      .select()
      .from(driverServices)
      .where(eq(driverServices.carrierId, carrierProfile.id))
      .orderBy(desc(driverServices.createdAt));

    const result = [];
    for (const r of rows) {
      const [fromCity] = await db.select().from(cities).where(eq(cities.id, r.fromCityId)).limit(1);
      const [toCity] = await db.select().from(cities).where(eq(cities.id, r.toCityId)).limit(1);
      const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, r.vehicleId)).limit(1);
      result.push({
        id: r.id,
        from_city_id: r.fromCityId,
        to_city_id: r.toCityId,
        from_city: fromCity?.name,
        to_city: toCity?.name,
        description: r.description,
        price: r.price,
        currency: r.currency,
        vehicle_id: r.vehicleId,
        vehicle_plate: vehicle?.plateNumber,
        is_active: r.isActive,
        created_at: r.createdAt?.toISOString(),
      });
    }
    return result;
  })
  .get('/:id', async ({ carrierProfile, params, set }) => {
    const [svc] = await db
      .select()
      .from(driverServices)
      .where(and(eq(driverServices.carrierId, carrierProfile.id), eq(driverServices.id, params.id)))
      .limit(1);

    if (!svc) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const [fromCity] = await db.select().from(cities).where(eq(cities.id, svc.fromCityId)).limit(1);
    const [toCity] = await db.select().from(cities).where(eq(cities.id, svc.toCityId)).limit(1);
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, svc.vehicleId)).limit(1);

    return {
      id: svc.id,
      from_city_id: svc.fromCityId,
      to_city_id: svc.toCityId,
      from_city: fromCity?.name,
      to_city: toCity?.name,
      description: svc.description,
      price: svc.price,
      currency: svc.currency,
      vehicle_id: svc.vehicleId,
      vehicle_plate: vehicle?.plateNumber,
      is_active: svc.isActive,
      created_at: svc.createdAt?.toISOString(),
    };
  })
  .post('/', async ({ carrierProfile, body, set }) => {
    const fromCityId = body.from_city_id as string;
    const toCityId = body.to_city_id as string;
    const vehicleId = body.vehicle_id as string;
    const price = parseFloat(String(body.price));
    const description = (body.description as string)?.trim() || null;

    if (!fromCityId || !toCityId || !vehicleId || isNaN(price) || price <= 0) {
      set.status = 400;
      return { error: 'from_city_id, to_city_id, vehicle_id and price are required' };
    }

    const [vehicle] = await db.select().from(vehicles).where(and(eq(vehicles.id, vehicleId), eq(vehicles.carrierId, carrierProfile.id))).limit(1);
    if (!vehicle) {
      set.status = 400;
      return { error: 'Invalid vehicle' };
    }

    const [fromCity] = await db.select().from(cities).where(eq(cities.id, fromCityId)).limit(1);
    const [toCity] = await db.select().from(cities).where(eq(cities.id, toCityId)).limit(1);
    if (!fromCity || !toCity) {
      set.status = 400;
      return { error: 'Invalid city' };
    }

    const [created] = await db
      .insert(driverServices)
      .values({
        carrierId: carrierProfile.id,
        vehicleId,
        fromCityId,
        toCityId,
        description,
        price: price.toString(),
        currency: 'TMT',
      })
      .returning();

    return {
      id: created.id,
      from_city: fromCity.name,
      to_city: toCity.name,
      vehicle_plate: vehicle.plateNumber,
      price: created.price,
      created_at: created.createdAt?.toISOString(),
    };
  }, {
    body: t.Object({
      from_city_id: t.String(),
      to_city_id: t.String(),
      vehicle_id: t.String(),
      price: t.Union([t.String(), t.Number()]),
      description: t.Optional(t.String()),
    }),
  })
  .patch('/:id', async ({ carrierProfile, params, body, set }) => {
    const [svc] = await db
      .select()
      .from(driverServices)
      .where(and(eq(driverServices.carrierId, carrierProfile.id), eq(driverServices.id, params.id)))
      .limit(1);

    if (!svc) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.from_city_id) {
      const [c] = await db.select().from(cities).where(eq(cities.id, body.from_city_id as string)).limit(1);
      if (c) updateData.fromCityId = body.from_city_id;
    }
    if (body.to_city_id) {
      const [c] = await db.select().from(cities).where(eq(cities.id, body.to_city_id as string)).limit(1);
      if (c) updateData.toCityId = body.to_city_id;
    }
    if (body.vehicle_id) {
      const [v] = await db.select().from(vehicles).where(and(eq(vehicles.id, body.vehicle_id as string), eq(vehicles.carrierId, carrierProfile.id))).limit(1);
      if (v) updateData.vehicleId = body.vehicle_id;
    }
    if (body.price != null) {
      const p = parseFloat(String(body.price));
      if (!isNaN(p) && p > 0) updateData.price = p.toString();
    }
    if (body.description !== undefined) updateData.description = (body.description as string)?.trim() || null;

    const [updated] = await db.update(driverServices).set(updateData as any).where(eq(driverServices.id, params.id)).returning();
    return updated;
  }, {
    body: t.Object({
      from_city_id: t.Optional(t.String()),
      to_city_id: t.Optional(t.String()),
      vehicle_id: t.Optional(t.String()),
      price: t.Optional(t.Union([t.String(), t.Number()])),
      description: t.Optional(t.String()),
    }),
  })
  .delete('/:id', async ({ carrierProfile, params, set }) => {
    const [deleted] = await db
      .delete(driverServices)
      .where(and(eq(driverServices.carrierId, carrierProfile.id), eq(driverServices.id, params.id)))
      .returning();
    if (!deleted) {
      set.status = 404;
      return { error: 'Not found' };
    }
    return { success: true };
  });
