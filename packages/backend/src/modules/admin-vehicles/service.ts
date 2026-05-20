import { db } from '../../db';
import { driverVehicles, vehicleMakes, vehicleModels, carrierProfiles, users } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { NotFound } from '../../lib/errors';

type Vehicle = typeof driverVehicles.$inferSelect;
type Owner = { id: string; name: string; email: string; driverName: string | null } | null;

function toVehicleResponse(v: Vehicle, make?: { name: string } | null, model?: { name: string } | null, owner?: Owner) {
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
    owner,
  };
}

async function makeModelFor(v: Vehicle) {
  let make = null;
  let model = null;
  if (v.makeId) {
    [make] = await db.select({ name: vehicleMakes.name }).from(vehicleMakes).where(eq(vehicleMakes.id, v.makeId)).limit(1);
  }
  if (v.modelId) {
    [model] = await db.select({ name: vehicleModels.name }).from(vehicleModels).where(eq(vehicleModels.id, v.modelId)).limit(1);
  }
  return { make, model };
}

function buildOwner(
  userId: string, userName: string | null, userEmail: string | null,
  surname: string | null, givenName: string | null, patronymic: string | null,
): Owner {
  const parts = [surname, givenName, patronymic].filter(Boolean);
  return {
    id: userId,
    name: userName ?? '',
    email: userEmail ?? '',
    driverName: parts.length ? parts.join(' ') : null,
  };
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

const ownerJoinColumns = {
  v: driverVehicles,
  userId: users.id,
  userName: users.name,
  userEmail: users.email,
  surname: carrierProfiles.surname,
  givenName: carrierProfiles.givenName,
  patronymic: carrierProfiles.patronymic,
};

export async function listAllVehicles(query: {
  include_inactive?: string; inactive_only?: string; search?: string;
}) {
  const includeInactive = query.include_inactive === '1';
  const inactiveOnly = query.inactive_only === '1';
  const search = (query.search || '').trim().toLowerCase();

  let list = await db
    .select(ownerJoinColumns)
    .from(driverVehicles)
    .innerJoin(carrierProfiles, eq(driverVehicles.carrierId, carrierProfiles.id))
    .innerJoin(users, eq(carrierProfiles.userId, users.id))
    .orderBy(desc(driverVehicles.createdAt));

  if (!includeInactive && !inactiveOnly) {
    list = list.filter((r) => r.v.isActive === true);
  } else if (inactiveOnly) {
    list = list.filter((r) => r.v.isActive === false);
  }

  if (search) {
    list = list.filter((r) => {
      const parts = [r.surname, r.givenName, r.patronymic].filter(Boolean);
      const driverName = parts.length ? parts.join(' ') : '';
      return (
        r.v.plateNumber?.toLowerCase().includes(search) ||
        r.v.brand?.toLowerCase().includes(search) ||
        r.v.model?.toLowerCase().includes(search) ||
        r.v.customMake?.toLowerCase().includes(search) ||
        r.v.customModel?.toLowerCase().includes(search) ||
        r.v.vin?.toLowerCase().includes(search) ||
        r.userName?.toLowerCase().includes(search) ||
        r.userEmail?.toLowerCase().includes(search) ||
        driverName.toLowerCase().includes(search)
      );
    });
  }

  const result = [];
  for (const row of list) {
    const { make, model } = await makeModelFor(row.v);
    result.push(toVehicleResponse(row.v, make, model,
      buildOwner(row.userId, row.userName, row.userEmail, row.surname, row.givenName, row.patronymic)));
  }
  return result;
}

export async function getVehicle(id: string) {
  const [row] = await db
    .select(ownerJoinColumns)
    .from(driverVehicles)
    .innerJoin(carrierProfiles, eq(driverVehicles.carrierId, carrierProfiles.id))
    .innerJoin(users, eq(carrierProfiles.userId, users.id))
    .where(eq(driverVehicles.id, id))
    .limit(1);

  if (!row) throw new NotFound('Vehicle not found');

  const { make, model } = await makeModelFor(row.v);
  return toVehicleResponse(row.v, make, model,
    buildOwner(row.userId, row.userName, row.userEmail, row.surname, row.givenName, row.patronymic));
}

export async function updateVehicle(id: string, body: Record<string, unknown>) {
  const [v] = await db.select().from(driverVehicles).where(eq(driverVehicles.id, id)).limit(1);
  if (!v) throw new NotFound('Vehicle not found');

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
  if (b.isActive !== undefined) {
    update.isActive = b.isActive;
    update.assignedUntil = b.isActive ? null : new Date();
  }

  const [updated] = await db.update(driverVehicles).set(update).where(eq(driverVehicles.id, id)).returning();
  const { make, model } = await makeModelFor(updated!);

  const [ownerRow] = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      surname: carrierProfiles.surname,
      givenName: carrierProfiles.givenName,
      patronymic: carrierProfiles.patronymic,
    })
    .from(carrierProfiles)
    .innerJoin(users, eq(carrierProfiles.userId, users.id))
    .where(eq(carrierProfiles.id, updated!.carrierId))
    .limit(1);

  const owner = ownerRow
    ? buildOwner(ownerRow.userId, ownerRow.userName, ownerRow.userEmail,
      ownerRow.surname, ownerRow.givenName, ownerRow.patronymic)
    : null;

  return toVehicleResponse(updated!, make, model, owner);
}

export async function activateVehicle(id: string) {
  const [updated] = await db.update(driverVehicles)
    .set({ isActive: true, assignedUntil: null })
    .where(eq(driverVehicles.id, id))
    .returning();
  if (!updated) throw new NotFound('Vehicle not found');
  return { success: true };
}

export async function deactivateVehicle(id: string) {
  const [updated] = await db.update(driverVehicles)
    .set({ isActive: false, assignedUntil: new Date() })
    .where(eq(driverVehicles.id, id))
    .returning();
  if (!updated) throw new NotFound('Vehicle not found');
  return { success: true };
}
