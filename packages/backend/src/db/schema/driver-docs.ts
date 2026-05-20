import { pgTable, text, timestamp, uuid, varchar, boolean, jsonb } from 'drizzle-orm/pg-core';
import { carrierProfiles } from './carriers';
import { docTypeEnum, docStatusEnum, citizenshipStatusEnum, contactTypeEnum, changeRequestStatusEnum } from './enums';

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

  placeOfBirth: text('place_of_birth'),
  residentialAddress: text('residential_address'),

  licenseCategories: text('license_categories'),

  permissionZone: text('permission_zone'),

  notes: text('notes'),
  scanUrl: text('scan_url'),

  status: docStatusEnum('status').default('pending_verification'),
  validFrom: timestamp('valid_from').defaultNow(),
  validUntil: timestamp('valid_until'),
  supersededById: uuid('superseded_by_id'),
  rejectionReason: text('rejection_reason'),

  verifiedAt: timestamp('verified_at'),
  verifiedBy: text('verified_by'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

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

export const driverContacts = pgTable('driver_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),

  contactType: contactTypeEnum('contact_type').notNull(),
  value: text('value').notNull(),
  label: text('label'),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const profileVerificationHistory = pgTable('profile_verification_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),

  action: text('action').notNull(),

  previousStatus: text('previous_status'),
  newStatus: text('new_status'),
  comment: text('comment'),
  performedBy: text('performed_by'),
  performedByRole: text('performed_by_role'),

  profileSnapshot: jsonb('profile_snapshot'),

  createdAt: timestamp('created_at').defaultNow(),
});

export const profileChangeRequests = pgTable('profile_change_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrierProfiles.id, { onDelete: 'cascade' }),

  fieldKey: text('field_key').notNull(),

  currentValue: text('current_value'),
  requestedValue: text('requested_value'),
  reason: text('reason'),

  status: changeRequestStatusEnum('status').default('pending'),
  adminComment: text('admin_comment'),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at'),

  unlockedUntil: timestamp('unlocked_until'),

  requestedAt: timestamp('requested_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// LEGACY: старая таблица запросов на изменение, оставлена для совместимости.
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
