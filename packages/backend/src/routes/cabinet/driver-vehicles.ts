import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { vehicles, carrierProfiles } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

export const cabinetDriverVehiclesRoutes = new Elysia({ prefix: '/cabinet/driver/vehicles' })
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
    const list = await db.select().from(vehicles).where(eq(vehicles.carrierId, carrierProfile.id));
    return list.map((v) => ({
      id: v.id,
      type: v.type,
      capacity: v.capacity,
      volume: v.volume,
      plate_number: v.plateNumber,
      is_available: v.isAvailable,
    }));
  })
  .post('/', async ({ carrierProfile, body }) => {
    const [created] = await db
      .insert(vehicles)
      .values({
        carrierId: carrierProfile.id,
        type: body.type || 'truck',
        capacity: String(body.capacity ?? 1),
        volume: String(body.volume ?? 1),
        plateNumber: body.plate_number,
      })
      .returning();
    return {
      id: created.id,
      type: created.type,
      capacity: created.capacity,
      volume: created.volume,
      plate_number: created.plateNumber,
    };
  }, {
    body: t.Object({
      type: t.Optional(t.String()),
      capacity: t.Optional(t.Union([t.String(), t.Number()])),
      volume: t.Optional(t.Union([t.String(), t.Number()])),
      plate_number: t.String(),
    }),
  });
