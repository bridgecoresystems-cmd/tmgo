import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '../../db';
import { orders, orderMessages, orderBids, carrierProfiles, clientProfiles, users, chatReadCursors } from '../../db/schema';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';
import { signAttachmentUrls } from '../../lib/chat-attachments';

// room key = orderId:carrierProfileId
const rooms = new Map<string, Set<any>>();
// userId → WS connections for badge notifications
const notifyConns = new Map<string, Set<any>>();

function roomKey(orderId: string, carrierId: string) {
  return `${orderId}:${carrierId}`;
}

async function getClientProfileId(userId: string): Promise<string | null> {
  const [p] = await db.select({ id: clientProfiles.id }).from(clientProfiles)
    .where(eq(clientProfiles.userId, userId)).limit(1);
  return p?.id ?? null;
}

async function getCarrierProfileId(userId: string): Promise<string | null> {
  const [p] = await db.select({ id: carrierProfiles.id }).from(carrierProfiles)
    .where(eq(carrierProfiles.userId, userId)).limit(1);
  return p?.id ?? null;
}

// Client can access (orderId, carrierId) if they own the order.
// Driver can access if their carrierProfileId === carrierId AND they have a bid on the order.
async function canAccess(
  userId: string,
  role: string,
  orderId: string,
  carrierId: string,
): Promise<boolean> {
  const [order] = await db.select({ id: orders.id, clientProfileId: orders.clientProfileId })
    .from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return false;

  if (role === 'client') {
    const cpId = await getClientProfileId(userId);
    return cpId !== null && order.clientProfileId === cpId;
  }

  if (role === 'driver') {
    const cpId = await getCarrierProfileId(userId);
    if (!cpId || cpId !== carrierId) return false;
    const [bid] = await db.select({ id: orderBids.id }).from(orderBids)
      .where(and(eq(orderBids.orderId, orderId), eq(orderBids.carrierProfileId, cpId))).limit(1);
    return !!bid;
  }

  return false;
}

