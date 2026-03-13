ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "license_expiry" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "phone" varchar(50);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "inn" varchar(50);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "address" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "passport_series" varchar(20);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "passport_number" varchar(50);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "bank_name" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "bank_account" varchar(100);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "bank_bik" varchar(20);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
