CREATE TABLE IF NOT EXISTS "chat_read_cursors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "carrier_profile_id" uuid NOT NULL,
  "last_read_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "chat_read_cursors_unique" ON "chat_read_cursors" ("user_id", "order_id", "carrier_profile_id");
