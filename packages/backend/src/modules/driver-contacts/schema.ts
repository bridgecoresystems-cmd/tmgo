import { t } from 'elysia';

export const createContactBody = t.Object({
  contact_type: t.Union([t.Literal('phone'), t.Literal('email')]),
  value: t.String(),
  label: t.Optional(t.Nullable(t.String())),
});

export const patchContactBody = t.Object({
  value: t.Optional(t.String()),
  label: t.Optional(t.Nullable(t.String())),
  is_active: t.Optional(t.Boolean()),
});
