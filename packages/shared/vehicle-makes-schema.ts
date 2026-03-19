import { pgTable, uuid, varchar, boolean, text } from 'drizzle-orm/pg-core'
import { vehicleTypeEnum } from './schema' // твой pgEnum из vehicle-types

// ── Справочник марок ──────────────────────────────────────────────
export const vehicleMakes = pgTable('vehicle_makes', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 100 }).notNull(),
  slug:        varchar('slug', { length: 100 }).notNull().unique(),
  countryCode: varchar('country_code', { length: 2 }),   // ISO 3166-1 alpha-2
  isCustom:    boolean('is_custom').default(false).notNull(),
  isActive:    boolean('is_active').default(true).notNull(),
})

// ── Справочник моделей ────────────────────────────────────────────
export const vehicleModels = pgTable('vehicle_models', {
  id:               uuid('id').primaryKey().defaultRandom(),
  makeId:           uuid('make_id').references(() => vehicleMakes.id).notNull(),
  name:             varchar('name', { length: 100 }).notNull(),
  slug:             varchar('slug', { length: 100 }).notNull(),
  // Массив совместимых типов ТС — для каскадной фильтрации на фронте
  compatibleTypes:  text('compatible_types').array().notNull().default([]),
  isCustom:         boolean('is_custom').default(false).notNull(),
  isActive:         boolean('is_active').default(true).notNull(),
})
