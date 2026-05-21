import { Elysia } from 'elysia';
import { mapErrorToResponse, Forbidden } from '../../lib/errors';
import { requireChatUser } from './guard';
import { uploadBody } from './schema';
import {
  canAccess,
  listClientRooms,
  listBidRooms,
  listDriverRooms,
  getMessages,
  markRead,
  saveChatUpload,
} from './service';
import { roomWsHandler, notifyWsHandler } from './ws';

export const cabinetChatRoutes = new Elysia({ prefix: '/cabinet/chat' })
  .onError(({ error, set }) => mapErrorToResponse(error, set))
  .derive(async ({ request, set }) => ({ user: await requireChatUser(request, set) }))

  // GET /cabinet/chat/client-rooms
  .get('/client-rooms', ({ user }) => {
    if (user.role !== 'client') throw new Forbidden();
    return listClientRooms(user.id);
  })

  // GET /cabinet/chat/bid-rooms/:orderId
  .get('/bid-rooms/:orderId', ({ user, params }) => listBidRooms(user.id, params.orderId))

  // GET /cabinet/chat/driver-rooms
  .get('/driver-rooms', ({ user }) => {
    if (user.role !== 'driver') throw new Forbidden();
    return listDriverRooms(user.id);
  })

  // GET /cabinet/chat/messages/:orderId/:carrierId
  .get('/messages/:orderId/:carrierId', async ({ user, params }) => {
    const ok = await canAccess(user.id, user.role!, params.orderId, params.carrierId);
    if (!ok) throw new Forbidden();
    return getMessages(user.id, params.orderId, params.carrierId);
  })

  // POST /cabinet/chat/mark-read/:orderId/:carrierId
  .post('/mark-read/:orderId/:carrierId', async ({ user, params }) => {
    const ok = await canAccess(user.id, user.role!, params.orderId, params.carrierId);
    if (!ok) throw new Forbidden();
    return markRead(user.id, params.orderId, params.carrierId);
  })

  // POST /cabinet/chat/upload
  .post('/upload', ({ body }) => saveChatUpload(body.file), { body: uploadBody })

  // WS /cabinet/chat/ws/:orderId/:carrierId
  .ws('/ws/:orderId/:carrierId', roomWsHandler)

  // WS /cabinet/chat/ws/notify
  .ws('/ws/notify', notifyWsHandler);
