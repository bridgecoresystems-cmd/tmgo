import { pgTable, text, uuid, varchar, boolean } from 'drizzle-orm/pg-core';

export const vehicleMakes = pgTable('vehicle_makes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  countryCode: varchar('country_code', { length: 2 }),
  isCustom: boolean('is_custom').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const vehicleModels = pgTable('vehicle_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  makeId: uuid('make_id')
    .notNull()
    .references(() => vehicleMakes.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  compatibleTypes: text('compatible_types').array().notNull().default([]),
  isCustom: boolean('is_custom').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});
