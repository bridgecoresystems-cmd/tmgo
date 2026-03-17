import {
  pgTable,
  pgEnum,
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

// --- Better Auth required tables ---

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

// ─── ENUMS (новые) ───

export const verificationStatusEnum = pgEnum('verification_status', [
  'not_submitted',   // Ещё не заполнял карточку
  'draft',           // Заполняет, ещё не отправил
  'submitted',       // Отправил на верификацию, ждёт
  'verified',        // Верифицирован, может работать
  'rejected',        // Отклонён с комментарием
  'suspended',       // Временно приостановлен
]);

export const docTypeEnum = pgEnum('doc_type', [
  'passport',
  'drivers_license',
  'international_drivers_license',
  'visa',
  'medical_certificate',
  'insurance',
  'tachograph_card',
  'technical_minimum_cert',
  'entry_permit',
  'adr_certificate',
  'other',
]);

export const docStatusEnum = pgEnum('doc_status', [
  'pending_verification',
  'active',
  'expired',
  'revoked',
  'superseded',
  'rejected',
]);

export const citizenshipStatusEnum = pgEnum('citizenship_status', [
  'active',
  'revoked',
]);

export const contactTypeEnum = pgEnum('contact_type', [
  'phone',
  'email',
]);

export const vehicleOwnershipEnum = pgEnum('vehicle_ownership', [
  'own',
  'company',
  'leased',
]);

export const changeRequestStatusEnum = pgEnum('change_request_status', [
  'pending',
  'approved',
  'rejected',
  'applied',
  'cancelled',
]);

// --- Профили перевозчиков (рефакторинг) ---

export const carrierProfiles = pgTable('carrier_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  // ─── IDENTITY FIELDS ───
  surname: text('surname'),
  givenName: text('given_name'),
  patronymic: text('patronymic'),
  dateOfBirth: timestamp('date_of_birth', { withTimezone: true, mode: 'date' }),
  gender: varchar('gender', { length: 20 }), // male, female

  // ─── OPERATIONAL (admin/dispatcher only) ───
  accountStatus: text('account_status').default('active'),
  // 'active' | 'inactive' | 'on_leave' | 'fired'
  employmentCategory: varchar('employment_category', { length: 50 }),
  // 'full_time' | 'freelance' | 'leased'
  isOnline: boolean('is_online').default(false),
  isOnlineAvailability: boolean('is_online_availability').default(false),

  // ─── COMPANY INFO (admin only) ───
  companyName: text('company_name'),
  inn: varchar('inn', { length: 50 }),
  companyAddress: text('company_address'),
  warehouseBranch: text('warehouse_branch'),
  responsibleLogistician: text('responsible_logistician'),

  // ─── MISC ───
  hireSource: varchar('hire_source', { length: 50 }),
  recruitmentNotes: text('recruitment_notes'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),

  // ─── VERIFICATION (новый статус) ───
  verificationStatus: verificationStatusEnum('verification_status').default('not_submitted'),
  verificationComment: text('verification_comment'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: text('verified_by'),      // FK → admin user id
  submittedAt: timestamp('submitted_at'),

  // ─── LEGACY FIELDS (оставляем до завершения миграции) ───
  // После запуска migrate-profiles.ts и проверки — удалить
  citizenship: varchar('citizenship', { length: 100 }),
  status: varchar('status', { length: 30 }),
  phone: text('phone'),
  additionalEmails: text('additional_emails'),
  address: text('address'),
  licenseNumber: varchar('license_number', { length: 100 }),
  licenseExpiry: timestamp('license_expiry', { withTimezone: true, mode: 'date' }),
  licenseCategories: varchar('license_categories', { length: 50 }),
  licenseIssueDate: timestamp('license_issue_date', { withTimezone: true, mode: 'date' }),
  licenseIssuedBy: text('license_issued_by'),
  licenseScanUrl: text('license_scan_url'),
  hasInternationalLicense: boolean('has_international_license'),
  internationalLicenseNumber: varchar('international_license_number', { length: 50 }),
  internationalLicenseValidity: varchar('international_license_validity', { length: 30 }),
  lastMedicalExaminationDate: timestamp('last_medical_examination_date', { withTimezone: true, mode: 'date' }),
  attachedDocuments: text('attached_documents'),
  passportSeries: varchar('passport_series', { length: 20 }),
  passportNumber: varchar('passport_number', { length: 50 }),
  passportIssueDate: timestamp('passport_issue_date', { withTimezone: true, mode: 'date' }),
  passportExpiryDate: timestamp('passport_expiry_date', { withTimezone: true, mode: 'date' }),
  passportIssuedBy: text('passport_issued_by'),
  placeOfBirth: varchar('place_of_birth', { length: 255 }),
  residentialAddress: text('residential_address'),
  passportScanUrl: text('passport_scan_url'),
  passportIsActive: boolean('passport_is_active').default(true).notNull(),
  extraPassports: jsonb('extra_passports').$type<Array<{
    passport_series?: string;
    passport_number?: string;
    passport_issue_date?: string;
    passport_expiry_date?: string;
    passport_issued_by?: string;
    place_of_birth?: string;
    residential_address?: string;
    passport_scan_url?: string;
    is_active?: boolean;
  }>>().default([]),
  permissionEntryZone: text('permission_entry_zone'),
  permissionIssueDate: timestamp('permission_issue_date', { withTimezone: true, mode: 'date' }),
  permissionValidityDate: timestamp('permission_validity_date', { withTimezone: true, mode: 'date' }),
  medicalCertificate: text('medical_certificate'),
  medicalCertificateScanUrl: text('medical_certificate_scan_url'),
  technicalMinimumCertificate: varchar('technical_minimum_certificate', { length: 100 }),
  tachographCardNumber: varchar('tachograph_card_number', { length: 50 }),
  otherPermits: text('other_permits'),
  bankName: text('bank_name'),
  bankAccount: varchar('bank_account', { length: 100 }),
  bankBik: varchar('bank_bik', { length: 20 }),

  // ─── LEGACY VERIFICATION FIELDS ───
  isVerified: boolean('is_verified').default(false).notNull(),
  adminEditedFields: jsonb('admin_edited_fields').$type<string[]>().default([]),
  unlockedFields: jsonb('unlocked_fields').$type<string[]>().default([]),

  // Скрытые поля в карточке (main:driver_id, passport:0, license:0, visa:0, medical:0, tech_min:0, tachograph:0, adr:0)
  hiddenFields: jsonb('hidden_fields').$type<string[]>().default([]),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Документы водителя (НОВАЯ — центральная таблица) ---

export const driverDocuments = pgTable('driver_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),

  docType: docTypeEnum('doc_type').notNull(),
  country: text('country'),
  series: text('series'),
  number: text('number'),
  issuedBy: text('issued_by'),
  issuedAt: timestamp('issued_at'),
  expiresAt: timestamp('expires_at'),

  // Для паспортов
  placeOfBirth: text('place_of_birth'),
  residentialAddress: text('residential_address'),

  // Для ВУ
  licenseCategories: text('license_categories'), // 'B,C,D,E'

  // Для разрешений
  permissionZone: text('permission_zone'),

  // Для всех
  notes: text('notes'),
  scanUrl: text('scan_url'),

  // ─── ЖИЗНЕННЫЙ ЦИКЛ ───
  status: docStatusEnum('status').default('pending_verification'),
  validFrom: timestamp('valid_from').defaultNow(),
  validUntil: timestamp('valid_until'),
  supersededById: uuid('superseded_by_id'), // Ссылка на новую версию
  rejectionReason: text('rejection_reason'),

  // ─── ВЕРИФИКАЦИЯ ДОКУМЕНТА ───
  verifiedAt: timestamp('verified_at'),
  verifiedBy: text('verified_by'), // FK → admin user id

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// --- Гражданства водителя (НОВАЯ) ---

export const driverCitizenships = pgTable('driver_citizenships', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),

  country: text('country').notNull(),
  acquiredAt: timestamp('acquired_at'),
  revokedAt: timestamp('revoked_at'),
  scanUrl: text('scan_url'),
  status: citizenshipStatusEnum('status').default('active'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: text('verified_by'),

  createdAt: timestamp('created_at').defaultNow(),
});

// --- Дополнительные контакты водителя (НОВАЯ) ---

export const driverContacts = pgTable('driver_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),

  contactType: contactTypeEnum('contact_type').notNull(),
  value: text('value').notNull(),
  label: text('label'), // 'Рабочий', 'WhatsApp', 'Экстренный'
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft delete
});

// --- ТС водителя с жизненным циклом (НОВАЯ — для snapshot в рейсах) ---

export const driverVehicles = pgTable('driver_vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),

  plateNumber: text('plate_number').notNull(),
  vehicleType: text('vehicle_type'), // Тент, реф, изотерм...
  brand: text('brand'),
  model: text('model'),
  year: text('year'),
  ownership: vehicleOwnershipEnum('ownership'),

  // ─── ЖИЗНЕННЫЙ ЦИКЛ ───
  assignedFrom: timestamp('assigned_from').defaultNow(),
  assignedUntil: timestamp('assigned_until'),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
});

// --- История верификаций профиля (НОВАЯ — лог) ---

export const profileVerificationHistory = pgTable('profile_verification_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),

  action: text('action').notNull(),
  // 'submitted' | 'verified' | 'rejected' | 'suspended' | 'resubmitted' | 'restored'

  previousStatus: text('previous_status'),
  newStatus: text('new_status'),
  comment: text('comment'),
  performedBy: text('performed_by'),       // user id
  performedByRole: text('performed_by_role'), // 'driver' | 'admin' | 'system'

  profileSnapshot: jsonb('profile_snapshot'), // Snapshot данных на момент

  createdAt: timestamp('created_at').defaultNow(),
});

