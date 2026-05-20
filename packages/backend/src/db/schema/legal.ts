import { pgTable, text, timestamp, uuid, varchar, boolean } from 'drizzle-orm/pg-core';
import { legalDocTypeEnum, legalDocLocaleEnum } from './enums';

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
});
