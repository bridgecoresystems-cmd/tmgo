ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "passport_is_active" boolean DEFAULT true NOT NULL;
