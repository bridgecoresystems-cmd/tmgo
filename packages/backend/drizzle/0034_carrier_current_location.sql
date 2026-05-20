-- Live-позиция водителя: мобилка шлёт координату раз в N сек.
-- last_location_at используется чтобы фильтровать «свежих» водителей
-- (не показываем тех, кто не выходил на связь >5 минут).
-- GIST индекс — обязателен для ST_DWithin/ST_Distance на больших таблицах.

ALTER TABLE "carrier_profiles"
  ADD COLUMN IF NOT EXISTS "current_location" geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS "last_location_at" timestamp;

CREATE INDEX IF NOT EXISTS "carrier_profiles_location_idx"
  ON "carrier_profiles" USING GIST ("current_location");
