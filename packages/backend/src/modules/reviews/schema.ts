// Паспортный контроль: форма входящих данных. Elysia сам вернёт 422 при несовпадении.
import { t } from 'elysia';

export const createReviewBody = t.Object({
  rating: t.Integer({ minimum: 1, maximum: 5 }),
  comment: t.Optional(t.String({ maxLength: 1000 })),
});