// --- Запросы на изменение полей (НОВАЯ — заменяет profile_edit_requests) ---

export const profileChangeRequests = pgTable('profile_change_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),

  fieldKey: text('field_key').notNull(),
  // 'surname' | 'passport:add' | 'passport:renew' | 'citizenship:add' | etc.

  currentValue: text('current_value'),
  requestedValue: text('requested_value'),
  reason: text('reason'),

  status: changeRequestStatusEnum('status').default('pending'),
  adminComment: text('admin_comment'),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at'),

  unlockedUntil: timestamp('unlocked_until'), // Поле разблокировано до (7 дней)

  requestedAt: timestamp('requested_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- Транспортные средства (для заказов/услуг, старая таблица) ---

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
  // Snapshot на момент начала рейса
  snapshotPassportId: uuid('snapshot_passport_id'),   // FK → driver_documents
  snapshotLicenseId: uuid('snapshot_license_id'),     // FK → driver_documents
  snapshotVehicleId: uuid('snapshot_vehicle_id'),     // FK → driver_vehicles
  snapshotCreatedAt: timestamp('snapshot_created_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Отклики перевозчиков на заказ ---

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

// --- Услуги перевозчика ---

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

// --- Рассылки ---

export const mailingMessages = pgTable('mailing_message', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  recipientType: text('recipient_type').notNull().default('all'),
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

// --- LEGACY: Запросы водителя на изменение полей (старая таблица, оставляем для совместимости) ---

export const profileEditRequests = pgTable('profile_edit_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),
  fieldKey: varchar('field_key', { length: 80 }).notNull(),
  status: varchar('status', { length: 20 })
    .$type<'pending' | 'approved' | 'rejected'>()
    .default('pending')
    .notNull(),
  driverComment: text('driver_comment'),
  fieldValue: text('field_value'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'date' }),
  resolvedById: text('resolved_by_id').references(() => users.id),
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
