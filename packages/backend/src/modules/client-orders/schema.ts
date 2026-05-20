import { t } from 'elysia';

export const createOrderBody = t.Object({
  title: t.String(),
  fromCountry: t.String({ minLength: 2, maxLength: 2 }),
  fromRegion: t.Optional(t.String()),
  fromCity: t.String(),
  toCountry: t.String({ minLength: 2, maxLength: 2 }),
  toRegion: t.Optional(t.String()),
  toCity: t.String(),
  readyDate: t.String(),
  deadlineDate: t.Optional(t.String()),
  price: t.Optional(t.Number()),
  currency: t.Optional(t.String()),
  cargo: t.Object({
    cargoType: t.String(),
    weightKg: t.Optional(t.Number()),
    volumeM3: t.Optional(t.Number()),
    packaging: t.Optional(t.String()),
    tempControlled: t.Optional(t.Boolean()),
    tempMin: t.Optional(t.Number()),
    tempMax: t.Optional(t.Number()),
    notes: t.Optional(t.String()),
  }),
});

export const createBidBody = t.Object({
  amount: t.Number(),
  currency: t.Optional(t.String()),
  comment: t.Optional(t.String()),
});

export const updateStatusBody = t.Object({
  status: t.String(),
  comment: t.Optional(t.String()),
  photoUrl: t.Optional(t.String()),
});

export const cancelOrderBody = t.Optional(t.Object({
  reason: t.Optional(t.String()),
}));
