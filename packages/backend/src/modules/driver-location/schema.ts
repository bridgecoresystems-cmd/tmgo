import { t } from 'elysia';

// lat/lng — обычные числа в десятичных градусах WGS84.
// Диапазон проверяем здесь же, чтобы не звать БД с мусором.
export const updateLocationBody = t.Object({
  lat: t.Number({ minimum: -90, maximum: 90 }),
  lng: t.Number({ minimum: -180, maximum: 180 }),
});
