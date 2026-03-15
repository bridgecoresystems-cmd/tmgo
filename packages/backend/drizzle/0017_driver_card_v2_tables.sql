-- Новые таблицы по ТЗ driver card system v2
-- Enums (создаём только если ещё не существуют через отдельные миграции)

DO $$ BEGIN
  CREATE TYPE "doc_type" AS ENUM (
    'passport', 'drivers_license', 'international_drivers_license', 'visa',
    'medical_certificate', 'insurance', 'tachograph_card', 'technical_minimum_cert',
    'entry_permit', 'adr_certificate', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "doc_status" AS ENUM (
    'pending_verification', 'active', 'expired', 'revoked', 'superseded', 'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "citizenship_status" AS ENUM ('active', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "contact_type" AS ENUM ('phone', 'email');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "vehicle_ownership" AS ENUM ('own', 'company', 'leased');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "change_request_status" AS ENUM ('pending', 'approved', 'rejected', 'applied', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- driver_documents
CREATE TABLE IF NOT EXISTS "driver_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carrier_id" uuid NOT NULL REFERENCES "carrier_profiles"("id") ON DELETE CASCADE,
  "doc_type" "doc_type" NOT NULL,
  "country" text,
  "series" text,
  "number" text,
  "issued_by" text,
  "issued_at" timestamp,
  "expires_at" timestamp,
  "place_of_birth" text,
  "residential_address" text,
  "license_categories" text,
  "permission_zone" text,
  "notes" text,
  "scan_url" text,
  "status" "doc_status" DEFAULT 'pending_verification',
  "valid_from" timestamp DEFAULT now(),
  "valid_until" timestamp,
  "superseded_by_id" uuid,
  "rejection_reason" text,
  "verified_at" timestamp,
  "verified_by" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- driver_citizenships
CREATE TABLE IF NOT EXISTS "driver_citizenships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carrier_id" uuid NOT NULL REFERENCES "carrier_profiles"("id") ON DELETE CASCADE,
  "country" text NOT NULL,
  "acquired_at" timestamp,
  "revoked_at" timestamp,
  "scan_url" text,
  "status" "citizenship_status" DEFAULT 'active',
  "verified_at" timestamp,
  "verified_by" text,
  "created_at" timestamp DEFAULT now()
);

-- driver_contacts
CREATE TABLE IF NOT EXISTS "driver_contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carrier_id" uuid NOT NULL REFERENCES "carrier_profiles"("id") ON DELETE CASCADE,
  "contact_type" "contact_type" NOT NULL,
  "value" text NOT NULL,
  "label" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

-- driver_vehicles (новая структура с жизненным циклом)
CREATE TABLE IF NOT EXISTS "driver_vehicles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carrier_id" uuid NOT NULL REFERENCES "carrier_profiles"("id") ON DELETE CASCADE,
  "plate_number" text NOT NULL,
  "vehicle_type" text,
  "brand" text,
  "model" text,
  "year" text,
  "ownership" "vehicle_ownership",
  "assigned_from" timestamp DEFAULT now(),
  "assigned_until" timestamp,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);

-- profile_verification_history
CREATE TABLE IF NOT EXISTS "profile_verification_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carrier_id" uuid NOT NULL REFERENCES "carrier_profiles"("id") ON DELETE CASCADE,
  "action" text NOT NULL,
  "previous_status" text,
  "new_status" text,
  "comment" text,
  "performed_by" text,
  "performed_by_role" text,
  "profile_snapshot" jsonb,
  "created_at" timestamp DEFAULT now()
);

-- profile_change_requests (новая таблица, не profile_edit_requests)
CREATE TABLE IF NOT EXISTS "profile_change_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carrier_id" uuid NOT NULL REFERENCES "carrier_profiles"("id") ON DELETE CASCADE,
  "field_key" text NOT NULL,
  "current_value" text,
  "requested_value" text,
  "reason" text,
  "status" "change_request_status" DEFAULT 'pending',
  "admin_comment" text,
  "resolved_by" text,
  "resolved_at" timestamp,
  "unlocked_until" timestamp,
  "requested_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now()
);
