import { Elysia, t } from 'elysia';
import { db } from '../../db';
import {
  driverVehicles,
  vehicleMakes,
  vehicleModels,
  carrierProfiles,
  users,
} from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';
import {
  vehicleTypeIds,
  chassisTypeIds,
  axleConfigIds,
} from '@tmgo/shared';

const vehicleTypeUnion = t.Union(vehicleTypeIds.map((id) => t.Literal(id)) as [typeof t.Literal, ...typeof t.Literal[]]);
const chassisTypeUnion = t.Union(chassisTypeIds.map((id) => t.Literal(id)) as [typeof t.Literal, ...typeof t.Literal[]]);
const axleConfigUnion = t.Union(axleConfigIds.map((id) => t.Literal(id)) as [typeof t.Literal, ...typeof t.Literal[]]);

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
  isActive: t.Optional(t.Boolean()),
});

function toVehicleResponse(
  v: typeof driverVehicles.$inferSelect,
  make?: { name: string } | null,
  model?: { name: string } | null,
  owner?: { id: string; name: string; email: string; driverName: string | null } | null
) {
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

export const adminVehiclesRoutes = new Elysia({ prefix: '/admin/vehicles' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { adminUser: user };
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
  // GET / — список всех ТС с владельцем
  .get('/', async ({ query }) => {
    const q = query as { include_inactive?: string; inactive_only?: string; search?: string };
    const includeInactive = q.include_inactive === '1';
    const inactiveOnly = q.inactive_only === '1';
    const search = (q.search || '').trim().toLowerCase();

    let list = await db
      .select({
        v: driverVehicles,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        surname: carrierProfiles.surname,
        givenName: carrierProfiles.givenName,
        patronymic: carrierProfiles.patronymic,
      })
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
      const parts = [row.surname, row.givenName, row.patronymic].filter(Boolean);
      const driverName = parts.length ? parts.join(' ') : null;
      let make = null;
      let model = null;
      if (row.v.makeId) {
        [make] = await db.select({ name: vehicleMakes.name }).from(vehicleMakes).where(eq(vehicleMakes.id, row.v.makeId)).limit(1);
      }
      if (row.v.modelId) {
        [model] = await db.select({ name: vehicleModels.name }).from(vehicleModels).where(eq(vehicleModels.id, row.v.modelId)).limit(1);
      }
      result.push(
        toVehicleResponse(row.v, make, model, {
          id: row.userId,
          name: row.userName ?? '',
          email: row.userEmail ?? '',
          driverName,
        })
      );
    }
    return result;
  })
  // GET /:id — карточка ТС
  .get('/:id', async ({ params, set }) => {
    const [row] = await db
      .select({
        v: driverVehicles,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        surname: carrierProfiles.surname,
        givenName: carrierProfiles.givenName,
        patronymic: carrierProfiles.patronymic,
      })
      .from(driverVehicles)
      .innerJoin(carrierProfiles, eq(driverVehicles.carrierId, carrierProfiles.id))
      .innerJoin(users, eq(carrierProfiles.userId, users.id))
      .where(eq(driverVehicles.id, params.id))
      .limit(1);

    if (!row) {
      set.status = 404;
      return { error: 'Vehicle not found' };
    }

    const parts = [row.surname, row.givenName, row.patronymic].filter(Boolean);
    const driverName = parts.length ? parts.join(' ') : null;
    let make = null;
    let model = null;
    if (row.v.makeId) {
      [make] = await db.select({ name: vehicleMakes.name }).from(vehicleMakes).where(eq(vehicleMakes.id, row.v.makeId)).limit(1);
    }
    if (row.v.modelId) {
      [model] = await db.select({ name: vehicleModels.name }).from(vehicleModels).where(eq(vehicleModels.id, row.v.modelId)).limit(1);
    }
    return toVehicleResponse(row.v, make, model, {
      id: row.userId,
      name: row.userName ?? '',
      email: row.userEmail ?? '',
      driverName,
    });
  })
  // PATCH /:id — обновить (включая isActive)
  .patch('/:id', async ({ params, body, set }) => {
    const [v] = await db.select().from(driverVehicles).where(eq(driverVehicles.id, params.id)).limit(1);
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
    if (body.isActive !== undefined) {
      update.isActive = body.isActive;
      if (!body.isActive) update.assignedUntil = new Date();
      else update.assignedUntil = null;
    }

    const [updated] = await db.update(driverVehicles).set(update as Record<string, unknown>).where(eq(driverVehicles.id, params.id)).returning();
    let make = null;
    let model = null;
    if (updated!.makeId) {
      [make] = await db.select({ name: vehicleMakes.name }).from(vehicleMakes).where(eq(vehicleMakes.id, updated!.makeId)).limit(1);
    }
    if (updated!.modelId) {
      [model] = await db.select({ name: vehicleModels.name }).from(vehicleModels).where(eq(vehicleModels.id, updated!.modelId)).limit(1);
    }

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

    const parts = ownerRow ? [ownerRow.surname, ownerRow.givenName, ownerRow.patronymic].filter(Boolean) : [];
    const driverName = parts.length ? parts.join(' ') : null;
    const owner = ownerRow
      ? { id: ownerRow.userId, name: ownerRow.userName ?? '', email: ownerRow.userEmail ?? '', driverName }
      : null;

    return toVehicleResponse(updated!, make, model, owner);
  }, { body: patchBody })
  // POST /:id/activate — активировать
  .post('/:id/activate', async ({ params, set }) => {
    const [updated] = await db
      .update(driverVehicles)
      .set({ isActive: true, assignedUntil: null })
      .where(eq(driverVehicles.id, params.id))
      .returning();
    if (!updated) {
      set.status = 404;
      return { error: 'Vehicle not found' };
    }
    return { success: true };
  })
  // POST /:id/deactivate — деактивировать
  .post('/:id/deactivate', async ({ params, set }) => {
    const [updated] = await db
      .update(driverVehicles)
      .set({ isActive: false, assignedUntil: new Date() })
      .where(eq(driverVehicles.id, params.id))
      .returning();
    if (!updated) {
      set.status = 404;
      return { error: 'Vehicle not found' };
    }
    return { success: true };
  });
