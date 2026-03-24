-- Add missing columns to orders table
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "vehicle_id" uuid REFERENCES "vehicles"("id"),
  ADD COLUMN IF NOT EXISTS "from_city_id" uuid REFERENCES "cities"("id"),
  ADD COLUMN IF NOT EXISTS "to_city_id" uuid REFERENCES "cities"("id"),
  ADD COLUMN IF NOT EXISTS "cargo_name" text,
  ADD COLUMN IF NOT EXISTS "cargo_description" text,
  ADD COLUMN IF NOT EXISTS "snapshot_passport_id" uuid,
  ADD COLUMN IF NOT EXISTS "snapshot_license_id" uuid,
  ADD COLUMN IF NOT EXISTS "snapshot_vehicle_id" uuid,
  ADD COLUMN IF NOT EXISTS "snapshot_created_at" timestamp;
--> statement-breakpoint

-- Create order_responses table
CREATE TABLE IF NOT EXISTS "order_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "carrier_id" uuid NOT NULL REFERENCES "carrier_profiles"("id") ON DELETE CASCADE,
  "vehicle_id" uuid NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'PENDING',
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

-- Create driver_services table
CREATE TABLE IF NOT EXISTS "driver_services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carrier_id" uuid NOT NULL REFERENCES "carrier_profiles"("id") ON DELETE CASCADE,
  "vehicle_id" uuid NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "from_city_id" uuid NOT NULL REFERENCES "cities"("id"),
  "to_city_id" uuid NOT NULL REFERENCES "cities"("id"),
  "description" text,
  "price" numeric(12, 2) NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'TMT',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
