import { db } from '../index';
import { vehicleMakes, vehicleModels } from '../schema';
import { VEHICLE_MAKES_SEED } from '@tmgo/shared';
import { and, eq } from 'drizzle-orm';

export async function seedVehicleMakes() {
  for (const make of VEHICLE_MAKES_SEED) {
    const [existing] = await db.select().from(vehicleMakes).where(eq(vehicleMakes.slug, make.slug)).limit(1);
    const makeId = existing?.id ?? (await db.insert(vehicleMakes).values({
      name: make.name,
      slug: make.slug,
      countryCode: make.countryCode,
    }).returning())[0]?.id;

    if (!makeId) continue;

    for (const model of make.models) {
      const [existingModel] = await db.select().from(vehicleModels)
        .where(and(eq(vehicleModels.makeId, makeId), eq(vehicleModels.slug, model.slug)))
        .limit(1);
      if (existingModel) continue;

      await db.insert(vehicleModels).values({
        makeId,
        name: model.name,
        slug: model.slug,
        compatibleTypes: model.compatibleTypes,
      });
    }
  }
  console.log('vehicle makes/models seeded');
}

seedVehicleMakes().catch(console.error).finally(() => process.exit(0));
