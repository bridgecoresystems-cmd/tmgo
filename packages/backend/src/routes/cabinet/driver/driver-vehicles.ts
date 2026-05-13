import { Elysia, t } from 'elysia';
import { db } from '../../../db';
import {
  driverVehicles,
  vehicleMakes,
  vehicleModels,
  carrierProfiles,
} from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromRequest } from '../../../lib/auth';
import {
  vehicleTypeIds,
  chassisTypeIds,
  axleConfigIds,
} from '@tmgo/shared';

const vehicleTypeUnion = t.Union(vehicleTypeIds.map((id) => t.Literal(id)) as [typeof t.Literal, ...typeof t.Literal[]]);
const chassisTypeUnion = t.Union(chassisTypeIds.map((id) => t.Literal(id)) as [typeof t.Literal, ...typeof t.Literal[]]);
const axleConfigUnion = t.Union(axleConfigIds.map((id) => t.Literal(id)) as [typeof t.Literal, ...typeof t.Literal[]]);

const createBody = t.Object({
  plateNumber: t.String({ minLength: 2, maxLength: 20 }),
  vehicleType: t.Optional(vehicleTypeUnion),
  vin: t.Optional(t.String({ minLength: 17, maxLength: 17 })),
  chassisNumber: t.Optional(t.String()),
  chassisType: t.Optional(chassisTypeUnion),
  axleConfig: t.Optional(axleConfigUnion),
  color: t.Optional(t.String()),
  capacityTons: t.Optional(t.Number({ minimum: 0.1, maximum: 200 })),
  hasGps: t.Optional(t.Boolean()),
  insurancePolicyNum: t.Optional(t.String()),
  insuranceExpiresAt: t.Optional(t.String()),
  year: t.Optional(t.Union([t.Number(), t.String()])),
  makeId: t.Optional(t.String({ format: 'uuid' })),
  modelId: t.Optional(t.String({ format: 'uuid' })),
  customMake: t.Optional(t.String()),
  customModel: t.Optional(t.String()),
  ownership: t.Optional(t.Union([t.Literal('own'), t.Literal('company'), t.Literal('leased')])),
  fuelType: t.Optional(t.Union([t.Literal('diesel'), t.Literal('lpg'), t.Literal('lng'), t.Literal('electric'), t.Literal('hybrid')])),
  engineVolumeL: t.Optional(t.Number()),
  powerHp: t.Optional(t.Number()),
  fuelTank1L: t.Optional(t.Number()),
  fuelTank2L: t.Optional(t.Number()),
  transmission: t.Optional(t.Union([t.Literal('manual'), t.Literal('automatic'), t.Literal('robotized')])),
  euroClass: t.Optional(t.Union([t.Literal('euro3'), t.Literal('euro4'), t.Literal('euro5'), t.Literal('euro6')])),
  fuelConsumptionPer100km: t.Optional(t.Number()),
  fifthWheelCapacityKg: t.Optional(t.Number()),
  maxGrossWeightT: t.Optional(t.Number()),
});

