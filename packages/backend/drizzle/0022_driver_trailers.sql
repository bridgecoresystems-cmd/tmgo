-- Таблица прицепов и история сцепок тягач ↔ прицеп

DO $$ BEGIN
  CREATE TYPE "trailer_type" AS ENUM ('semi', 'drawbar');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "trailer_body_type" AS ENUM (
    'curtainsider','mega','double_deck',
    'reefer','multi_temp','isothermal',
    'flatbed','lowboy','extendable','coil_well',
    'tipper_rear','tipper_side','tipper_3way','walking_floor',
    'tanker_fuel','tanker_food','tanker_chemical','tanker_gas','silo',
    'container_20','container_40','container_swap',
    'timber','livestock','car_carrier','dumper_tipping','oversized'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "driver_trailers" (
  "id"                      uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carrier_id"              uuid NOT NULL REFERENCES "carrier_profiles"("id") ON DELETE CASCADE,

  "vin"                     varchar(17),
  "trailer_type"            "trailer_type" NOT NULL DEFAULT 'semi',
  "body_type"               "trailer_body_type" NOT NULL,
  "plate_number"            text NOT NULL,
  "color"                   text NOT NULL,

  "make_id"                 uuid REFERENCES "vehicle_makes"("id"),
  "model_id"                uuid REFERENCES "vehicle_models"("id"),
  "custom_make"             text,
  "custom_model"            text,

  "year"                    smallint,
  "chassis_number"          text,
  "capacity_tons"           numeric(6,2) NOT NULL,
  "volume_m3"               numeric(7,2),
  "axle_count"              smallint,
  "pallet_places"           smallint,

  "adr_classes"             text[] DEFAULT '{}',

  "temp_min_c"              smallint,
  "temp_max_c"              smallint,

  "has_gps"                 boolean DEFAULT false,
  "insurance_policy_num"    text,
  "insurance_expires_at"    timestamp,

  -- Холодильный агрегат (только для reefer/multi_temp)
  "ref_fuel_type"           text,
  "ref_fuel_tank_l"         integer,
  "ref_transmission"        text,
  "ref_fuel_consumption_ph" numeric(5,1),

  "ownership"               "vehicle_ownership",

  "is_active"               boolean DEFAULT true NOT NULL,
  "created_at"              timestamp DEFAULT now() NOT NULL,
  "updated_at"              timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_driver_trailers_carrier"   ON "driver_trailers"("carrier_id");
CREATE INDEX IF NOT EXISTS "idx_driver_trailers_body_type" ON "driver_trailers"("body_type");
CREATE INDEX IF NOT EXISTS "idx_driver_trailers_active"    ON "driver_trailers"("is_active");

CREATE TABLE IF NOT EXISTS "vehicle_couplings" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carrier_id"    uuid NOT NULL REFERENCES "carrier_profiles"("id") ON DELETE CASCADE,
  "tractor_id"    uuid NOT NULL REFERENCES "driver_vehicles"("id"),
  "trailer_id"    uuid NOT NULL REFERENCES "driver_trailers"("id"),
  "coupled_at"    timestamp DEFAULT now() NOT NULL,
  "decoupled_at"  timestamp,
  "notes"         text,
  "is_active"     boolean DEFAULT true NOT NULL,
  "created_at"    timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_couplings_tractor" ON "vehicle_couplings"("tractor_id");
CREATE INDEX IF NOT EXISTS "idx_couplings_trailer" ON "vehicle_couplings"("trailer_id");
CREATE INDEX IF NOT EXISTS "idx_couplings_active"  ON "vehicle_couplings"("is_active");

-- Один тягач / один прицеп = максимум одна активная сцепка
CREATE UNIQUE INDEX IF NOT EXISTS "idx_couplings_tractor_active"
  ON "vehicle_couplings"("tractor_id") WHERE "is_active" = true;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_couplings_trailer_active"
  ON "vehicle_couplings"("trailer_id") WHERE "is_active" = true;
