-- Добавить недостающие колонки в carrier_profiles (схема опережает миграции)
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "account_status" text DEFAULT 'active';
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "is_online" boolean DEFAULT false;
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "is_online_availability" boolean DEFAULT false;
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "company_address" text;
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "warehouse_branch" text;
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "responsible_logistician" text;
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "recruitment_notes" text;
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "verification_comment" text;
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "verified_at" timestamp;
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "verified_by" text;
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp;
