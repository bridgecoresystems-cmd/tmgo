import { pgTable, text, timestamp, uuid, varchar, decimal, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { verificationStatusEnum } from './enums';

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
  gender: varchar('gender', { length: 20 }),

  // ─── OPERATIONAL (admin/dispatcher only) ───
  accountStatus: text('account_status').default('active'),
  employmentCategory: varchar('employment_category', { length: 50 }),
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

  // ─── VERIFICATION ───
  verificationStatus: verificationStatusEnum('verification_status').default('not_submitted'),
  verificationComment: text('verification_comment'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: text('verified_by'),
  submittedAt: timestamp('submitted_at'),

  // ─── LEGACY FIELDS (оставляем до завершения миграции на driver_documents/driver_citizenships/driver_contacts) ───
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

  hiddenFields: jsonb('hidden_fields').$type<string[]>().default([]),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
