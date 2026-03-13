import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  serial,
  decimal,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

// --- Better Auth required tables (plural exports, singular SQL names — как в language-school) ---

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  phone: text('phone'),
  role: text('role')
    .$type<'client' | 'driver' | 'dispatcher' | 'admin'>()
    .notNull()
    .default('client'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verifications = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// --- Cities ---

export const cities = pgTable('cities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  nameRu: varchar('name_ru', { length: 255 }),
  type: text('type').$type<'FROM' | 'TO' | 'BOTH'>().default('BOTH').notNull(),
  country: varchar('country', { length: 100 }).notNull().default('TM'),
  region: varchar('region', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// --- Профили перевозчиков ---

export const carrierProfiles = pgTable('carrier_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  // 1. Основная информация
  surname: text('surname'),
  givenName: text('given_name'),
  patronymic: text('patronymic'),
  dateOfBirth: timestamp('date_of_birth', { withTimezone: true, mode: 'date' }),
  citizenship: varchar('citizenship', { length: 100 }),
  gender: varchar('gender', { length: 20 }), // male, female
  status: varchar('status', { length: 30 }), // active, inactive, on_leave, fired
  employmentCategory: varchar('employment_category', { length: 50 }), // full_time, freelance, leased
  // Остальные поля
  companyName: text('company_name'),
  licenseNumber: varchar('license_number', { length: 100 }),
  licenseExpiry: timestamp('license_expiry', { withTimezone: true, mode: 'date' }),
  // 3. Водительское удостоверение
  licenseCategories: varchar('license_categories', { length: 50 }), // B, C, D, E
  licenseIssueDate: timestamp('license_issue_date', { withTimezone: true, mode: 'date' }),
  licenseIssuedBy: text('license_issued_by'),
  licenseScanUrl: text('license_scan_url'),
  hasInternationalLicense: boolean('has_international_license'),
  internationalLicenseNumber: varchar('international_license_number', { length: 50 }),
  internationalLicenseValidity: varchar('international_license_validity', { length: 30 }), // 2022-2027
  lastMedicalExaminationDate: timestamp('last_medical_examination_date', { withTimezone: true, mode: 'date' }),
  hireSource: varchar('hire_source', { length: 50 }), // recommendation, advertisement, agency
  attachedDocuments: text('attached_documents'), // JSON or comma-separated
  phone: text('phone'),
  additionalEmails: text('additional_emails'),
  inn: varchar('inn', { length: 50 }),
  address: text('address'),
  // 2. Паспортные данные
  passportSeries: varchar('passport_series', { length: 20 }),
  passportNumber: varchar('passport_number', { length: 50 }),
  passportIssueDate: timestamp('passport_issue_date', { withTimezone: true, mode: 'date' }),
  passportExpiryDate: timestamp('passport_expiry_date', { withTimezone: true, mode: 'date' }),
  passportIssuedBy: text('passport_issued_by'),
  placeOfBirth: varchar('place_of_birth', { length: 255 }),
  residentialAddress: text('residential_address'),
  passportScanUrl: text('passport_scan_url'),
  // 4. Разрешительные документы
  permissionEntryZone: text('permission_entry_zone'), // Разрешение на въезд в зону/страну
  permissionIssueDate: timestamp('permission_issue_date', { withTimezone: true, mode: 'date' }),
  permissionValidityDate: timestamp('permission_validity_date', { withTimezone: true, mode: 'date' }),
  medicalCertificate: text('medical_certificate'), // Nº MC-2025-0123, действует до...
  medicalCertificateScanUrl: text('medical_certificate_scan_url'),
  technicalMinimumCertificate: varchar('technical_minimum_certificate', { length: 100 }), // Nº TM-2025-0098
  tachographCardNumber: varchar('tachograph_card_number', { length: 50 }), // Nº TK-567890
  otherPermits: text('other_permits'), // Страховка, пропуск, допуск ADR и т.д.
  bankName: text('bank_name'),
  bankAccount: varchar('bank_account', { length: 100 }),
  bankBik: varchar('bank_bik', { length: 20 }),
  isVerified: boolean('is_verified').default(false).notNull(),
  verificationStatus: varchar('verification_status', { length: 30 })
    .$type<'not_verified' | 'waiting_verification' | 'verified'>()
    .default('not_verified')
    .notNull(),
  // TODO: использовать для меток «отредактировано» — поля, изменённые админом
  adminEditedFields: jsonb('admin_edited_fields').$type<string[]>().default([]),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Транспортные средства ---

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

// --- Заказы ---

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: text('client_id')
    .references(() => users.id)
    .notNull(),
  carrierId: uuid('carrier_id').references(() => carrierProfiles.id),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id),
  status: text('status')
    .$type<'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'>()
    .default('PENDING')
    .notNull(),
  fromCityId: uuid('from_city_id').references(() => cities.id),
  toCityId: uuid('to_city_id').references(() => cities.id),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  pickupDate: timestamp('pickup_date').notNull(),
  deliveryDate: timestamp('delivery_date'),
  cargoType: text('cargo_type').notNull(),
  cargoName: text('cargo_name'),
  cargoDescription: text('cargo_description'),
  weight: decimal('weight', { precision: 10, scale: 2 }).notNull(),
  volume: decimal('volume', { precision: 10, scale: 2 }),
  temperatureRequired: text('temperature_required'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  paymentMethod: text('payment_method'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Отклики перевозчиков на заказ (водитель нажал «Взять» — создаётся отклик, клиент принимает/отклоняет) ---

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

// --- Услуги перевозчика (driver предлагает маршрут) ---

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

// --- Рассылки (Admin → все пользователи) ---

export const mailingMessages = pgTable('mailing_message', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  recipientType: text('recipient_type').notNull().default('all'), // all, client, driver
  createdById: text('created_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true, mode: 'date' }),
  sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
  isSent: boolean('is_sent').default(false).notNull(),
  totalRecipients: integer('total_recipients').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mailingRecipients = pgTable('mailing_recipient', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id')
    .notNull()
    .references(() => mailingMessages.id, { onDelete: 'cascade' }),
  recipientId: text('recipient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at', { withTimezone: true, mode: 'date' }),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
});

// --- Чат по заказу ---

export const orderMessages = pgTable('order_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .references(() => orders.id)
    .notNull(),
  senderId: text('sender_id')
    .references(() => users.id)
    .notNull(),
  message: text('message').notNull(),
  attachments: jsonb('attachments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
