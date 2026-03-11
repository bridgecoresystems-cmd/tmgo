import { pgTable, text, timestamp, uuid, varchar, integer, decimal, boolean, jsonb } from 'drizzle-orm/pg-core';

// Пользователи и роли
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name'),
  role: text('role').$type<'CLIENT' | 'DRIVER' | 'DISPATCHER' | 'ADMIN'>().default('CLIENT').notNull(),
  phone: varchar('phone', { length: 50 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Профили перевозчиков (подробности ТС и доков)
export const carrierProfiles = pgTable('carrier_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  companyName: text('company_name'),
  licenseNumber: varchar('license_number', { length: 100 }),
  isVerified: boolean('is_verified').default(false).notNull(),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Транспортные средства
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').references(() => carrierProfiles.id).notNull(),
  type: text('type').notNull(), // тент, реф, изотерм и т.д.
  capacity: decimal('capacity', { precision: 10, scale: 2 }).notNull(), // грузоподъемность в тоннах
  volume: decimal('volume', { precision: 10, scale: 2 }).notNull(), // объем в м3
  plateNumber: varchar('plate_number', { length: 20 }).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  currentLat: decimal('current_lat', { precision: 10, scale: 7 }),
  currentLng: decimal('current_lng', { precision: 10, scale: 7 }),
});

// Заказы (Заявки)
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => users.id).notNull(),
  carrierId: uuid('carrier_id').references(() => carrierProfiles.id),
  status: text('status').$type<'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'>().default('PENDING').notNull(),
  
  // Маршрут
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  pickupDate: timestamp('pickup_date').notNull(),
  deliveryDate: timestamp('delivery_date'),
  
  // Характеристики груза
  cargoType: text('cargo_type').notNull(),
  weight: decimal('weight', { precision: 10, scale: 2 }).notNull(),
  volume: decimal('volume', { precision: 10, scale: 2 }),
  temperatureRequired: text('temperature_required'),
  
  // Цена и оплата
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  paymentMethod: text('payment_method'), // фикс, аукцион
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Чат по заказу
export const orderMessages = pgTable('order_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  attachments: jsonb('attachments'), // ссылки на фото/документы
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
