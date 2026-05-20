-- Координаты пункта погрузки и выгрузки заказа.
-- Yandex API во фронте отдаёт {lat, lng} для адреса — клиент шлёт их при создании.
-- Используется для матчинга «грузы рядом со мной» (водитель) и «водители рядом
-- с моим грузом» (клиент/админ).
-- GIST индексы — обязательны для ST_DWithin на сотнях/тысячах заказов.

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "from_geom" geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS "to_geom" geography(Point, 4326);

CREATE INDEX IF NOT EXISTS "orders_from_geom_idx"
  ON "orders" USING GIST ("from_geom");

CREATE INDEX IF NOT EXISTS "orders_to_geom_idx"
  ON "orders" USING GIST ("to_geom");
