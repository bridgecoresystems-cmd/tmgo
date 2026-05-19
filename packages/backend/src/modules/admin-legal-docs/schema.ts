import { t } from 'elysia';

export const upsertLegalDocBody = t.Object({
  title: t.String({ minLength: 1 }),
  content: t.String({ minLength: 1 }),
  version: t.Optional(t.String()),
  effectiveDate: t.Optional(t.Nullable(t.String())),
});