export const cabinetChatRoutes = new Elysia({ prefix: '/cabinet/chat' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || (user.role !== 'client' && user.role !== 'driver')) {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { user };
  })

  // GET /cabinet/chat/client-rooms
  // Client: list all orders that have at least one driver chat, grouped by order.
  .get('/client-rooms', async ({ user, set }) => {
    if (user.role !== 'client') { set.status = 403; return { error: 'forbidden' }; }
    const clientProfileId = await getClientProfileId(user.id);
    if (!clientProfileId) { set.status = 403; return { error: 'forbidden' }; }

    // All orders belonging to this client
    const myOrders = await db.select({
      id: orders.id,
      title: orders.title,
      status: orders.status,
      fromCity: orders.fromCity,
      toCity: orders.toCity,
    }).from(orders).where(eq(orders.clientProfileId, clientProfileId));

    if (myOrders.length === 0) return { orders: [] };

    const orderIds = myOrders.map(o => o.id);

    // All messages for these orders
    const msgRows = await db.select({
      orderId: orderMessages.orderId,
      carrierProfileId: orderMessages.carrierProfileId,
      senderId: orderMessages.senderId,
      message: orderMessages.message,
      createdAt: orderMessages.createdAt,
    }).from(orderMessages)
      .where(inArray(orderMessages.orderId, orderIds))
      .orderBy(desc(orderMessages.createdAt));

    // Read cursors for this user
    const cursors = await db.select({
      orderId: chatReadCursors.orderId,
      carrierProfileId: chatReadCursors.carrierProfileId,
      lastReadAt: chatReadCursors.lastReadAt,
    }).from(chatReadCursors)
      .where(and(
        eq(chatReadCursors.userId, user.id),
        inArray(chatReadCursors.orderId, orderIds),
      ));
    const cursorMap = new Map<string, Date>();
    for (const c of cursors) {
      if (c.carrierProfileId) cursorMap.set(`${c.orderId}:${c.carrierProfileId}`, c.lastReadAt);
    }

    // Group by orderId → carrierId → last message + unread count
    const orderMap = new Map<string, Map<string, { message: string; createdAt: any; unreadCount: number }>>();
    for (const m of msgRows) {
      if (!m.carrierProfileId) continue;
      if (!orderMap.has(m.orderId)) orderMap.set(m.orderId, new Map());
      const cmap = orderMap.get(m.orderId)!;
      if (!cmap.has(m.carrierProfileId)) {
        cmap.set(m.carrierProfileId, { message: m.message, createdAt: m.createdAt, unreadCount: 0 });
      }
      const lastRead = cursorMap.get(`${m.orderId}:${m.carrierProfileId}`);
      if (m.senderId !== user.id && (!lastRead || m.createdAt > lastRead)) {
        cmap.get(m.carrierProfileId)!.unreadCount++;
      }
    }

    // Collect all carrierProfileIds that have messages
    const allCarrierIds = [...new Set(
      [...orderMap.values()].flatMap(m => [...m.keys()])
    )];

    if (allCarrierIds.length === 0) return { orders: [] };

    const carriers = await db.select({
      id: carrierProfiles.id,
      userId: carrierProfiles.userId,
      companyName: carrierProfiles.companyName,
    }).from(carrierProfiles).where(inArray(carrierProfiles.id, allCarrierIds));

    const carrierUserIds = carriers.map(c => c.userId);
    const userRows = carrierUserIds.length > 0
      ? await db.select({ id: users.id, name: users.name }).from(users)
        .where(inArray(users.id, carrierUserIds))
      : [];

    const userMap = new Map(userRows.map(u => [u.id, u.name]));
    const carrierMap = new Map(carriers.map(c => [c.id, c]));

    const result = myOrders
      .filter(o => orderMap.has(o.id))
      .map(o => {
        const cmap = orderMap.get(o.id)!;
        const drivers = [...cmap.entries()].map(([cid, last]) => {
          const carrier = carrierMap.get(cid);
          const name = carrier
            ? (userMap.get(carrier.userId) ?? carrier.companyName ?? 'Водитель')
            : 'Водитель';
          return {
            carrierId: cid,
            carrierName: name,
            lastMessage: last.message,
            lastMessageAt: last.createdAt,
            unreadCount: last.unreadCount,
          };
        });
        return { ...o, drivers };
      });

    return { orders: result };
  })

  // GET /cabinet/chat/bid-rooms/:orderId
  // Client: list all bids on this order with carrier info and last message preview.
  .get('/bid-rooms/:orderId', async ({ user, params, set }) => {
    const clientProfileId = await getClientProfileId(user.id);
    if (!clientProfileId) { set.status = 403; return { error: 'forbidden' }; }

    const [order] = await db.select({ id: orders.id, clientProfileId: orders.clientProfileId })
      .from(orders).where(eq(orders.id, params.orderId)).limit(1);
    if (!order || order.clientProfileId !== clientProfileId) {
      set.status = 403; return { error: 'forbidden' };
    }

    const bids = await db.select({
      id: orderBids.id,
      carrierProfileId: orderBids.carrierProfileId,
      amount: orderBids.amount,
      currency: orderBids.currency,
      status: orderBids.status,
      comment: orderBids.comment,
      createdAt: orderBids.createdAt,
    }).from(orderBids).where(eq(orderBids.orderId, params.orderId));

    if (bids.length === 0) return { rooms: [] };

    const carrierIds = bids.map(b => b.carrierProfileId);
    const carriers = await db.select({
      id: carrierProfiles.id,
      userId: carrierProfiles.userId,
      companyName: carrierProfiles.companyName,
    }).from(carrierProfiles).where(inArray(carrierProfiles.id, carrierIds));

    const carrierUserIds = carriers.map(c => c.userId);
    const userRows = carrierUserIds.length > 0
      ? await db.select({ id: users.id, name: users.name }).from(users)
        .where(inArray(users.id, carrierUserIds))
      : [];

    const userMap = new Map(userRows.map(u => [u.id, u.name]));
    const carrierMap = new Map(carriers.map(c => [c.id, c]));

    // Last message per (orderId, carrierId)
    const lastMsgRows = await db.select({
      carrierProfileId: orderMessages.carrierProfileId,
      message: orderMessages.message,
      createdAt: orderMessages.createdAt,
    }).from(orderMessages)
      .where(and(
        eq(orderMessages.orderId, params.orderId),
        inArray(orderMessages.carrierProfileId as any, carrierIds),
      ))
      .orderBy(desc(orderMessages.createdAt));

    const lastMsgMap = new Map<string, { message: string; createdAt: any }>();
    for (const m of lastMsgRows) {
      if (m.carrierProfileId && !lastMsgMap.has(m.carrierProfileId)) {
        lastMsgMap.set(m.carrierProfileId, { message: m.message, createdAt: m.createdAt });
      }
    }

    const roomList = bids.map(bid => {
      const carrier = carrierMap.get(bid.carrierProfileId);
      const name = carrier
        ? (userMap.get(carrier.userId) || carrier.companyName || 'Перевозчик')
        : 'Перевозчик';
      const last = lastMsgMap.get(bid.carrierProfileId);
      return {
        carrierId: bid.carrierProfileId,
        carrierName: name,
        bidId: bid.id,
        bidAmount: bid.amount,
        bidCurrency: bid.currency,
        bidStatus: bid.status,
        lastMessage: last?.message ?? null,
        lastMessageAt: last?.createdAt ?? null,
        hasMessages: !!last,
      };
    });

    return { rooms: roomList };
  })

  // GET /cabinet/chat/driver-rooms
  // Driver: list orders where client started a chat (has messages) with me.
  .get('/driver-rooms', async ({ user, set }) => {
    if (user.role !== 'driver') { set.status = 403; return { error: 'forbidden' }; }
    const carrierId = await getCarrierProfileId(user.id);
    if (!carrierId) { set.status = 403; return { error: 'forbidden' }; }

    const msgs = await db.select({
      orderId: orderMessages.orderId,
    }).from(orderMessages)
      .where(eq(orderMessages.carrierProfileId as any, carrierId));

    const orderIds = [...new Set(msgs.map(m => m.orderId))];
    if (orderIds.length === 0) return { rooms: [] };

    const orderRows = await db.select({
      id: orders.id,
      title: orders.title,
      status: orders.status,
      clientProfileId: orders.clientProfileId,
      fromCity: orders.fromCity,
      toCity: orders.toCity,
    }).from(orders).where(inArray(orders.id, orderIds));

    const clientIds = orderRows.map(o => o.clientProfileId);
    const clientRows = await db.select({
      id: clientProfiles.id,
      userId: clientProfiles.userId,
    }).from(clientProfiles).where(inArray(clientProfiles.id, clientIds));

    const clientUserIds = clientRows.map(c => c.userId);
    const clientUsers = clientUserIds.length > 0
      ? await db.select({ id: users.id, name: users.name }).from(users)
        .where(inArray(users.id, clientUserIds))
      : [];

    const clientUserMap = new Map(clientUsers.map(u => [u.id, u.name]));
    const clientProfileMap = new Map(clientRows.map(c => [c.id, c]));

    // All messages per room (for last message + unread count)
    const lastMsgs = await db.select({
      orderId: orderMessages.orderId,
      message: orderMessages.message,
      senderId: orderMessages.senderId,
      createdAt: orderMessages.createdAt,
    }).from(orderMessages)
      .where(and(
        inArray(orderMessages.orderId, orderIds),
        eq(orderMessages.carrierProfileId as any, carrierId),
      ))
      .orderBy(desc(orderMessages.createdAt));

    // Read cursors for this driver (one per orderId since carrierId is fixed)
    const driverCursors = await db.select({
      orderId: chatReadCursors.orderId,
      lastReadAt: chatReadCursors.lastReadAt,
    }).from(chatReadCursors)
      .where(and(
        eq(chatReadCursors.userId, user.id),
        inArray(chatReadCursors.orderId, orderIds),
        eq(chatReadCursors.carrierProfileId, carrierId),
      ));
    const driverCursorMap = new Map<string, Date>();
    for (const c of driverCursors) driverCursorMap.set(c.orderId, c.lastReadAt);

    const lastMsgMap = new Map<string, typeof lastMsgs[0]>();
    const unreadMap = new Map<string, number>();
    for (const m of lastMsgs) {
      if (!lastMsgMap.has(m.orderId)) lastMsgMap.set(m.orderId, m);
      const lastRead = driverCursorMap.get(m.orderId);
      if (m.senderId !== user.id && (!lastRead || m.createdAt > lastRead)) {
        unreadMap.set(m.orderId, (unreadMap.get(m.orderId) ?? 0) + 1);
      }
    }

    const rooms = orderRows.map(order => {
      const clientProfile = clientProfileMap.get(order.clientProfileId);
      const clientName = clientProfile
        ? (clientUserMap.get(clientProfile.userId) ?? 'Заказчик')
        : 'Заказчик';
      const last = lastMsgMap.get(order.id);
      return {
        orderId: order.id,
        orderTitle: order.title,
        orderStatus: order.status,
        fromCity: order.fromCity,
        toCity: order.toCity,
        clientName,
        carrierId,
        lastMessage: last?.message ?? null,
        lastMessageAt: last?.createdAt ?? null,
        unreadCount: unreadMap.get(order.id) ?? 0,
      };
    });

    return { rooms };
  })

  // GET /cabinet/chat/messages/:orderId/:carrierId
  .get('/messages/:orderId/:carrierId', async ({ user, params, set }) => {
    const ok = await canAccess(user.id, user.role!, params.orderId, params.carrierId);
    if (!ok) { set.status = 403; return { error: 'forbidden' }; }

    const cursorSql = sql`COALESCE((SELECT max(created_at) FROM order_messages WHERE order_id = ${params.orderId} AND carrier_profile_id = ${params.carrierId}), now())`;

    // Mark room as read
    await db.insert(chatReadCursors).values({
      userId: user.id,
      orderId: params.orderId,
      carrierProfileId: params.carrierId,
      lastReadAt: cursorSql,
    }).onConflictDoUpdate({
      target: [chatReadCursors.userId, chatReadCursors.orderId, chatReadCursors.carrierProfileId],
      set: { lastReadAt: cursorSql },
    });

    const rows = await db.select({
      id: orderMessages.id,
      orderId: orderMessages.orderId,
      senderId: orderMessages.senderId,
      message: orderMessages.message,
      attachments: orderMessages.attachments,
      createdAt: orderMessages.createdAt,
      senderName: users.name,
    }).from(orderMessages)
      .leftJoin(users, eq(orderMessages.senderId, users.id))
      .where(and(
        eq(orderMessages.orderId, params.orderId),
        eq(orderMessages.carrierProfileId as any, params.carrierId),
      ))
      .orderBy(desc(orderMessages.createdAt))
      .limit(100);

    return rows.reverse().map(r => {
      const urls = (r.attachments as { urls?: string[] })?.urls ?? [];
      return {
        id: r.id,
        orderId: r.orderId,
        userId: r.senderId,
        content: r.message,
        attachments: signAttachmentUrls(urls),
        createdAt: r.createdAt?.toISOString(),
        user: { id: r.senderId, name: r.senderName ?? 'Unknown' },
      };
    });
  })

  // POST /cabinet/chat/mark-read/:orderId/:carrierId
  // Awaitable cursor update — call before refetching badges to avoid race.
  .post('/mark-read/:orderId/:carrierId', async ({ user, params, set }) => {
    const ok = await canAccess(user.id, user.role!, params.orderId, params.carrierId);
    if (!ok) { set.status = 403; return { error: 'forbidden' }; }
    const cursorSql = sql`COALESCE((SELECT max(created_at) FROM order_messages WHERE order_id = ${params.orderId} AND carrier_profile_id = ${params.carrierId}), now())`;

    await db.insert(chatReadCursors).values({
      userId: user.id,
      orderId: params.orderId,
      carrierProfileId: params.carrierId,
      lastReadAt: cursorSql,
    }).onConflictDoUpdate({
      target: [chatReadCursors.userId, chatReadCursors.orderId, chatReadCursors.carrierProfileId],
      set: { lastReadAt: cursorSql },
    });
    return { ok: true };
  })

  // POST /cabinet/chat/upload
  .post('/upload', async ({ user, body, set }) => {
    const file = body.file;
    if (!file || !file.size) { set.status = 400; return { error: 'No file' }; }
    const ext = (file.name ?? '').split('.').pop()?.toLowerCase() ?? 'jpg';
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      set.status = 400; return { error: 'Invalid file type' };
    }
    if (file.size > 5 * 1024 * 1024) { set.status = 400; return { error: 'File too large (max 5MB)' }; }

    const uploadDir = join(process.cwd(), 'storage', 'chat');
    await mkdir(uploadDir, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
    return { url: `/chat/${filename}` };
  }, {
    body: t.Object({ file: t.File() }),
  })

  // WS /cabinet/chat/ws/:orderId/:carrierId
  .ws('/ws/:orderId/:carrierId', {
    async open(ws) {
      const user = (ws.data as any).user;
      const { orderId, carrierId } = ws.data.params as any;
      if (!user || !orderId || !carrierId) { ws.close(); return; }
      const ok = await canAccess(user.id, user.role!, orderId, carrierId);
      if (!ok) { ws.close(); return; }
      const key = roomKey(orderId, carrierId);
      if (!rooms.has(key)) rooms.set(key, new Set());
      rooms.get(key)!.add(ws);
    },

    async message(ws, raw: any) {
      const user = (ws.data as any).user;
      const { orderId, carrierId } = ws.data.params as any;
      if (!user || !orderId || !carrierId) return;

      let msg: any;
      try { msg = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return; }

      const key = roomKey(orderId, carrierId);

      if (msg?.type === 'message') {
        const content = (msg.content as string)?.trim() ?? '';
        const attachmentUrls = Array.isArray(msg.attachments) ? msg.attachments : [];
        if (!content && attachmentUrls.length === 0) return;

        const [saved] = await db.insert(orderMessages).values({
          orderId,
          carrierProfileId: carrierId,
          senderId: user.id,
          message: content || '[Фото]',
          attachments: attachmentUrls.length ? { urls: attachmentUrls } : null,
        }).returning();

        const payload = JSON.stringify({
          type: 'message',
          message: {
            id: saved.id,
            orderId,
            userId: user.id,
            content: saved.message,
            attachments: signAttachmentUrls(attachmentUrls),
            createdAt: saved.createdAt?.toISOString(),
            user: { id: user.id, name: user.name },
          },
        });
        rooms.get(key)?.forEach(conn => { try { conn.send(payload); } catch {} });

        // NOTE: do NOT auto-update read cursor for in-room receivers here.
        // Read state is owned by explicit GET /messages and POST /mark-read calls from
        // the active client. Auto-marking on every WS broadcast caused a race:
        // a message could arrive between the client's ws.close() and the backend
        // processing that close, leaving a stale "in-room" entry whose cursor would
        // get bumped to the new message's time — and the badge would never show.

        // Notify the other participant only (sender doesn't need a badge refresh)
        const notifyPayload = JSON.stringify({ type: 'refresh' });
        const [orderRow] = await db.select({ clientProfileId: orders.clientProfileId })
          .from(orders).where(eq(orders.id, orderId)).limit(1);
        if (orderRow) {
          const [cp] = await db.select({ userId: clientProfiles.userId })
            .from(clientProfiles).where(eq(clientProfiles.id, orderRow.clientProfileId)).limit(1);
          const [carrier] = await db.select({ userId: carrierProfiles.userId })
            .from(carrierProfiles).where(eq(carrierProfiles.id, carrierId)).limit(1);
          for (const uid of [cp?.userId, carrier?.userId]) {
            if (uid && uid !== user.id) {
              notifyConns.get(uid)?.forEach(c => { try { c.send(notifyPayload); } catch {} });
            }
          }
        }
      }

      if (msg?.type === 'typing') {
        const payload = JSON.stringify({ type: 'typing', userId: user.id, name: user.name });
        rooms.get(key)?.forEach(conn => { if (conn !== ws) { try { conn.send(payload); } catch {} } });
      }

      if (msg?.type === 'stop_typing') {
        const payload = JSON.stringify({ type: 'stop_typing', userId: user.id });
        rooms.get(key)?.forEach(conn => { if (conn !== ws) { try { conn.send(payload); } catch {} } });
      }
    },

    close(ws) {
      const { orderId, carrierId } = ws.data.params as any;
      if (orderId && carrierId) {
        const key = roomKey(orderId, carrierId);
        rooms.get(key)?.delete(ws);
        if ((rooms.get(key)?.size ?? 0) === 0) rooms.delete(key);
      }
    },
  })

  // WS /cabinet/chat/ws/notify — user-level badge refresh channel
  .ws('/ws/notify', {
    open(ws) {
      const user = (ws.data as any).user;
      if (!user) { ws.close(); return; }
      if (!notifyConns.has(user.id)) notifyConns.set(user.id, new Set());
      notifyConns.get(user.id)!.add(ws);
    },
    message() {},
    close(ws) {
      const user = (ws.data as any).user;
      if (user) {
        notifyConns.get(user.id)?.delete(ws);
        if ((notifyConns.get(user.id)?.size ?? 0) === 0) notifyConns.delete(user.id);
      }
    },
  });
