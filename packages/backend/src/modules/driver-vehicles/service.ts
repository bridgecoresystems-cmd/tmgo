import { db } from '../../db';
import { driverVehicles, vehicleMakes, vehicleModels } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFound } from '../../lib/errors';

type Vehicle = typeof driverVehicles.$inferSelect;

function toVehicleResponse(v: Vehicle, make?: { name: string } | null, model?: { name: string } | null) {
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

async function resolveMakeModel(v: Vehicle) {
  let make = null;
  let model = null;
  if (v.makeId) {
    [make] = await db.select({ name: vehicleMakes.name }).from(vehicleMakes).where(eq(vehicleMakes.id, v.makeId)).limit(1);
  }
  if (v.modelId) {
    [model] = await db.select({ name: vehicleModels.name }).from(vehicleModels).where(eq(vehicleModels.id, v.modelId)).limit(1);
  }
  return toVehicleResponse(v, make, model);
}

export function listMakes() {
  return db.select({
    id: vehicleMakes.id,
    name: vehicleMakes.name,
    slug: vehicleMakes.slug,
    countryCode: vehicleMakes.countryCode,
  }).from(vehicleMakes).where(eq(vehicleMakes.isActive, true)).orderBy(vehicleMakes.name);
}

export async function listModels(makeId: string, vehicleType?: string) {
  const models = await db.select({
    id: vehicleModels.id,
    name: vehicleModels.name,
    slug: vehicleModels.slug,
    compatibleTypes: vehicleModels.compatibleTypes,
  }).from(vehicleModels).where(and(eq(vehicleModels.makeId, makeId), eq(vehicleModels.isActive, true)));

  if (vehicleType && models.length > 0) {
    return models.filter((m) => m.compatibleTypes?.includes(vehicleType) ?? true);
  }
  return models;
}

export async function listVehicles(carrierId: string) {
  const list = await db.select().from(driverVehicles)
    .where(and(eq(driverVehicles.carrierId, carrierId), eq(driverVehicles.isActive, true)));
  const result = [];
  for (const v of list) result.push(await resolveMakeModel(v));
  return result;
}

type VehicleInput = Record<string, unknown>;

function buildInsertValues(carrierId: string, body: VehicleInput) {
  const b = body as Record<string, any>;
  return {
    carrierId,
    plateNumber: b.plateNumber,
    vehicleType: b.vehicleType ?? null,
    vin: b.vin ?? null,
    chassisNumber: b.chassisNumber ?? null,
    chassisType: b.chassisType ?? null,
    axleConfig: b.axleConfig ?? null,
    color: b.color ?? null,
    capacityTons: b.capacityTons != null ? String(b.capacityTons) : null,
    hasGps: b.hasGps ?? false,
    insurancePolicyNum: b.insurancePolicyNum ?? null,
    insuranceExpiresAt: b.insuranceExpiresAt ? new Date(b.insuranceExpiresAt) : null,
    year: b.year != null ? String(b.year) : null,
    makeId: b.makeId ?? null,
    modelId: b.modelId ?? null,
    customMake: b.customMake ?? null,
    customModel: b.customModel ?? null,
    ownership: b.ownership ?? null,
    fuelType: b.fuelType ?? null,
    engineVolumeL: b.engineVolumeL != null ? String(b.engineVolumeL) : null,
    powerHp: b.powerHp ?? null,
    fuelTank1L: b.fuelTank1L ?? null,
    fuelTank2L: b.fuelTank2L ?? null,
    transmission: b.transmission ?? null,
    euroClass: b.euroClass ?? null,
    fuelConsumptionPer100km: b.fuelConsumptionPer100km != null ? String(b.fuelConsumptionPer100km) : null,
    fifthWheelCapacityKg: b.fifthWheelCapacityKg ?? null,
    maxGrossWeightT: b.maxGrossWeightT != null ? String(b.maxGrossWeightT) : null,
  };
}

export async function createVehicle(carrierId: string, body: VehicleInput) {
  const [created] = await db.insert(driverVehicles)
    .values(buildInsertValues(carrierId, body)).returning();
  return resolveMakeModel(created!);
}

async function findOwned(carrierId: string, id: string) {
  const [v] = await db.select().from(driverVehicles)
    .where(and(eq(driverVehicles.id, id), eq(driverVehicles.carrierId, carrierId)))
    .limit(1);
  if (!v) throw new NotFound('Vehicle not found');
  return v;
}

export async function getVehicle(carrierId: string, id: string) {
  const v = await findOwned(carrierId, id);
  return resolveMakeModel(v);
}

export async function updateVehicle(carrierId: string, id: string, body: VehicleInput) {
  await findOwned(carrierId, id);
  const b = body as Record<string, any>;
  const update: Record<string, unknown> = {};
  const set = (k: string, val: unknown) => { if (b[k] !== undefined) update[k] = val; };

  set('plateNumber', b.plateNumber);
  set('vehicleType', b.vehicleType);
  set('vin', b.vin);
  set('chassisNumber', b.chassisNumber);
  set('chassisType', b.chassisType);
  set('axleConfig', b.axleConfig);
  set('color', b.color);
  if (b.capacityTons !== undefined) update.capacityTons = b.capacityTons != null ? String(b.capacityTons) : null;
  set('hasGps', b.hasGps);
  set('insurancePolicyNum', b.insurancePolicyNum);
  if (b.insuranceExpiresAt !== undefined) update.insuranceExpiresAt = b.insuranceExpiresAt ? new Date(b.insuranceExpiresAt) : null;
  if (b.year !== undefined) update.year = b.year != null ? String(b.year) : null;
  set('makeId', b.makeId);
  set('modelId', b.modelId);
  set('customMake', b.customMake);
  set('customModel', b.customModel);
  set('ownership', b.ownership);
  set('fuelType', b.fuelType);
  if (b.engineVolumeL !== undefined) update.engineVolumeL = b.engineVolumeL != null ? String(b.engineVolumeL) : null;
  set('powerHp', b.powerHp);
  set('fuelTank1L', b.fuelTank1L);
  set('fuelTank2L', b.fuelTank2L);
  set('transmission', b.transmission);
  set('euroClass', b.euroClass);
  if (b.fuelConsumptionPer100km !== undefined) update.fuelConsumptionPer100km = b.fuelConsumptionPer100km != null ? String(b.fuelConsumptionPer100km) : null;
  set('fifthWheelCapacityKg', b.fifthWheelCapacityKg);
  if (b.maxGrossWeightT !== undefined) update.maxGrossWeightT = b.maxGrossWeightT != null ? String(b.maxGrossWeightT) : null;

  const [updated] = await db.update(driverVehicles).set(update).where(eq(driverVehicles.id, id)).returning();
  return resolveMakeModel(updated!);
}

export async function deleteVehicle(carrierId: string, id: string) {
  const v = await findOwned(carrierId, id);
  await db.update(driverVehicles).set({
    isActive: false,
    assignedUntil: new Date(),
  }).where(eq(driverVehicles.id, v.id));
  return { success: true };
}
