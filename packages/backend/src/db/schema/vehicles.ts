import { pgTable, text, timestamp, uuid, varchar, integer, decimal, boolean } from 'drizzle-orm/pg-core';
import { carrierProfiles } from './carriers';
import { vehicleMakes, vehicleModels } from './vehicle-catalog';
import { vehicleOwnershipEnum } from './enums';

// ТС водителя с жизненным циклом (для snapshot в рейсах).
export const driverVehicles = pgTable('driver_vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),

  plateNumber: text('plate_number').notNull(),
  vehicleType: text('vehicle_type'),
  brand: text('brand'),
  model: text('model'),
  year: text('year'),
  ownership: vehicleOwnershipEnum('ownership'),

  vin: varchar('vin', { length: 17 }),
  chassisNumber: text('chassis_number'),
  chassisType: text('chassis_type'),
  axleConfig: text('axle_config'),
  color: text('color'),
  capacityTons: decimal('capacity_tons', { precision: 6, scale: 2 }),
  hasGps: boolean('has_gps').default(false),
  insurancePolicyNum: text('insurance_policy_num'),
  insuranceExpiresAt: timestamp('insurance_expires_at'),
  makeId: uuid('make_id').references(() => vehicleMakes.id),
  modelId: uuid('model_id').references(() => vehicleModels.id),
  customMake: text('custom_make'),
  customModel: text('custom_model'),
  fuelType: text('fuel_type').$type<'diesel' | 'lpg' | 'lng' | 'electric' | 'hybrid'>(),
  engineVolumeL: decimal('engine_volume_l', { precision: 4, scale: 1 }),
  powerHp: integer('power_hp'),
  fuelTank1L: integer('fuel_tank_1_l'),
  fuelTank2L: integer('fuel_tank_2_l'),
  transmission: text('transmission').$type<'manual' | 'automatic' | 'robotized'>(),
  euroClass: text('euro_class').$type<'euro3' | 'euro4' | 'euro5' | 'euro6'>(),
  fuelConsumptionPer100km: decimal('fuel_consumption_per_100km', { precision: 5, scale: 1 }),
  fifthWheelCapacityKg: integer('fifth_wheel_capacity_kg'),
  maxGrossWeightT: decimal('max_gross_weight_t', { precision: 6, scale: 2 }),

  assignedFrom: timestamp('assigned_from').defaultNow(),
  assignedUntil: timestamp('assigned_until'),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
});

// Транспортные средства для заказов/услуг (старая таблица).
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .references(() => carrierProfiles.id)
    .notNull(),
  type: text('type').notNull(),
  capacity: decimal('capacity', { precision: 10, scale: 2 }).notNull(),
  volume: decimal('volume', { precision: 10, scale: 2 }).notNull(),
  plateNumber: varchar('plate_number', { length: 20 }).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  currentLat: decimal('current_lat', { precision: 10, scale: 7 }),
  currentLng: decimal('current_lng', { precision: 10, scale: 7 }),
});

export const driverTrailers = pgTable('driver_trailers', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  carrierId:            uuid('carrier_id').notNull().references(() => carrierProfiles.id, { onDelete: 'cascade' }),

  vin:                  varchar('vin', { length: 17 }),
  trailerType:          text('trailer_type').$type<'semi' | 'drawbar'>().notNull().default('semi'),
  bodyType:             text('body_type').notNull(),
  plateNumber:          text('plate_number').notNull(),
  color:                text('color').notNull(),

  makeId:               uuid('make_id').references(() => vehicleMakes.id),
  modelId:              uuid('model_id').references(() => vehicleModels.id),
  customMake:           text('custom_make'),
  customModel:          text('custom_model'),

  year:                 integer('year'),
  chassisNumber:        text('chassis_number'),
  capacityTons:         decimal('capacity_tons', { precision: 6, scale: 2 }).notNull(),
  volumeM3:             decimal('volume_m3', { precision: 7, scale: 2 }),
  axleCount:            integer('axle_count'),
  palletPlaces:         integer('pallet_places'),

  adrClasses:           text('adr_classes').array().notNull().default([]),

  tempMinC:             integer('temp_min_c'),
  tempMaxC:             integer('temp_max_c'),

  hasGps:               boolean('has_gps').default(false),
  insurancePolicyNum:   text('insurance_policy_num'),
  insuranceExpiresAt:   timestamp('insurance_expires_at'),

  refFuelType:          text('ref_fuel_type').$type<'diesel' | 'lpg' | 'lng' | 'electric'>(),
  refFuelTankL:         integer('ref_fuel_tank_l'),
  refTransmission:      text('ref_transmission').$type<'manual' | 'automatic' | 'robotized'>(),
  refFuelConsumptionPh: decimal('ref_fuel_consumption_ph', { precision: 5, scale: 1 }),

  ownership:            vehicleOwnershipEnum('ownership'),

  isActive:             boolean('is_active').default(true).notNull(),
  createdAt:            timestamp('created_at').defaultNow().notNull(),
  updatedAt:            timestamp('updated_at').defaultNow().notNull(),
});

export const vehicleCouplings = pgTable('vehicle_couplings', {
  id:           uuid('id').primaryKey().defaultRandom(),
  carrierId:    uuid('carrier_id').notNull().references(() => carrierProfiles.id, { onDelete: 'cascade' }),
  tractorId:    uuid('tractor_id').notNull().references(() => driverVehicles.id),
  trailerId:    uuid('trailer_id').notNull().references(() => driverTrailers.id),
  coupledAt:    timestamp('coupled_at').defaultNow().notNull(),
  decoupledAt:  timestamp('decoupled_at'),
  notes:        text('notes'),
  isActive:     boolean('is_active').default(true).notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});
