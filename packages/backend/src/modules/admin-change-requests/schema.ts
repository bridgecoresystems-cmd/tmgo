import { t } from 'elysia';

export const approveBody = t.Object({
  comment: t.Optional(t.Nullable(t.String())),
  unlock_days: t.Optional(t.Number()),
});

export const rejectBody = t.Object({
  comment: t.String(),
});
