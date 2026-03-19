import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { driverTrailers, vehicleCouplings, driverVehicles, vehicleMakes, vehicleModels, carrierProfiles } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';
import { trailerBodyTypeIds, REEFER_BODY_TYPES } from '@tmgo/shared';

const trailerBodyUnion = t.Union(trailerBodyTypeIds.map((id) => t.Literal(id)) as [typeof t.Literal, ...typeof t.Literal[]]);

const createBody = t.Object({
  vin:                  t.Optional(t.String({ minLength: 17, maxLength: 17 })),
  trailerType:          t.Union([t.Literal('semi'), t.Literal('drawbar')]),
  bodyType:             trailerBodyUnion,
  plateNumber:          t.String({ minLength: 2, maxLength: 20 }),
  color:                t.String({ minLength: 1 }),
  makeId:               t.Optional(t.String()),
  modelId:              t.Optional(t.String()),
  customMake:           t.Optional(t.String()),
  customModel:          t.Optional(t.String()),
  year:                 t.Optional(t.Number({ minimum: 1950, maximum: new Date().getFullYear() + 1 })),
  chassisNumber:        t.Optional(t.String()),
  capacityTons:         t.Number({ minimum: 0.1, maximum: 200 }),
  volumeM3:             t.Optional(t.Number({ minimum: 0 })),
  axleCount:            t.Optional(t.Number({ minimum: 1, maximum: 10 })),
  palletPlaces:         t.Optional(t.Number({ minimum: 0 })),
  adrClasses:           t.Optional(t.Array(t.String())),
  tempMinC:             t.Optional(t.Number({ minimum: -40, maximum: 30 })),
  tempMaxC:             t.Optional(t.Number({ minimum: -40, maximum: 30 })),
  hasGps:               t.Optional(t.Boolean()),
  insurancePolicyNum:   t.Optional(t.String()),
  insuranceExpiresAt:   t.Optional(t.String()),
  refFuelType:          t.Optional(t.String()),
  refFuelTankL:         t.Optional(t.Number()),
  refTransmission:      t.Optional(t.String()),
  refFuelConsumptionPh: t.Optional(t.Number()),
  ownership:            t.Optional(t.Union([t.Literal('own'), t.Literal('company'), t.Literal('leased')])),
});

const patchBody = t.Object({
  vin:                  t.Optional(t.String({ minLength: 17, maxLength: 17 })),
  trailerType:          t.Optional(t.Union([t.Literal('semi'), t.Literal('drawbar')])),
  bodyType:             t.Optional(trailerBodyUnion),
  plateNumber:          t.Optional(t.String({ minLength: 2, maxLength: 20 })),
  color:                t.Optional(t.String({ minLength: 1 })),
  makeId:               t.Optional(t.Nullable(t.String())),
  modelId:              t.Optional(t.Nullable(t.String())),
  customMake:           t.Optional(t.Nullable(t.String())),
  customModel:          t.Optional(t.Nullable(t.String())),
  year:                 t.Optional(t.Nullable(t.Number())),
  chassisNumber:        t.Optional(t.Nullable(t.String())),
  capacityTons:         t.Optional(t.Number({ minimum: 0.1, maximum: 200 })),
  volumeM3:             t.Optional(t.Nullable(t.Number())),
  axleCount:            t.Optional(t.Nullable(t.Number())),
  palletPlaces:         t.Optional(t.Nullable(t.Number())),
  adrClasses:           t.Optional(t.Array(t.String())),
  tempMinC:             t.Optional(t.Nullable(t.Number())),
  tempMaxC:             t.Optional(t.Nullable(t.Number())),
  hasGps:               t.Optional(t.Boolean()),
  insurancePolicyNum:   t.Optional(t.Nullable(t.String())),
  insuranceExpiresAt:   t.Optional(t.Nullable(t.String())),
  refFuelType:          t.Optional(t.Nullable(t.String())),
  refFuelTankL:         t.Optional(t.Nullable(t.Number())),
  refTransmission:      t.Optional(t.Nullable(t.String())),
  refFuelConsumptionPh: t.Optional(t.Nullable(t.Number())),
  ownership:            t.Optional(t.Union([t.Literal('own'), t.Literal('company'), t.Literal('leased')])),
});

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

// ── Derive helper ──────────────────────────────────────────────────

const withDriver = async ({ request, set }: { request: Request; set: { status: number } }) => {
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
};

// ── Trailer routes ─────────────────────────────────────────────────

