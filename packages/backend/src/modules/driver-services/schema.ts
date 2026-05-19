import { t } from 'elysia';

export const createServiceBody = t.Object({
  from_city_id: t.String(),
  to_city_id: t.String(),
  vehicle_id: t.String(),
  price: t.Union([t.String(), t.Number()]),
  description: t.Optional(t.String()),
});

export const patchServiceBody = t.Object({
  from_city_id: t.Optional(t.String()),
  to_city_id: t.Optional(t.String()),
  vehicle_id: t.Optional(t.String()),
  price: t.Optional(t.Union([t.String(), t.Number()])),
  description: t.Optional(t.String()),
});
