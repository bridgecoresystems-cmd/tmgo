import { t } from 'elysia';
import { vehicleTypeIds, chassisTypeIds, axleConfigIds } from '@tmgo/shared';

const vehicleTypeUnion = t.Union(vehicleTypeIds.map((id) => t.Literal(id)) as [typeof t.Literal, ...typeof t.Literal[]]);
const chassisTypeUnion = t.Union(chassisTypeIds.map((id) => t.Literal(id)) as [typeof t.Literal, ...typeof t.Literal[]]);
const axleConfigUnion = t.Union(axleConfigIds.map((id) => t.Literal(id)) as [typeof t.Literal, ...typeof t.Literal[]]);

export const patchVehicleBody = t.Object({
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
