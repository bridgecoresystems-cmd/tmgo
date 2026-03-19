-- Расширение driver_vehicles для тягача

-- Новые enum'ы
DO $$ BEGIN
  CREATE TYPE "fuel_type" AS ENUM ('diesel', 'lpg', 'lng', 'electric', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "transmission_type" AS ENUM ('manual', 'automatic', 'robotized');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "euro_class" AS ENUM ('euro3', 'euro4', 'euro5', 'euro6');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Добавить колонки в driver_vehicles
ALTER TABLE "driver_vehicles"
  ADD COLUMN IF NOT EXISTS "vin"                    varchar(17),
  ADD COLUMN IF NOT EXISTS "chassis_number"         text,
  ADD COLUMN IF NOT EXISTS "chassis_type"           text,
  ADD COLUMN IF NOT EXISTS "axle_config"            text,
  ADD COLUMN IF NOT EXISTS "color"                  text,
  ADD COLUMN IF NOT EXISTS "capacity_tons"          numeric(6,2),
  ADD COLUMN IF NOT EXISTS "has_gps"                boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "insurance_policy_num"   text,
  ADD COLUMN IF NOT EXISTS "insurance_expires_at"   timestamp,
  ADD COLUMN IF NOT EXISTS "fuel_type"              "fuel_type",
  ADD COLUMN IF NOT EXISTS "engine_volume_l"        numeric(4,1),
  ADD COLUMN IF NOT EXISTS "power_hp"               integer,
  ADD COLUMN IF NOT EXISTS "fuel_tank_1_l"          integer,
  ADD COLUMN IF NOT EXISTS "fuel_tank_2_l"          integer,
  ADD COLUMN IF NOT EXISTS "transmission"           "transmission_type",
  ADD COLUMN IF NOT EXISTS "euro_class"             "euro_class",
  ADD COLUMN IF NOT EXISTS "fuel_consumption_per_100km" numeric(5,1),
  ADD COLUMN IF NOT EXISTS "fifth_wheel_capacity_kg" integer,
  ADD COLUMN IF NOT EXISTS "max_gross_weight_t"     numeric(6,2),
  ADD COLUMN IF NOT EXISTS "make_id"                uuid REFERENCES "vehicle_makes"("id"),
  ADD COLUMN IF NOT EXISTS "model_id"               uuid REFERENCES "vehicle_models"("id"),
  ADD COLUMN IF NOT EXISTS "custom_make"            text,
  ADD COLUMN IF NOT EXISTS "custom_model"           text;
