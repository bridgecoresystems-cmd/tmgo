import { t } from 'elysia';

export const optionalCommentBody = t.Object({
  comment: t.Optional(t.Nullable(t.String())),
});

export const requiredCommentBody = t.Object({
  comment: t.String(),
});

export const suspendBody = t.Object({
  comment: t.String(),
  reason: t.Optional(t.String()),
});
