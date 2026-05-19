import { t } from 'elysia';

export const createChangeRequestBody = t.Object({
  field_key: t.String(),
  reason: t.String(),
  requested_value: t.Optional(t.Nullable(t.String())),
  current_value: t.Optional(t.Nullable(t.String())),
  attachment_url: t.Optional(t.Nullable(t.String())),
});
