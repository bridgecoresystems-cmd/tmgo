import { db } from '../db'
import { vehicleMakes, vehicleModels } from './vehicle-makes-schema'
import { VEHICLE_MAKES_SEED } from './vehicle-makes-seed'

export async function seedVehicleMakes() {
  console.log('Seeding vehicle makes and models...')

  for (const make of VEHICLE_MAKES_SEED) {
    const [inserted] = await db
      .insert(vehicleMakes)
      .values({
        name:        make.name,
        slug:        make.slug,
        countryCode: make.countryCode,
        isCustom:    false,
        isActive:    true,
      })
      .onConflictDoNothing()
      .returning()

    if (!inserted) continue // уже есть в БД

    for (const model of make.models) {
      await db
        .insert(vehicleModels)
        .values({
          makeId:          inserted.id,
          name:            model.name,
          slug:            model.slug,
          compatibleTypes: model.compatibleTypes,
          isCustom:        false,
          isActive:        true,
        })
        .onConflictDoNothing()
    }
  }

  console.log(`Done: ${VEHICLE_MAKES_SEED.length} makes seeded`)
}
