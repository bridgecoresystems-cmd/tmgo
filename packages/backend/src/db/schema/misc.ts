import { pgTable, text, timestamp, uuid, varchar, boolean } from 'drizzle-orm/pg-core';

// Прогресс по MVP roadmap (Altyn Burgut) — админка.
export const mvpRoadmapTaskProgress = pgTable('mvp_roadmap_task_progress', {
  taskId:    varchar('task_id', { length: 48 }).primaryKey(),
  isDone:    boolean('is_done').default(false).notNull(),
  notes:     text('notes').default('').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by'),
});

// Сообщения с публичной контакт-формы.
export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('new'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
