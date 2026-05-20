import { db } from '../../db';
import { driverTrailers, vehicleCouplings, driverVehicles, vehicleMakes, vehicleModels } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { REEFER_BODY_TYPES } from '@tmgo/shared';
import { AppError, NotFound, Conflict } from '../../lib/errors';

const REEFER_REQUIRED_MSG = 'Для рефрижераторного прицепа обязательно заполните параметры холодильного агрегата';

async function resolveMakeModel(makeId?: string | null, modelId?: string | null) {
  let make: { name: string } | null = null;
  let model: { name: string } | null = null;
  if (makeId) {
    [make] = await db.select({ name: vehicleMakes.name }).from(vehicleMakes).where(eq(vehicleMakes.id, makeId)).limit(1);
  }
  if (modelId) {
    [model] = await db.select({ name: vehicleModels.name }).from(vehicleModels).where(eq(vehicleModels.id, modelId)).limit(1);
  }
  return { make, model };
}

function toTrailerResponse(v: typeof driverTrailers.$inferSelect, make?: { name: string } | null, model?: { name: string } | null) {
  return {
    id: v.id,
    plateNumber: v.plateNumber,
    trailerType: v.trailerType,
    bodyType: v.bodyType,
    color: v.color,
    brand: make?.name ?? v.customMake ?? null,
    model: model?.name ?? v.customModel ?? null,
    year: v.year,
    vin: v.vin,
    chassisNumber: v.chassisNumber,
    capacityTons: v.capacityTons ? Number(v.capacityTons) : null,
    volumeM3: v.volumeM3 ? Number(v.volumeM3) : null,
    axleCount: v.axleCount,
    palletPlaces: v.palletPlaces,
    adrClasses: v.adrClasses ?? [],
    tempMinC: v.tempMinC,
    tempMaxC: v.tempMaxC,
    hasGps: v.hasGps,
    insurancePolicyNum: v.insurancePolicyNum,
    insuranceExpiresAt: v.insuranceExpiresAt ? new Date(v.insuranceExpiresAt).toISOString() : null,
    refFuelType: v.refFuelType,
    refFuelTankL: v.refFuelTankL,
    refTransmission: v.refTransmission,
    refFuelConsumptionPh: v.refFuelConsumptionPh ? Number(v.refFuelConsumptionPh) : null,
    ownership: v.ownership,
    makeId: v.makeId,
    modelId: v.modelId,
    customMake: v.customMake,
    customModel: v.customModel,
    isActive: v.isActive,
    createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : null,
    updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : null,
  };
}

const isReefer = (bodyType: unknown) => REEFER_BODY_TYPES.includes(bodyType as never);

export async function listTrailers(carrierId: string) {
  const list = await db.select().from(driverTrailers)
    .where(and(eq(driverTrailers.carrierId, carrierId), eq(driverTrailers.isActive, true)));
  const result = [];
  for (const v of list) {
    const { make, model } = await resolveMakeModel(v.makeId, v.modelId);
    result.push(toTrailerResponse(v, make, model));
  }
  return result;
}

export async function createTrailer(carrierId: string, body: Record<string, any>) {
  if (isReefer(body.bodyType)) {
    if (!body.refFuelType || !body.refFuelTankL || !body.refTransmission || !body.refFuelConsumptionPh) {
      throw new AppError(422, REEFER_REQUIRED_MSG);
    }
  }
  const [created] = await db.insert(driverTrailers).values({
    carrierId,
    vin: body.vin ?? null,
    trailerType: body.trailerType,
    bodyType: body.bodyType,
    plateNumber: body.plateNumber,
    color: body.color,
    makeId: body.makeId ?? null,
    modelId: body.modelId ?? null,
    customMake: body.customMake ?? null,
    customModel: body.customModel ?? null,
    year: body.year ?? null,
    chassisNumber: body.chassisNumber ?? null,
    capacityTons: String(body.capacityTons),
    volumeM3: body.volumeM3 != null ? String(body.volumeM3) : null,
    axleCount: body.axleCount ?? null,
    palletPlaces: body.palletPlaces ?? null,
    adrClasses: body.adrClasses ?? [],
    tempMinC: body.tempMinC ?? null,
    tempMaxC: body.tempMaxC ?? null,
    hasGps: body.hasGps ?? false,
    insurancePolicyNum: body.insurancePolicyNum ?? null,
    insuranceExpiresAt: body.insuranceExpiresAt ? new Date(body.insuranceExpiresAt) : null,
    refFuelType: body.refFuelType ?? null,
    refFuelTankL: body.refFuelTankL ?? null,
    refTransmission: body.refTransmission ?? null,
    refFuelConsumptionPh: body.refFuelConsumptionPh != null ? String(body.refFuelConsumptionPh) : null,
    ownership: body.ownership ?? null,
  }).returning();
  const { make, model } = await resolveMakeModel(created!.makeId, created!.modelId);
  return toTrailerResponse(created!, make, model);
}

