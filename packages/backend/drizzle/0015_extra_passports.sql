ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "extra_passports" jsonb DEFAULT '[]';
