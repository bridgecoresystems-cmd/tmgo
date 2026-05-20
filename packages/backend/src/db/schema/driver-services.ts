import { pgTable, text, timestamp, uuid, varchar, decimal, boolean } from 'drizzle-orm/pg-core';
import { carrierProfiles } from './carriers';
import { vehicles } from './vehicles';
import { cities } from './cities';

export const driverServices = pgTable('driver_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  fromCityId: uuid('from_city_id')
    .notNull()
    .references(() => cities.id),
  toCityId: uuid('to_city_id')
    .notNull()
    .references(() => cities.id),
  description: text('description'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('TMT').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