export const cabinetDriverTrailersRoutes = new Elysia({ prefix: '/cabinet/driver/trailers' })
  .derive(withDriver)

  // GET / — список прицепов
  .get('/', async ({ carrierProfile }) => {
    const list = await db.select().from(driverTrailers)
      .where(and(eq(driverTrailers.carrierId, carrierProfile.id), eq(driverTrailers.isActive, true)));
    const result = [];
    for (const v of list) {
      const { make, model } = await resolveMakeModel(v.makeId, v.modelId);
      result.push(toTrailerResponse(v, make, model));
    }
    return result;
  })

  // POST / — создать прицеп
  .post('/', async ({ carrierProfile, body, set }) => {
    // Серверная валидация рефки
    if (REEFER_BODY_TYPES.includes(body.bodyType as any)) {
      if (!body.refFuelType || !body.refFuelTankL || !body.refTransmission || !body.refFuelConsumptionPh) {
        set.status = 422;
        return { error: 'Для рефрижераторного прицепа обязательно заполните параметры холодильного агрегата' };
      }
    }
    const [created] = await db.insert(driverTrailers).values({
      carrierId: carrierProfile.id,
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
      refFuelType: body.refFuelType as any ?? null,
      refFuelTankL: body.refFuelTankL ?? null,
      refTransmission: body.refTransmission as any ?? null,
      refFuelConsumptionPh: body.refFuelConsumptionPh != null ? String(body.refFuelConsumptionPh) : null,
      ownership: body.ownership ?? null,
    }).returning();
    const { make, model } = await resolveMakeModel(created!.makeId, created!.modelId);
    return toTrailerResponse(created!, make, model);
  }, { body: createBody })

  // GET /:id — карточка
  .get('/:id', async ({ carrierProfile, params, set }) => {
    const [v] = await db.select().from(driverTrailers)
      .where(and(eq(driverTrailers.id, params.id), eq(driverTrailers.carrierId, carrierProfile.id)))
      .limit(1);
    if (!v) { set.status = 404; return { error: 'Прицеп не найден' }; }
    const { make, model } = await resolveMakeModel(v.makeId, v.modelId);
    return toTrailerResponse(v, make, model);
  })

  // PATCH /:id — обновить
  .patch('/:id', async ({ carrierProfile, params, body, set }) => {
    const [v] = await db.select().from(driverTrailers)
      .where(and(eq(driverTrailers.id, params.id), eq(driverTrailers.carrierId, carrierProfile.id)))
      .limit(1);
    if (!v) { set.status = 404; return { error: 'Прицеп не найден' }; }

    const newBodyType = body.bodyType ?? v.bodyType;
    if (REEFER_BODY_TYPES.includes(newBodyType as any)) {
      const refFuel = body.refFuelType ?? v.refFuelType;
      const refTank = body.refFuelTankL ?? v.refFuelTankL;
      const refTrans = body.refTransmission ?? v.refTransmission;
      const refCons = body.refFuelConsumptionPh ?? (v.refFuelConsumptionPh ? Number(v.refFuelConsumptionPh) : null);
      if (!refFuel || !refTank || !refTrans || !refCons) {
        set.status = 422;
        return { error: 'Для рефрижераторного прицепа обязательно заполните параметры холодильного агрегата' };
      }
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.vin !== undefined) update.vin = body.vin;
    if (body.trailerType !== undefined) update.trailerType = body.trailerType;
    if (body.bodyType !== undefined) update.bodyType = body.bodyType;
    if (body.plateNumber !== undefined) update.plateNumber = body.plateNumber;
    if (body.color !== undefined) update.color = body.color;
    if (body.makeId !== undefined) update.makeId = body.makeId;
    if (body.modelId !== undefined) update.modelId = body.modelId;
    if (body.customMake !== undefined) update.customMake = body.customMake;
    if (body.customModel !== undefined) update.customModel = body.customModel;
    if (body.year !== undefined) update.year = body.year;
    if (body.chassisNumber !== undefined) update.chassisNumber = body.chassisNumber;
    if (body.capacityTons !== undefined) update.capacityTons = String(body.capacityTons);
    if (body.volumeM3 !== undefined) update.volumeM3 = body.volumeM3 != null ? String(body.volumeM3) : null;
    if (body.axleCount !== undefined) update.axleCount = body.axleCount;
    if (body.palletPlaces !== undefined) update.palletPlaces = body.palletPlaces;
    if (body.adrClasses !== undefined) update.adrClasses = body.adrClasses;
    if (body.tempMinC !== undefined) update.tempMinC = body.tempMinC;
    if (body.tempMaxC !== undefined) update.tempMaxC = body.tempMaxC;
    if (body.hasGps !== undefined) update.hasGps = body.hasGps;
    if (body.insurancePolicyNum !== undefined) update.insurancePolicyNum = body.insurancePolicyNum;
    if (body.insuranceExpiresAt !== undefined) update.insuranceExpiresAt = body.insuranceExpiresAt ? new Date(body.insuranceExpiresAt) : null;
    if (body.refFuelType !== undefined) update.refFuelType = body.refFuelType;
    if (body.refFuelTankL !== undefined) update.refFuelTankL = body.refFuelTankL;
    if (body.refTransmission !== undefined) update.refTransmission = body.refTransmission;
    if (body.refFuelConsumptionPh !== undefined) update.refFuelConsumptionPh = body.refFuelConsumptionPh != null ? String(body.refFuelConsumptionPh) : null;
    if (body.ownership !== undefined) update.ownership = body.ownership;

    const [updated] = await db.update(driverTrailers).set(update).where(eq(driverTrailers.id, params.id)).returning();
    const { make, model } = await resolveMakeModel(updated!.makeId, updated!.modelId);
    return toTrailerResponse(updated!, make, model);
  }, { body: patchBody })

  // DELETE /:id — soft delete + завершить активную сцепку
  .delete('/:id', async ({ carrierProfile, params, set }) => {
    const [v] = await db.select().from(driverTrailers)
      .where(and(eq(driverTrailers.id, params.id), eq(driverTrailers.carrierId, carrierProfile.id)))
      .limit(1);
    if (!v) { set.status = 404; return { error: 'Прицеп не найден' }; }

    // Завершаем активную сцепку если есть
    await db.update(vehicleCouplings).set({ isActive: false, decoupledAt: new Date() })
      .where(and(eq(vehicleCouplings.trailerId, params.id), eq(vehicleCouplings.isActive, true)));

    await db.update(driverTrailers).set({ isActive: false, updatedAt: new Date() })
      .where(eq(driverTrailers.id, params.id));
    return { success: true };
  });

