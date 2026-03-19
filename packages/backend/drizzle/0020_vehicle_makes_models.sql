-- Справочники марок и моделей ТС
CREATE TABLE IF NOT EXISTS "vehicle_makes" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name"         varchar(100) NOT NULL,
  "slug"         varchar(100) NOT NULL UNIQUE,
  "country_code" varchar(2),
  "is_custom"    boolean DEFAULT false NOT NULL,
  "is_active"    boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "vehicle_models" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "make_id"           uuid NOT NULL REFERENCES "vehicle_makes"("id") ON DELETE CASCADE,
  "name"              varchar(100) NOT NULL,
  "slug"              varchar(100) NOT NULL,
  "compatible_types"  text[] DEFAULT '{}',
  "is_custom"         boolean DEFAULT false NOT NULL,
  "is_active"         boolean DEFAULT true NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_models_make_slug_idx" ON "vehicle_models" ("make_id", "slug");
