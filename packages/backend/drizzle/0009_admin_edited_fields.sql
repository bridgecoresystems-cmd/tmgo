ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "admin_edited_fields" jsonb DEFAULT '[]';
