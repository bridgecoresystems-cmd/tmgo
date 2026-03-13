ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "additional_emails" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ALTER COLUMN "phone" TYPE text USING "phone"::text;
