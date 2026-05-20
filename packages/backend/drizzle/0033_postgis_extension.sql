-- PostGIS: фундамент для гео-фич TMGO (координаты городов, live-позиция водителей,
-- ST_DWithin поиск заказов рядом, гео-фенс при pickup/delivery).
-- Идемпотентно — IF NOT EXISTS. Берёт ACCESS EXCLUSIVE лок на момент установки;
-- на пустом TMGO-инстансе мгновенно.
CREATE EXTENSION IF NOT EXISTS postgis;
