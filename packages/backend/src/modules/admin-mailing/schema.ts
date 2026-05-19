import { t } from 'elysia';

export const createMailingBody = t.Object({
  title: t.String(),
  content: t.String(),
  recipient_type: t.Optional(t.String()),
  scheduled_at: t.Optional(t.Nullable(t.String())),
});
