ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "surname" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "given_name" text;
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "patronymic" text;
--> statement-breakpoint
UPDATE "carrier_profiles" SET
  "surname" = nullif(split_part(trim(coalesce("full_name", '')), ' ', 1), ''),
  "given_name" = nullif(split_part(trim(coalesce("full_name", '')), ' ', 2), ''),
  "patronymic" = nullif(split_part(trim(coalesce("full_name", '')), ' ', 3), '')
WHERE "full_name" IS NOT NULL AND trim("full_name") != '';
--> statement-breakpoint
ALTER TABLE "carrier_profiles" DROP COLUMN IF EXISTS "full_name";