// ── Coupling routes ────────────────────────────────────────────────

export const cabinetDriverCouplingsRoutes = new Elysia({ prefix: '/cabinet/driver/couplings' })
  .derive(withDriver)

  // GET / — активные сцепки
  .get('/', async ({ carrierProfile }) => {
    const couplings = await db.select().from(vehicleCouplings)
      .where(and(eq(vehicleCouplings.carrierId, carrierProfile.id), eq(vehicleCouplings.isActive, true)));

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
  })

  // POST / — создать сцепку
  .post('/', async ({ carrierProfile, body, set }) => {
    // Проверяем принадлежность тягача и прицепа
    const [tractor] = await db.select({ id: driverVehicles.id })
      .from(driverVehicles)
      .where(and(eq(driverVehicles.id, body.tractorId), eq(driverVehicles.carrierId, carrierProfile.id), eq(driverVehicles.isActive, true)))
      .limit(1);
    if (!tractor) { set.status = 404; return { error: 'Тягач не найден' }; }

    const [trailer] = await db.select({ id: driverTrailers.id })
      .from(driverTrailers)
      .where(and(eq(driverTrailers.id, body.trailerId), eq(driverTrailers.carrierId, carrierProfile.id), eq(driverTrailers.isActive, true)))
      .limit(1);
    if (!trailer) { set.status = 404; return { error: 'Прицеп не найден' }; }

    // Проверяем активные сцепки
    const [tractorBusy] = await db.select({ id: vehicleCouplings.id })
      .from(vehicleCouplings)
      .where(and(eq(vehicleCouplings.tractorId, body.tractorId), eq(vehicleCouplings.isActive, true)))
      .limit(1);
    if (tractorBusy) { set.status = 409; return { error: 'Тягач уже прицеплен к другому прицепу' }; }

    const [trailerBusy] = await db.select({ id: vehicleCouplings.id })
      .from(vehicleCouplings)
      .where(and(eq(vehicleCouplings.trailerId, body.trailerId), eq(vehicleCouplings.isActive, true)))
      .limit(1);
    if (trailerBusy) { set.status = 409; return { error: 'Прицеп уже прицеплен к другому тягачу' }; }

    const [created] = await db.insert(vehicleCouplings).values({
      carrierId: carrierProfile.id,
      tractorId: body.tractorId,
      trailerId: body.trailerId,
      notes: body.notes ?? null,
    }).returning();

    return { id: created!.id, coupledAt: new Date(created!.coupledAt).toISOString() };
  }, {
    body: t.Object({
      tractorId: t.String(),
      trailerId: t.String(),
      notes:     t.Optional(t.String()),
    }),
  })

  // DELETE /:id — открепить
  .delete('/:id', async ({ carrierProfile, params, set }) => {
    const [c] = await db.select().from(vehicleCouplings)
      .where(and(eq(vehicleCouplings.id, params.id), eq(vehicleCouplings.carrierId, carrierProfile.id)))
      .limit(1);
    if (!c) { set.status = 404; return { error: 'Сцепка не найдена' }; }

    await db.update(vehicleCouplings).set({ isActive: false, decoupledAt: new Date() })
      .where(eq(vehicleCouplings.id, params.id));
    return { success: true };
  });
