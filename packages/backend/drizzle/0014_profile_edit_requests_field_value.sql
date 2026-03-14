-- Store value at request time (what driver wants to change/remove, or "(добавление)" for add)
ALTER TABLE "profile_edit_requests" ADD COLUMN IF NOT EXISTS "field_value" text;
