import { pgTable, text, timestamp, uuid, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { orders } from './orders';

export const chatReadCursors = pgTable('chat_read_cursors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  carrierProfileId: uuid('carrier_profile_id').notNull(),
  lastReadAt: timestamp('last_read_at').defaultNow().notNull(),
}, (table) => ({
  uniqueCursor: uniqueIndex('chat_read_cursors_unique').on(table.userId, table.orderId, table.carrierProfileId),
}));

export const orderMessages = pgTable('order_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .references(() => orders.id)
    .notNull(),
  // room = (orderId, carrierProfileId) — один чат на пару заказ+перевозчик.
  carrierProfileId: uuid('carrier_profile_id'),
  senderId: uuid('sender_id')
    .references(() => users.id)
    .notNull(),
  message: text('message').notNull(),
  attachments: jsonb('attachments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
