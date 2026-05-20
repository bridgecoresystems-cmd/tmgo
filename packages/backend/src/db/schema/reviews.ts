import { pgTable, text, timestamp, uuid, varchar, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { orders } from './orders';

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  fromUserId: uuid('from_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  toUserId: uuid('to_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  direction: varchar('direction', { length: 20 }).notNull(),
  // 'client_to_carrier' | 'carrier_to_client'

  rating: integer('rating').notNull(),
  comment: text('comment'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueAuthorReview: uniqueIndex('reviews_unique_author').on(table.orderId, table.fromUserId),
}));
