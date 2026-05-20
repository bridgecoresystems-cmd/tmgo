import { pgTable, text, timestamp, uuid, varchar, integer, boolean } from 'drizzle-orm/pg-core';

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
