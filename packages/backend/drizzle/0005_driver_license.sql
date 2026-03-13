ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "license_categories" varchar(50);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "license_issue_date" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "license_issued_by" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "license_scan_url" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "has_international_license" boolean;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "international_license_number" varchar(50);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "international_license_validity" varchar(30);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "last_medical_examination_date" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "hire_source" varchar(50);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "attached_documents" text;
