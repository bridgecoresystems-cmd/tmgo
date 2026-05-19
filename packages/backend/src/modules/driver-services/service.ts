import { db } from '../../db';
import { driverServices, cities, vehicles } from '../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { BadRequest, NotFound } from '../../lib/errors';

export async function listOwnServices(carrierId: string) {
  const rows = await db
    .select()
    .from(driverServices)
    .where(eq(driverServices.carrierId, carrierId))
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
}

export async function getOwnService(carrierId: string, id: string) {
  const [svc] = await db
    .select()
    .from(driverServices)
    .where(and(eq(driverServices.carrierId, carrierId), eq(driverServices.id, id)))
    .limit(1);

  if (!svc) throw new NotFound('Not found');

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
}

export async function createService(
  carrierId: string,
  body: { from_city_id: string; to_city_id: string; vehicle_id: string; price: string | number; description?: string },
) {
  const fromCityId = body.from_city_id;
  const toCityId = body.to_city_id;
  const vehicleId = body.vehicle_id;
  const price = parseFloat(String(body.price));
  const description = body.description?.trim() || null;

  if (!fromCityId || !toCityId || !vehicleId || isNaN(price) || price <= 0) {
    throw new BadRequest('from_city_id, to_city_id, vehicle_id and price are required');
  }

  const [vehicle] = await db.select().from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.carrierId, carrierId))).limit(1);
  if (!vehicle) throw new BadRequest('Invalid vehicle');

  const [fromCity] = await db.select().from(cities).where(eq(cities.id, fromCityId)).limit(1);
  const [toCity] = await db.select().from(cities).where(eq(cities.id, toCityId)).limit(1);
  if (!fromCity || !toCity) throw new BadRequest('Invalid city');

  const [created] = await db
    .insert(driverServices)
    .values({
      carrierId,
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
}

export async function updateService(
  carrierId: string,
  id: string,
  body: { from_city_id?: string; to_city_id?: string; vehicle_id?: string; price?: string | number; description?: string },
) {
  const [svc] = await db
    .select()
    .from(driverServices)
    .where(and(eq(driverServices.carrierId, carrierId), eq(driverServices.id, id)))
    .limit(1);

  if (!svc) throw new NotFound('Not found');

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.from_city_id) {
    const [c] = await db.select().from(cities).where(eq(cities.id, body.from_city_id)).limit(1);
    if (c) updateData.fromCityId = body.from_city_id;
  }
  if (body.to_city_id) {
    const [c] = await db.select().from(cities).where(eq(cities.id, body.to_city_id)).limit(1);
    if (c) updateData.toCityId = body.to_city_id;
  }
  if (body.vehicle_id) {
    const [v] = await db.select().from(vehicles)
      .where(and(eq(vehicles.id, body.vehicle_id), eq(vehicles.carrierId, carrierId))).limit(1);
    if (v) updateData.vehicleId = body.vehicle_id;
  }
  if (body.price != null) {
    const p = parseFloat(String(body.price));
    if (!isNaN(p) && p > 0) updateData.price = p.toString();
  }
  if (body.description !== undefined) updateData.description = body.description?.trim() || null;

  const [updated] = await db.update(driverServices)
    .set(updateData as Partial<typeof driverServices.$inferInsert>)
    .where(eq(driverServices.id, id)).returning();
  return updated;
}

export async function deleteService(carrierId: string, id: string) {
  const [deleted] = await db
    .delete(driverServices)
    .where(and(eq(driverServices.carrierId, carrierId), eq(driverServices.id, id)))
    .returning();
  if (!deleted) throw new NotFound('Not found');
  return { success: true };
}
