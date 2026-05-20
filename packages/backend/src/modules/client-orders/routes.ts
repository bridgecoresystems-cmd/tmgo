import { Elysia } from 'elysia';
import { requireUser } from './guard';
import { createOrderBody, createBidBody, updateStatusBody, cancelOrderBody } from './schema';
import { mapErrorToResponse } from '../../lib/errors';
import {
  InvalidTransitionError,
  listBoard, listMyOrders, createOrder, getOrder, publishOrder,
  placeBid, acceptBid, updateOrderStatus, completeOrder, cancelOrder,
} from './service';

export const cabinetOrdersRoutes = new Elysia({ prefix: '/cabinet/orders' })
  .onError(({ error, set }) => {
    // invalid_status_transition отдаёт доп. поле allowed — особый contract.
    if (error instanceof InvalidTransitionError) {
      set.status = 400;
      return { error: error.code, allowed: error.allowed };
    }
    return mapErrorToResponse(error, set);
  })
  .derive(async ({ request }) => ({ user: await requireUser(request) }))

  .get('/', ({ query }) => listBoard(query as Record<string, string | undefined>))

  .get('/my', ({ user, query }) =>
    listMyOrders(user.id, query as Record<string, string | undefined>))

  .post('/', ({ user, body }) => createOrder(user.id, body), { body: createOrderBody })

  .get('/:id', ({ user, params }) => getOrder(user.id, params.id))

  .patch('/:id/publish', ({ user, params }) => publishOrder(user.id, params.id))

  .post('/:id/bids', ({ user, params, body }) => placeBid(user.id, params.id, body), {
    body: createBidBody,
  })

  .patch('/:id/bids/:bidId/accept', ({ user, params }) =>
    acceptBid(user.id, params.id, params.bidId))

  .patch('/:id/status', ({ user, params, body }) =>
    updateOrderStatus(user.id, params.id, body), { body: updateStatusBody })

  .patch('/:id/complete', ({ user, params }) => completeOrder(user.id, params.id))

  .patch('/:id/cancel', ({ user, params, body }) =>
    cancelOrder(user.id, params.id, body), { body: cancelOrderBody });
