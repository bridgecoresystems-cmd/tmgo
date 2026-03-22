-- Таблица городов (раньше не была в SQL-миграциях — только в Drizzle schema / push)
CREATE TABLE IF NOT EXISTS "cities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "name_ru" varchar(255),
  "type" text DEFAULT 'BOTH' NOT NULL,
  "country" varchar(100) DEFAULT 'TM' NOT NULL,
  "region" varchar(100),
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
