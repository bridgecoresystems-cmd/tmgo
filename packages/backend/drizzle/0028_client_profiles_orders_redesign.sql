-- Migration: client_profiles, orders redesign, order_cargo, order_bids, order_status_log

-- 1. Add phone_verified to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified" boolean DEFAULT false;

-- 2. Create verification_tokens
CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  "type" varchar(20) NOT NULL DEFAULT 'email',
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp
);

-- 3. Create client_profiles
CREATE TABLE IF NOT EXISTS "client_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "client_type" varchar(20) NOT NULL,
  "country_code" varchar(2) NOT NULL,
  "display_name" varchar(200),
  "verification_status" varchar(20) NOT NULL DEFAULT 'unverified',
  "verified_at" timestamp,
  "rejection_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 4. Create client_individual
CREATE TABLE IF NOT EXISTS "client_individual" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL UNIQUE REFERENCES "client_profiles"("id") ON DELETE CASCADE,
  "first_name" varchar(100),
  "last_name" varchar(100),
  "middle_name" varchar(100),
  "doc_type" varchar(30),
  "doc_number" varchar(50),
  "doc_file_url" varchar(500),
  "doc_verified_at" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 5. Create client_company
CREATE TABLE IF NOT EXISTS "client_company" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL UNIQUE REFERENCES "client_profiles"("id") ON DELETE CASCADE,
  "company_name" varchar(300) NOT NULL,
  "legal_form" varchar(50),
  "tax_id" varchar(50),
  "reg_number" varchar(50),
  "bank_name" varchar(200),
  "bank_account" varchar(50),
  "bank_swift" varchar(20),
  "doc_file_url" varchar(500),
  "doc_verified_at" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 6. Drop dependent tables (нет важных данных на VPS)
DROP TABLE IF EXISTS "order_responses" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;

-- 7. Create new orders table
CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_profile_id" uuid NOT NULL REFERENCES "client_profiles"("id"),
  "order_type" varchar(20) NOT NULL DEFAULT 'open',
  "status" varchar(20) NOT NULL DEFAULT 'draft',
  "title" varchar(300) NOT NULL,
  "price" numeric(12, 2),
  "currency" varchar(3) NOT NULL DEFAULT 'USD',
  "price_type" varchar(20) NOT NULL DEFAULT 'negotiable',
  "from_country" varchar(2) NOT NULL,
  "from_region" varchar(100),
  "from_city" varchar(100) NOT NULL,
  "to_country" varchar(2) NOT NULL,
  "to_region" varchar(100),
  "to_city" varchar(100) NOT NULL,
  "ready_date" date NOT NULL,
  "deadline_date" date,
  "accepted_bid_id" uuid,
  "published_at" timestamp,
  "confirmed_at" timestamp,
  "completed_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 8. Create order_cargo
CREATE TABLE "order_cargo" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL UNIQUE REFERENCES "orders"("id") ON DELETE CASCADE,
  "cargo_type" varchar(100) NOT NULL,
  "weight_kg" numeric(10, 2),
  "volume_m3" numeric(10, 3),
  "packaging" varchar(50),
  "temp_controlled" boolean DEFAULT false,
  "temp_min" numeric(5, 1),
  "temp_max" numeric(5, 1),
  "notes" text,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 9. Create order_bids
CREATE TABLE "order_bids" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "carrier_profile_id" uuid NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'USD',
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "comment" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "order_bids_unique_carrier" ON "order_bids"("order_id", "carrier_profile_id");

-- 10. Create order_status_log
CREATE TABLE "order_status_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "changed_by" uuid REFERENCES "users"("id"),
  "old_status" varchar(20) NOT NULL,
  "new_status" varchar(20) NOT NULL,
  "comment" text,
  "photo_url" varchar(500),
  "created_at" timestamp DEFAULT now() NOT NULL
);