const patchBody = t.Object({
  plateNumber: t.Optional(t.String({ minLength: 2, maxLength: 20 })),
  vehicleType: t.Optional(vehicleTypeUnion),
  vin: t.Optional(t.String({ minLength: 17, maxLength: 17 })),
  chassisNumber: t.Optional(t.String()),
  chassisType: t.Optional(chassisTypeUnion),
  axleConfig: t.Optional(axleConfigUnion),
  color: t.Optional(t.String()),
  capacityTons: t.Optional(t.Number({ minimum: 0.1, maximum: 200 })),
  hasGps: t.Optional(t.Boolean()),
  insurancePolicyNum: t.Optional(t.String()),
  insuranceExpiresAt: t.Optional(t.String()),
  year: t.Optional(t.Union([t.Number(), t.String()])),
  makeId: t.Optional(t.Nullable(t.String({ format: 'uuid' }))),
  modelId: t.Optional(t.Nullable(t.String({ format: 'uuid' }))),
  customMake: t.Optional(t.Nullable(t.String())),
  customModel: t.Optional(t.Nullable(t.String())),
  ownership: t.Optional(t.Union([t.Literal('own'), t.Literal('company'), t.Literal('leased')])),
  fuelType: t.Optional(t.Union([t.Literal('diesel'), t.Literal('lpg'), t.Literal('lng'), t.Literal('electric'), t.Literal('hybrid')])),
  engineVolumeL: t.Optional(t.Number()),
  powerHp: t.Optional(t.Number()),
  fuelTank1L: t.Optional(t.Number()),
  fuelTank2L: t.Optional(t.Number()),
  transmission: t.Optional(t.Union([t.Literal('manual'), t.Literal('automatic'), t.Literal('robotized')])),
  euroClass: t.Optional(t.Union([t.Literal('euro3'), t.Literal('euro4'), t.Literal('euro5'), t.Literal('euro6')])),
  fuelConsumptionPer100km: t.Optional(t.Number()),
  fifthWheelCapacityKg: t.Optional(t.Number()),
  maxGrossWeightT: t.Optional(t.Number()),
});

