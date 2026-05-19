// Официант: принять запрос → вызвать service → отдать ответ. Без логики и без SQL.
import { Elysia } from 'elysia';
import { requireUser } from './guard';
import { createReviewBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import {
  createReview, getOrderReviews, getUserReviews, getMyReviews,
} from './service';

export const reviewsRoutes = new Elysia({ prefix: '/cabinet' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request }) => ({ user: await requireUser(request) }))

  .post('/orders/:id/review', ({ user, params, body }) =>
    createReview({
      userId: user.id,
      orderId: params.id,
      rating: body.rating,
      comment: body.comment,
    }),
  { body: createReviewBody })

  .get('/orders/:id/reviews', ({ user, params }) =>
    getOrderReviews({ userId: user.id, orderId: params.id }))

  .get('/reviews/user/:userId', ({ params }) =>
    getUserReviews(params.userId))

  .get('/reviews/me', ({ user }) =>
    getMyReviews(user.id));
