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
  date,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// --- Better Auth required tables ---

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('avatar_url'),
  phone: text('phone'),
  phoneVerified: boolean('phone_verified').default(false),
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
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id')
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

// --- Email verification tokens ---

export const verificationTokens = pgTable('verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: uuid('token').notNull().unique().defaultRandom(),
  type: varchar('type', { length: 20 }).notNull().default('email'),
  // type: 'email' | 'password_reset'
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
});

// --- Client profiles ---

export const clientProfiles = pgTable('client_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  clientType: varchar('client_type', { length: 20 }).notNull(),
  // 'individual' | 'company'

  countryCode: varchar('country_code', { length: 2 }).notNull(),
  // 'TM' | 'UZ' | 'KZ' | 'KG' | 'TJ' | 'IR' | 'TR' | 'AE' | 'RU' | 'BY'

  displayName: varchar('display_name', { length: 200 }),

  verificationStatus: varchar('verification_status', { length: 20 })
    .notNull()
    .default('unverified'),
  // 'unverified' | 'pending' | 'verified' | 'rejected'

  verifiedAt: timestamp('verified_at'),
  rejectionReason: text('rejection_reason'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clientIndividual = pgTable('client_individual', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .unique()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),

  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  middleName: varchar('middle_name', { length: 100 }),

  docType: varchar('doc_type', { length: 30 }),
  docNumber: varchar('doc_number', { length: 50 }),
  docFileUrl: varchar('doc_file_url', { length: 500 }),
  docVerifiedAt: timestamp('doc_verified_at'),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clientCompany = pgTable('client_company', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .unique()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),

  companyName: varchar('company_name', { length: 300 }).notNull(),
  legalForm: varchar('legal_form', { length: 50 }),
  taxId: varchar('tax_id', { length: 50 }),
  regNumber: varchar('reg_number', { length: 50 }),

  bankName: varchar('bank_name', { length: 200 }),
  bankAccount: varchar('bank_account', { length: 50 }),
  bankSwift: varchar('bank_swift', { length: 20 }),

  docFileUrl: varchar('doc_file_url', { length: 500 }),
  docVerifiedAt: timestamp('doc_verified_at'),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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

// --- Справочники марок и моделей ТС ---

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

// --- Профили перевозчиков (рефакторинг) ---

export const carrierProfiles = pgTable('carrier_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
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
  vehicleType: text('vehicle_type'),
  brand: text('brand'),
  model: text('model'),
  year: text('year'),
  ownership: vehicleOwnershipEnum('ownership'),

  // ─── Расширенные поля (тягач) ───
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

// --- Заказы (новая схема) ---

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientProfileId: uuid('client_profile_id')
    .notNull()
    .references(() => clientProfiles.id),

  orderType: varchar('order_type', { length: 20 }).notNull().default('open'),
  // 'open' | 'direct'

  status: varchar('status', { length: 20 }).notNull().default('draft'),
  // 'draft' | 'published' | 'negotiating' | 'confirmed' | 'pickup'
  // 'in_transit' | 'delivering' | 'delivered' | 'completed'
  // 'cancelled' | 'expired' | 'disputed'

  title: varchar('title', { length: 300 }).notNull(),

  price: decimal('price', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  priceType: varchar('price_type', { length: 20 }).notNull().default('negotiable'),
  // 'fixed' | 'negotiable'

  fromCountry: varchar('from_country', { length: 2 }).notNull(),
  fromRegion: varchar('from_region', { length: 100 }),
  fromCity: varchar('from_city', { length: 100 }).notNull(),

  toCountry: varchar('to_country', { length: 2 }).notNull(),
  toRegion: varchar('to_region', { length: 100 }),
  toCity: varchar('to_city', { length: 100 }).notNull(),

  readyDate: date('ready_date').notNull(),
  deadlineDate: date('deadline_date'),

  // Заполняется когда заказчик выбирает ставку — без FK constraint (circular ref)
  acceptedBidId: uuid('accepted_bid_id'),

  publishedAt: timestamp('published_at'),
  confirmedAt: timestamp('confirmed_at'),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
  // = readyDate + 7 дней, вычисляется при публикации

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Груз заказа ---

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
  // 'bulk' | 'boxes' | 'pallets' | 'container' | 'other'

  tempControlled: boolean('temp_controlled').default(false),
  tempMin: decimal('temp_min', { precision: 5, scale: 1 }),
  tempMax: decimal('temp_max', { precision: 5, scale: 1 }),

  notes: text('notes'),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Ставки перевозчиков на заказ ---

export const orderBids = pgTable('order_bids', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  carrierProfileId: uuid('carrier_profile_id').notNull(),
  // FK на carrier_profiles — без constraint чтобы избежать circular

  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),

  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // 'pending' | 'accepted' | 'rejected' | 'withdrawn'

  comment: text('comment'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Один перевозчик = одна ставка на заказ
  uniqueCarrierBid: uniqueIndex('order_bids_unique_carrier').on(table.orderId, table.carrierProfileId),
}));

// --- Лог статусов заказа ---

export const orderStatusLog = pgTable('order_status_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  changedBy: uuid('changed_by')
    .references(() => users.id),
  // null = система (BullMQ)

  oldStatus: varchar('old_status', { length: 20 }).notNull(),
  newStatus: varchar('new_status', { length: 20 }).notNull(),
  comment: text('comment'),
  photoUrl: varchar('photo_url', { length: 500 }),
  // Фото прикрепляется при delivering → delivered

  createdAt: timestamp('created_at').defaultNow().notNull(),
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
  createdById: uuid('created_by_id')
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
  recipientId: uuid('recipient_id')
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
  resolvedById: uuid('resolved_by_id'),
});

// --- Чат по заказу ---

export const orderMessages = pgTable('order_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .references(() => orders.id)
    .notNull(),
  senderId: uuid('sender_id')
    .references(() => users.id)
    .notNull(),
  message: text('message').notNull(),
  attachments: jsonb('attachments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Прицепы / полуприцепы ─────────────────────────────────────────

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

// ── История сцепок тягач ↔ прицеп ────────────────────────────────

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

// ── Юридические документы ─────────────────────────────────────────

export const legalDocTypeEnum = pgEnum('legal_doc_type', [
  'agreement',
  'privacy',
  'rules',
])

export const legalDocLocaleEnum = pgEnum('legal_doc_locale', [
  'ru',
  'en',
  'tk',
])

export const legalDocuments = pgTable('legal_documents', {
  id:            uuid('id').primaryKey().defaultRandom(),
  docType:       legalDocTypeEnum('doc_type').notNull(),
  locale:        legalDocLocaleEnum('locale').notNull(),
  version:       varchar('version', { length: 20 }).notNull().default('1.0'),
  title:         text('title').notNull(),
  content:       text('content').notNull(),
  isPublished:   boolean('is_published').default(false).notNull(),
  publishedAt:   timestamp('published_at'),
  effectiveDate: timestamp('effective_date'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
  updatedBy:     uuid('updated_by'),
})

// ── Прогресс по MVP roadmap (Altyn Burgut) — админка ───────────────

export const mvpRoadmapTaskProgress = pgTable('mvp_roadmap_task_progress', {
  taskId:    varchar('task_id', { length: 48 }).primaryKey(),
  isDone:    boolean('is_done').default(false).notNull(),
  notes:     text('notes').default('').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by'),
})
