import { Elysia } from 'elysia';
import { db } from '../../db';
import { driverServices, cities, vehicles, carrierProfiles } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

export const cabinetClientServicesRoutes = new Elysia({ prefix: '/cabinet/client/services' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'client') {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { user };
  })
  .get('/', async () => {
    const rows = await db
      .select()
      .from(driverServices)
      .where(eq(driverServices.isActive, true))
      .orderBy(desc(driverServices.createdAt));

    const result = [];
    for (const r of rows) {
      const [fromCity] = await db.select().from(cities).where(eq(cities.id, r.fromCityId)).limit(1);
      const [toCity] = await db.select().from(cities).where(eq(cities.id, r.toCityId)).limit(1);
      const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, r.vehicleId)).limit(1);
      const [carrier] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.id, r.carrierId)).limit(1);
      result.push({
        id: r.id,
        from_city: fromCity?.name,
        to_city: toCity?.name,
        description: r.description,
        price: r.price,
        currency: r.currency,
        vehicle_plate: vehicle?.plateNumber,
        vehicle_type: vehicle?.type,
        company_name: carrier?.companyName,
        created_at: r.createdAt?.toISOString(),
      });
    }
    return result;
  })
  .get('/:id', async ({ params, set }) => {
    const [svc] = await db
      .select()
      .from(driverServices)
      .where(eq(driverServices.id, params.id))
      .limit(1);

    if (!svc || !svc.isActive) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const [fromCity] = await db.select().from(cities).where(eq(cities.id, svc.fromCityId)).limit(1);
    const [toCity] = await db.select().from(cities).where(eq(cities.id, svc.toCityId)).limit(1);
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, svc.vehicleId)).limit(1);
    const [carrier] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.id, svc.carrierId)).limit(1);

    return {
      id: svc.id,
      from_city: fromCity?.name,
      to_city: toCity?.name,
      description: svc.description,
      price: svc.price,
      currency: svc.currency,
      vehicle_plate: vehicle?.plateNumber,
      vehicle_type: vehicle?.type,
      company_name: carrier?.companyName,
      created_at: svc.createdAt?.toISOString(),
    };
  });
