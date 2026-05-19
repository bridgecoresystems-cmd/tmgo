import { t } from 'elysia';

export const createCityBody = t.Object({
  name: t.String({ minLength: 1 }),
  type: t.Optional(t.String()),
  nameRu: t.Optional(t.String()),
  country: t.Optional(t.String()),
  region: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  sortOrder: t.Optional(t.Number()),
});

export const updateCityBody = t.Object({
  name: t.Optional(t.String()),
  type: t.Optional(t.String()),
  nameRu: t.Optional(t.String()),
  country: t.Optional(t.String()),
  region: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  sortOrder: t.Optional(t.Number()),
});