function toVehicleResponse(v: typeof driverVehicles.$inferSelect, make?: { name: string } | null, model?: { name: string } | null) {
  return {
    id: v.id,
    plateNumber: v.plateNumber,
    vehicleType: v.vehicleType,
    brand: v.brand ?? make?.name ?? v.customMake,
    model: v.model ?? model?.name ?? v.customModel,
    year: v.year,
    capacityTons: v.capacityTons ? Number(v.capacityTons) : null,
    vin: v.vin,
    chassisNumber: v.chassisNumber,
    chassisType: v.chassisType,
    axleConfig: v.axleConfig,
    color: v.color,
    hasGps: v.hasGps,
    insurancePolicyNum: v.insurancePolicyNum,
    insuranceExpiresAt: v.insuranceExpiresAt ? new Date(v.insuranceExpiresAt).toISOString() : null,
    makeId: v.makeId,
    modelId: v.modelId,
    customMake: v.customMake,
    customModel: v.customModel,
    ownership: v.ownership,
    fuelType: v.fuelType,
    engineVolumeL: v.engineVolumeL ? Number(v.engineVolumeL) : null,
    powerHp: v.powerHp,
    fuelTank1L: v.fuelTank1L,
    fuelTank2L: v.fuelTank2L,
    transmission: v.transmission,
    euroClass: v.euroClass,
    fuelConsumptionPer100km: v.fuelConsumptionPer100km ? Number(v.fuelConsumptionPer100km) : null,
    fifthWheelCapacityKg: v.fifthWheelCapacityKg,
    maxGrossWeightT: v.maxGrossWeightT ? Number(v.maxGrossWeightT) : null,
    isActive: v.isActive,
    createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : null,
  };
}

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
  // GET /makes — список марок (до /:id)
  .get('/makes', async () => {
    const list = await db.select({
      id: vehicleMakes.id,
      name: vehicleMakes.name,
      slug: vehicleMakes.slug,
      countryCode: vehicleMakes.countryCode,
    }).from(vehicleMakes).where(eq(vehicleMakes.isActive, true)).orderBy(vehicleMakes.name);
    return list;
  })
  // GET /makes/:makeId/models — модели марки
  .get('/makes/:makeId/models', async ({ params, query }) => {
    const vehicleType = (query as { vehicleType?: string }).vehicleType;
    const models = await db.select({
      id: vehicleModels.id,
      name: vehicleModels.name,
      slug: vehicleModels.slug,
      compatibleTypes: vehicleModels.compatibleTypes,
    }).from(vehicleModels).where(and(eq(vehicleModels.makeId, params.makeId), eq(vehicleModels.isActive, true)));

    if (vehicleType && models.length > 0) {
      return models.filter((m) => m.compatibleTypes?.includes(vehicleType) ?? true);
    }
    return models;
  })
  // GET / — список ТС
  .get('/', async ({ carrierProfile }) => {
    const list = await db.select().from(driverVehicles)
      .where(and(eq(driverVehicles.carrierId, carrierProfile.id), eq(driverVehicles.isActive, true)));

    const result = [];
    for (const v of list) {
      let make = null;
      let model = null;
      if (v.makeId) {
        [make] = await db.select({ name: vehicleMakes.name }).from(vehicleMakes).where(eq(vehicleMakes.id, v.makeId)).limit(1);
      }
      if (v.modelId) {
        [model] = await db.select({ name: vehicleModels.name }).from(vehicleModels).where(eq(vehicleModels.id, v.modelId)).limit(1);
      }
      result.push(toVehicleResponse(v, make, model));
    }
    return result;
  })
  // POST / — создать
  .post('/', async ({ carrierProfile, body }) => {
    const [created] = await db.insert(driverVehicles).values({
      carrierId: carrierProfile.id,
      plateNumber: body.plateNumber,
      vehicleType: body.vehicleType ?? null,
      vin: body.vin ?? null,
      chassisNumber: body.chassisNumber ?? null,
      chassisType: body.chassisType ?? null,
      axleConfig: body.axleConfig ?? null,
      color: body.color ?? null,
      capacityTons: body.capacityTons != null ? String(body.capacityTons) : null,
      hasGps: body.hasGps ?? false,
      insurancePolicyNum: body.insurancePolicyNum ?? null,
      insuranceExpiresAt: body.insuranceExpiresAt ? new Date(body.insuranceExpiresAt) : null,
      year: body.year != null ? String(body.year) : null,
      makeId: body.makeId ?? null,
      modelId: body.modelId ?? null,
      customMake: body.customMake ?? null,
      customModel: body.customModel ?? null,
      ownership: body.ownership ?? null,
      fuelType: body.fuelType ?? null,
      engineVolumeL: body.engineVolumeL != null ? String(body.engineVolumeL) : null,
      powerHp: body.powerHp ?? null,
      fuelTank1L: body.fuelTank1L ?? null,
      fuelTank2L: body.fuelTank2L ?? null,
      transmission: body.transmission ?? null,
      euroClass: body.euroClass ?? null,
      fuelConsumptionPer100km: body.fuelConsumptionPer100km != null ? String(body.fuelConsumptionPer100km) : null,
      fifthWheelCapacityKg: body.fifthWheelCapacityKg ?? null,
      maxGrossWeightT: body.maxGrossWeightT != null ? String(body.maxGrossWeightT) : null,
    }).returning();

    let make = null;
    let model = null;
    if (created!.makeId) {
      [make] = await db.select({ name: vehicleMakes.name }).from(vehicleMakes).where(eq(vehicleMakes.id, created!.makeId)).limit(1);
    }
    if (created!.modelId) {
      [model] = await db.select({ name: vehicleModels.name }).from(vehicleModels).where(eq(vehicleModels.id, created!.modelId)).limit(1);
    }
    return toVehicleResponse(created!, make, model);
  }, { body: createBody })
  // GET /:id — карточка
  .get('/:id', async ({ carrierProfile, params, set }) => {
    const [v] = await db.select().from(driverVehicles)
      .where(and(eq(driverVehicles.id, params.id), eq(driverVehicles.carrierId, carrierProfile.id)))
      .limit(1);
    if (!v) {
      set.status = 404;
      return { error: 'Vehicle not found' };
    }
    let make = null;
    let model = null;
    if (v.makeId) {
      [make] = await db.select({ name: vehicleMakes.name }).from(vehicleMakes).where(eq(vehicleMakes.id, v.makeId)).limit(1);
    }
    if (v.modelId) {
      [model] = await db.select({ name: vehicleModels.name }).from(vehicleModels).where(eq(vehicleModels.id, v.modelId)).limit(1);
    }
    return toVehicleResponse(v, make, model);
  })
  // PATCH /:id — обновить
  .patch('/:id', async ({ carrierProfile, params, body, set }) => {
    const [v] = await db.select().from(driverVehicles)
      .where(and(eq(driverVehicles.id, params.id), eq(driverVehicles.carrierId, carrierProfile.id)))
      .limit(1);
    if (!v) {
      set.status = 404;
      return { error: 'Vehicle not found' };
    }

    const update: Record<string, unknown> = {};
    if (body.plateNumber !== undefined) update.plateNumber = body.plateNumber;
    if (body.vehicleType !== undefined) update.vehicleType = body.vehicleType;
    if (body.vin !== undefined) update.vin = body.vin;
    if (body.chassisNumber !== undefined) update.chassisNumber = body.chassisNumber;
    if (body.chassisType !== undefined) update.chassisType = body.chassisType;
    if (body.axleConfig !== undefined) update.axleConfig = body.axleConfig;
    if (body.color !== undefined) update.color = body.color;
    if (body.capacityTons !== undefined) update.capacityTons = body.capacityTons != null ? String(body.capacityTons) : null;
    if (body.hasGps !== undefined) update.hasGps = body.hasGps;
    if (body.insurancePolicyNum !== undefined) update.insurancePolicyNum = body.insurancePolicyNum;
    if (body.insuranceExpiresAt !== undefined) update.insuranceExpiresAt = body.insuranceExpiresAt ? new Date(body.insuranceExpiresAt) : null;
    if (body.year !== undefined) update.year = body.year != null ? String(body.year) : null;
    if (body.makeId !== undefined) update.makeId = body.makeId;
    if (body.modelId !== undefined) update.modelId = body.modelId;
    if (body.customMake !== undefined) update.customMake = body.customMake;
    if (body.customModel !== undefined) update.customModel = body.customModel;
    if (body.ownership !== undefined) update.ownership = body.ownership;
    if (body.fuelType !== undefined) update.fuelType = body.fuelType;
    if (body.engineVolumeL !== undefined) update.engineVolumeL = body.engineVolumeL != null ? String(body.engineVolumeL) : null;
    if (body.powerHp !== undefined) update.powerHp = body.powerHp;
    if (body.fuelTank1L !== undefined) update.fuelTank1L = body.fuelTank1L;
    if (body.fuelTank2L !== undefined) update.fuelTank2L = body.fuelTank2L;
    if (body.transmission !== undefined) update.transmission = body.transmission;
    if (body.euroClass !== undefined) update.euroClass = body.euroClass;
    if (body.fuelConsumptionPer100km !== undefined) update.fuelConsumptionPer100km = body.fuelConsumptionPer100km != null ? String(body.fuelConsumptionPer100km) : null;
    if (body.fifthWheelCapacityKg !== undefined) update.fifthWheelCapacityKg = body.fifthWheelCapacityKg;
    if (body.maxGrossWeightT !== undefined) update.maxGrossWeightT = body.maxGrossWeightT != null ? String(body.maxGrossWeightT) : null;

    const [updated] = await db.update(driverVehicles).set(update as Record<string, unknown>).where(eq(driverVehicles.id, params.id)).returning();
    let make = null;
    let model = null;
    if (updated!.makeId) {
      [make] = await db.select({ name: vehicleMakes.name }).from(vehicleMakes).where(eq(vehicleMakes.id, updated!.makeId)).limit(1);
    }
    if (updated!.modelId) {
      [model] = await db.select({ name: vehicleModels.name }).from(vehicleModels).where(eq(vehicleModels.id, updated!.modelId)).limit(1);
    }
    return toVehicleResponse(updated!, make, model);
  }, { body: patchBody })
  // DELETE /:id — soft delete
  .delete('/:id', async ({ carrierProfile, params, set }) => {
    const [v] = await db.select().from(driverVehicles)
      .where(and(eq(driverVehicles.id, params.id), eq(driverVehicles.carrierId, carrierProfile.id)))
      .limit(1);
    if (!v) {
      set.status = 404;
      return { error: 'Vehicle not found' };
    }
    await db.update(driverVehicles).set({
      isActive: false,
      assignedUntil: new Date(),
    }).where(eq(driverVehicles.id, params.id));
    return { success: true };
  });