async function findOwnedTrailer(carrierId: string, id: string) {
  const [v] = await db.select().from(driverTrailers)
    .where(and(eq(driverTrailers.id, id), eq(driverTrailers.carrierId, carrierId)))
    .limit(1);
  if (!v) throw new NotFound('Прицеп не найден');
  return v;
}

export async function getTrailer(carrierId: string, id: string) {
  const v = await findOwnedTrailer(carrierId, id);
  const { make, model } = await resolveMakeModel(v.makeId, v.modelId);
  return toTrailerResponse(v, make, model);
}

export async function updateTrailer(carrierId: string, id: string, body: Record<string, any>) {
  const v = await findOwnedTrailer(carrierId, id);

  const newBodyType = body.bodyType ?? v.bodyType;
  if (isReefer(newBodyType)) {
    const refFuel = body.refFuelType ?? v.refFuelType;
    const refTank = body.refFuelTankL ?? v.refFuelTankL;
    const refTrans = body.refTransmission ?? v.refTransmission;
    const refCons = body.refFuelConsumptionPh ?? (v.refFuelConsumptionPh ? Number(v.refFuelConsumptionPh) : null);
    if (!refFuel || !refTank || !refTrans || !refCons) {
      throw new AppError(422, REEFER_REQUIRED_MSG);
    }
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  const set = (k: string, val: unknown) => { if (body[k] !== undefined) update[k] = val; };
  set('vin', body.vin);
  set('trailerType', body.trailerType);
  set('bodyType', body.bodyType);
  set('plateNumber', body.plateNumber);
  set('color', body.color);
  set('makeId', body.makeId);
  set('modelId', body.modelId);
  set('customMake', body.customMake);
  set('customModel', body.customModel);
  set('year', body.year);
  set('chassisNumber', body.chassisNumber);
  if (body.capacityTons !== undefined) update.capacityTons = String(body.capacityTons);
  if (body.volumeM3 !== undefined) update.volumeM3 = body.volumeM3 != null ? String(body.volumeM3) : null;
  set('axleCount', body.axleCount);
  set('palletPlaces', body.palletPlaces);
  set('adrClasses', body.adrClasses);
  set('tempMinC', body.tempMinC);
  set('tempMaxC', body.tempMaxC);
  set('hasGps', body.hasGps);
  set('insurancePolicyNum', body.insurancePolicyNum);
  if (body.insuranceExpiresAt !== undefined) update.insuranceExpiresAt = body.insuranceExpiresAt ? new Date(body.insuranceExpiresAt) : null;
  set('refFuelType', body.refFuelType);
  set('refFuelTankL', body.refFuelTankL);
  set('refTransmission', body.refTransmission);
  if (body.refFuelConsumptionPh !== undefined) update.refFuelConsumptionPh = body.refFuelConsumptionPh != null ? String(body.refFuelConsumptionPh) : null;
  set('ownership', body.ownership);

  const [updated] = await db.update(driverTrailers).set(update).where(eq(driverTrailers.id, id)).returning();
  const { make, model } = await resolveMakeModel(updated!.makeId, updated!.modelId);
  return toTrailerResponse(updated!, make, model);
}

export async function deleteTrailer(carrierId: string, id: string) {
  const v = await findOwnedTrailer(carrierId, id);
  await db.update(vehicleCouplings).set({ isActive: false, decoupledAt: new Date() })
    .where(and(eq(vehicleCouplings.trailerId, id), eq(vehicleCouplings.isActive, true)));
  await db.update(driverTrailers).set({ isActive: false, updatedAt: new Date() })
    .where(eq(driverTrailers.id, v.id));
  return { success: true };
}

export async function listCouplings(carrierId: string) {
  const couplings = await db.select().from(vehicleCouplings)
    .where(and(eq(vehicleCouplings.carrierId, carrierId), eq(vehicleCouplings.isActive, true)));

  const result = [];
  for (const c of couplings) {
    const [tractor] = await db.select({
      id: driverVehicles.id,
      plateNumber: driverVehicles.plateNumber,
      brand: driverVehicles.brand,
      model: driverVehicles.model,
      customMake: driverVehicles.customMake,
      customModel: driverVehicles.customModel,
      makeId: driverVehicles.makeId,
      modelId: driverVehicles.modelId,
    }).from(driverVehicles).where(eq(driverVehicles.id, c.tractorId)).limit(1);

    const [trailer] = await db.select({
      id: driverTrailers.id,
      plateNumber: driverTrailers.plateNumber,
      bodyType: driverTrailers.bodyType,
      customMake: driverTrailers.customMake,
      customModel: driverTrailers.customModel,
      makeId: driverTrailers.makeId,
      modelId: driverTrailers.modelId,
    }).from(driverTrailers).where(eq(driverTrailers.id, c.trailerId)).limit(1);

    if (!tractor || !trailer) continue;

    const { make: tMake, model: tModel } = await resolveMakeModel(tractor.makeId, tractor.modelId);
    const { make: trMake, model: trModel } = await resolveMakeModel(trailer.makeId, trailer.modelId);

    result.push({
      id: c.id,
      coupledAt: c.coupledAt ? new Date(c.coupledAt).toISOString() : null,
      notes: c.notes,
      tractor: {
        id: tractor.id,
        plateNumber: tractor.plateNumber,
        brand: tractor.brand ?? tMake?.name ?? tractor.customMake ?? null,
        model: tractor.model ?? tModel?.name ?? tractor.customModel ?? null,
      },
      trailer: {
        id: trailer.id,
        plateNumber: trailer.plateNumber,
        bodyType: trailer.bodyType,
        brand: trMake?.name ?? trailer.customMake ?? null,
        model: trModel?.name ?? trailer.customModel ?? null,
      },
    });
  }
  return result;
}

export async function createCoupling(
  carrierId: string,
  body: { tractorId: string; trailerId: string; notes?: string },
) {
  const [tractor] = await db.select({ id: driverVehicles.id })
    .from(driverVehicles)
    .where(and(eq(driverVehicles.id, body.tractorId), eq(driverVehicles.carrierId, carrierId), eq(driverVehicles.isActive, true)))
    .limit(1);
  if (!tractor) throw new NotFound('Тягач не найден');

  const [trailer] = await db.select({ id: driverTrailers.id })
    .from(driverTrailers)
    .where(and(eq(driverTrailers.id, body.trailerId), eq(driverTrailers.carrierId, carrierId), eq(driverTrailers.isActive, true)))
    .limit(1);
  if (!trailer) throw new NotFound('Прицеп не найден');

  const [tractorBusy] = await db.select({ id: vehicleCouplings.id })
    .from(vehicleCouplings)
    .where(and(eq(vehicleCouplings.tractorId, body.tractorId), eq(vehicleCouplings.isActive, true)))
    .limit(1);
  if (tractorBusy) throw new Conflict('Тягач уже прицеплен к другому прицепу');

  const [trailerBusy] = await db.select({ id: vehicleCouplings.id })
    .from(vehicleCouplings)
    .where(and(eq(vehicleCouplings.trailerId, body.trailerId), eq(vehicleCouplings.isActive, true)))
    .limit(1);
  if (trailerBusy) throw new Conflict('Прицеп уже прицеплен к другому тягачу');

  const [created] = await db.insert(vehicleCouplings).values({
    carrierId,
    tractorId: body.tractorId,
    trailerId: body.trailerId,
    notes: body.notes ?? null,
  }).returning();

  return { id: created!.id, coupledAt: new Date(created!.coupledAt).toISOString() };
}

export async function deleteCoupling(carrierId: string, id: string) {
  const [c] = await db.select().from(vehicleCouplings)
    .where(and(eq(vehicleCouplings.id, id), eq(vehicleCouplings.carrierId, carrierId)))
    .limit(1);
  if (!c) throw new NotFound('Сцепка не найдена');

  await db.update(vehicleCouplings).set({ isActive: false, decoupledAt: new Date() })
    .where(eq(vehicleCouplings.id, id));
  return { success: true };
}
