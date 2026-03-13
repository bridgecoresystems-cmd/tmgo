ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "verification_status" varchar(30) DEFAULT 'not_verified' NOT NULL;
UPDATE "carrier_profiles" SET "verification_status" = 'verified' WHERE "is_verified" = true;
