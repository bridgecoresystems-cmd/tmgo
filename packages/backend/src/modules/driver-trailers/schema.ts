import { t } from 'elysia';
import { trailerBodyTypeIds } from '@tmgo/shared';

const trailerBodyUnion = t.Union(trailerBodyTypeIds.map((id) => t.Literal(id)) as [typeof t.Literal, ...typeof t.Literal[]]);

export const createTrailerBody = t.Object({
  vin: t.Optional(t.String({ minLength: 17, maxLength: 17 })),
  trailerType: t.Union([t.Literal('semi'), t.Literal('drawbar')]),
  bodyType: trailerBodyUnion,
  plateNumber: t.String({ minLength: 2, maxLength: 20 }),
  color: t.String({ minLength: 1 }),
  makeId: t.Optional(t.String()),
  modelId: t.Optional(t.String()),
  customMake: t.Optional(t.String()),
  customModel: t.Optional(t.String()),
  year: t.Optional(t.Number({ minimum: 1950, maximum: new Date().getFullYear() + 1 })),
  chassisNumber: t.Optional(t.String()),
  capacityTons: t.Number({ minimum: 0.1, maximum: 200 }),
  volumeM3: t.Optional(t.Number({ minimum: 0 })),
  axleCount: t.Optional(t.Number({ minimum: 1, maximum: 10 })),
  palletPlaces: t.Optional(t.Number({ minimum: 0 })),
  adrClasses: t.Optional(t.Array(t.String())),
  tempMinC: t.Optional(t.Number({ minimum: -40, maximum: 30 })),
  tempMaxC: t.Optional(t.Number({ minimum: -40, maximum: 30 })),
  hasGps: t.Optional(t.Boolean()),
  insurancePolicyNum: t.Optional(t.String()),
  insuranceExpiresAt: t.Optional(t.String()),
  refFuelType: t.Optional(t.String()),
  refFuelTankL: t.Optional(t.Number()),
  refTransmission: t.Optional(t.String()),
  refFuelConsumptionPh: t.Optional(t.Number()),
  ownership: t.Optional(t.Union([t.Literal('own'), t.Literal('company'), t.Literal('leased')])),
});

export const patchTrailerBody = t.Object({
  vin: t.Optional(t.String({ minLength: 17, maxLength: 17 })),
  trailerType: t.Optional(t.Union([t.Literal('semi'), t.Literal('drawbar')])),
  bodyType: t.Optional(trailerBodyUnion),
  plateNumber: t.Optional(t.String({ minLength: 2, maxLength: 20 })),
  color: t.Optional(t.String({ minLength: 1 })),
  makeId: t.Optional(t.Nullable(t.String())),
  modelId: t.Optional(t.Nullable(t.String())),
  customMake: t.Optional(t.Nullable(t.String())),
  customModel: t.Optional(t.Nullable(t.String())),
  year: t.Optional(t.Nullable(t.Number())),
  chassisNumber: t.Optional(t.Nullable(t.String())),
  capacityTons: t.Optional(t.Number({ minimum: 0.1, maximum: 200 })),
  volumeM3: t.Optional(t.Nullable(t.Number())),
  axleCount: t.Optional(t.Nullable(t.Number())),
  palletPlaces: t.Optional(t.Nullable(t.Number())),
  adrClasses: t.Optional(t.Array(t.String())),
  tempMinC: t.Optional(t.Nullable(t.Number())),
  tempMaxC: t.Optional(t.Nullable(t.Number())),
  hasGps: t.Optional(t.Boolean()),
  insurancePolicyNum: t.Optional(t.Nullable(t.String())),
  insuranceExpiresAt: t.Optional(t.Nullable(t.String())),
  refFuelType: t.Optional(t.Nullable(t.String())),
  refFuelTankL: t.Optional(t.Nullable(t.Number())),
  refTransmission: t.Optional(t.Nullable(t.String())),
  refFuelConsumptionPh: t.Optional(t.Nullable(t.Number())),
  ownership: t.Optional(t.Union([t.Literal('own'), t.Literal('company'), t.Literal('leased')])),
});

export const createCouplingBody = t.Object({
  tractorId: t.String(),
  trailerId: t.String(),
  notes: t.Optional(t.String()),
});
