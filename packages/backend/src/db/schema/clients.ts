import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const clientProfiles = pgTable('client_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  clientType: varchar('client_type', { length: 20 }).notNull(),
  // 'individual' | 'company'

  countryCode: varchar('country_code', { length: 2 }).notNull(),

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

  phone: varchar('phone', { length: 30 }),
  addressPostal: varchar('address_postal', { length: 20 }),
  addressRegion: varchar('address_region', { length: 100 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressDistrict: varchar('address_district', { length: 100 }),
  addressStreet: varchar('address_street', { length: 200 }),
  addressHouse: varchar('address_house', { length: 50 }),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clientCompany = pgTable('client_company', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .unique()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),

  companyName: varchar('company_name', { length: 300 }).notNull(),
  shortName: varchar('short_name', { length: 200 }),
  legalForm: varchar('legal_form', { length: 50 }),
  taxId: varchar('tax_id', { length: 50 }),
  regNumber: varchar('reg_number', { length: 50 }),

  website: varchar('website', { length: 300 }),
  phone: varchar('phone', { length: 30 }),
  additionalEmail: varchar('additional_email', { length: 200 }),

  bankName: varchar('bank_name', { length: 200 }),
  bankAccount: varchar('bank_account', { length: 50 }),
  bankCode: varchar('bank_code', { length: 50 }),
  bankSwift: varchar('bank_swift', { length: 20 }),
  bankCorrAccount: varchar('bank_corr_account', { length: 50 }),

  addressPostal: varchar('address_postal', { length: 20 }),
  addressRegion: varchar('address_region', { length: 100 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressDistrict: varchar('address_district', { length: 100 }),
  addressStreet: varchar('address_street', { length: 200 }),
  addressHouse: varchar('address_house', { length: 50 }),

  docFileUrl: varchar('doc_file_url', { length: 500 }),
  docVerifiedAt: timestamp('doc_verified_at'),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
