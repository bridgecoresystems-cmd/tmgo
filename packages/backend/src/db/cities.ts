import { pgTable, text, timestamp, uuid, varchar, boolean } from 'drizzle-orm/pg-core';

export const cities = pgTable('cities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: text('type').$type<'FROM' | 'TO' | 'BOTH'>().default('BOTH').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
