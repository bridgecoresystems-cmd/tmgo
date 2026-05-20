import { pgTable, text, timestamp, uuid, integer, serial, boolean } from 'drizzle-orm/pg-core';
import { users } from './auth';

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
