// PostGIS integration для Drizzle. Drizzle нативно не знает PostGIS,
// поэтому колонка объявляется через customType, а запись/чтение делается
// явными SQL-шаблонами (ST_MakePoint / ST_X / ST_Y).
//
// Сценарий использования (фаза 1+, когда добавим колонки в таблицы):
//
//   import { geographyPoint, geoPoint, geoLat, geoLng } from '../db/schema';
//
//   // объявление колонки (в db/schema/<domain>.ts):
//   currentLocation: geographyPoint('current_location'),
//
//   // insert/update:
//   await db.update(carrierProfiles)
//     .set({ currentLocation: { lat: 37.95, lng: 58.38 } })
//     .where(...);
//
//   // select с парсингом обратно в {lat, lng}:
//   await db.select({
//     lat: geoLat(carrierProfiles.currentLocation),
//     lng: geoLng(carrierProfiles.currentLocation),
//   }).from(carrierProfiles);
//
//   // поиск в радиусе:
//   .where(sql`ST_DWithin(${carrierProfiles.currentLocation}, ${geoPoint(lat, lng)}, ${radiusMeters})`);

import { customType } from 'drizzle-orm/pg-core';
import { sql, type SQL } from 'drizzle-orm';

export type LatLng = { lat: number; lng: number };

// geography(POINT, 4326) — сфероид WGS84, расстояния в метрах.
// Для большинства задач TMGO (поиск водителей рядом, фенсы погрузки) этого хватает.
// Если понадобится planar geometry (быстрее, но требует проекции) — заведём отдельный тип.
export const geographyPoint = customType<{
  data: LatLng;
  driverData: string;
}>({
  dataType() {
    return 'geography(Point, 4326)';
  },
  toDriver(value: LatLng): string {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  // node-postgres возвращает hex-WKB ('0101000020E6...'). Парсить его руками
  // дорого и хрупко — для чтения координат всегда используем helpers ниже
  // (geoLat/geoLng), которые делают ST_X/ST_Y на стороне Postgres.
});

// SQL-helpers для построения и разбора точек в запросах.
export const geoPoint = (lat: number, lng: number): SQL =>
  sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;

export const geoLat = (column: unknown): SQL<number> =>
  sql<number>`ST_Y(${column}::geometry)::float`;

export const geoLng = (column: unknown): SQL<number> =>
  sql<number>`ST_X(${column}::geometry)::float`;

// Расстояние в метрах между колонкой и заданной точкой. Использовать в ORDER BY
// для сортировки «ближайшие сверху» или вместе с ST_DWithin в WHERE.
export const geoDistance = (column: unknown, lat: number, lng: number): SQL<number> =>
  sql<number>`ST_Distance(${column}, ${geoPoint(lat, lng)})`;
