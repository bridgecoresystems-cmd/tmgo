ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "permission_entry_zone" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "permission_issue_date" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "permission_validity_date" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "medical_certificate" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "medical_certificate_scan_url" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "technical_minimum_certificate" varchar(100);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "tachograph_card_number" varchar(50);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "other_permits" text;
