import { pgTable, text, timestamp, uuid, varchar, integer, serial, decimal, boolean, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { clientProfiles } from './clients';
import { carrierProfiles } from './carriers';
import { vehicles } from './vehicles';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  seqNo: serial('seq_no'),
  clientProfileId: uuid('client_profile_id')
    .notNull()
    .references(() => clientProfiles.id),

  orderType: varchar('order_type', { length: 20 }).notNull().default('open'),

  status: varchar('status', { length: 20 }).notNull().default('draft'),

  title: varchar('title', { length: 300 }).notNull(),

  price: decimal('price', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  priceType: varchar('price_type', { length: 20 }).notNull().default('negotiable'),

  fromCountry: varchar('from_country', { length: 2 }).notNull(),
  fromRegion: varchar('from_region', { length: 100 }),
  fromCity: varchar('from_city', { length: 100 }).notNull(),

  toCountry: varchar('to_country', { length: 2 }).notNull(),
  toRegion: varchar('to_region', { length: 100 }),
  toCity: varchar('to_city', { length: 100 }).notNull(),

  readyDate: date('ready_date').notNull(),
  deadlineDate: date('deadline_date'),

  // Заполняется когда заказчик выбирает ставку — без FK constraint (circular ref).
  acceptedBidId: uuid('accepted_bid_id'),

  publishedAt: timestamp('published_at'),
  confirmedAt: timestamp('confirmed_at'),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderCargo = pgTable('order_cargo', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: 'cascade' }),

  cargoType: varchar('cargo_type', { length: 100 }).notNull(),
  weightKg: decimal('weight_kg', { precision: 10, scale: 2 }),
  volumeM3: decimal('volume_m3', { precision: 10, scale: 3 }),

  packaging: varchar('packaging', { length: 50 }),

  tempControlled: boolean('temp_controlled').default(false),
  tempMin: decimal('temp_min', { precision: 5, scale: 1 }),
  tempMax: decimal('temp_max', { precision: 5, scale: 1 }),

  notes: text('notes'),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderBids = pgTable('order_bids', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  // FK на carrier_profiles — без constraint чтобы избежать circular.
  carrierProfileId: uuid('carrier_profile_id').notNull(),

  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),

  status: varchar('status', { length: 20 }).notNull().default('pending'),

  comment: text('comment'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueCarrierBid: uniqueIndex('order_bids_unique_carrier').on(table.orderId, table.carrierProfileId),
}));

export const orderStatusLog = pgTable('order_status_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  // null = система (BullMQ); поэтому без CASCADE — обнуляется при hard delete users.
  changedBy: uuid('changed_by')
    .references(() => users.id),

  oldStatus: varchar('old_status', { length: 20 }).notNull(),
  newStatus: varchar('new_status', { length: 20 }).notNull(),
  comment: text('comment'),
  photoUrl: varchar('photo_url', { length: 500 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderResponses = pgTable('order_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  status: text('status')
    .$type<'PENDING' | 'ACCEPTED' | 'REJECTED'>()
    .default('PENDING')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
