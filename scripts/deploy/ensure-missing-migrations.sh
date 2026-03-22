#!/usr/bin/env bash
# Применить SQL, которые не попали в drizzle journal (0020–0023), и таблицы рассылки.
# Запуск из корня репозитория: DATABASE_URL=... ./scripts/deploy/ensure-missing-migrations.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/packages/backend"
: "${DATABASE_URL:?Set DATABASE_URL}"
for f in drizzle/0020_vehicle_makes_models.sql \
         drizzle/0021_driver_vehicles_extended.sql \
         drizzle/0022_driver_trailers.sql \
         drizzle/0023_legal_documents.sql; do
  echo "Applying $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS "mailing_message" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "recipient_type" text DEFAULT 'all' NOT NULL,
  "created_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "scheduled_at" timestamp with time zone,
  "sent_at" timestamp with time zone,
  "is_sent" boolean DEFAULT false NOT NULL,
  "total_recipients" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "mailing_recipient" (
  "id" serial PRIMARY KEY NOT NULL,
  "message_id" integer NOT NULL REFERENCES "mailing_message"("id") ON DELETE CASCADE,
  "recipient_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "is_read" boolean DEFAULT false NOT NULL,
  "read_at" timestamp with time zone,
  "received_at" timestamp DEFAULT now() NOT NULL
);
SQL
echo "OK"
