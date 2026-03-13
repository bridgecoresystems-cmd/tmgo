ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "passport_issue_date" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "passport_expiry_date" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "passport_issued_by" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "place_of_birth" varchar(255);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "residential_address" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "passport_scan_url" text;
