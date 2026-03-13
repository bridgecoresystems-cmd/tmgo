ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "full_name" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "date_of_birth" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "citizenship" varchar(100);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "gender" varchar(20);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "status" varchar(30);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "employment_category" varchar(50);
