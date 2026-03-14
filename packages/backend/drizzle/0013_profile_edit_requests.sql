-- Add unlocked_fields to carrier_profiles
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "unlocked_fields" jsonb DEFAULT '[]';

-- Create profile_edit_requests table
CREATE TABLE IF NOT EXISTS "profile_edit_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carrier_id" uuid NOT NULL REFERENCES "carrier_profiles"("id") ON DELETE CASCADE,
  "field_key" varchar(80) NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "driver_comment" text,
  "requested_at" timestamp DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone,
  "resolved_by_id" text REFERENCES "user"("id")
);
