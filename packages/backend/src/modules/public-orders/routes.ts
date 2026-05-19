import { Elysia } from 'elysia';
import { mapErrorToResponse } from '../../lib/errors';
import { listPublicOrders } from './service';

export const publicOrdersRoutes = new Elysia({ prefix: '/public/orders' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .get('/', ({ query }) => listPublicOrders(query as any));
