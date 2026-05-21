import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { db } from '../../db';
import {
  orders,
  orderMessages,
  orderBids,
  carrierProfiles,
  clientProfiles,
  users,
  chatReadCursors,
} from '../../db/schema';
import { signAttachmentUrls } from '../../lib/chat-attachments';
import { Forbidden, BadRequest } from '../../lib/errors';

export async function getClientProfileId(userId: string): Promise<string | null> {
  const [p] = await db.select({ id: clientProfiles.id }).from(clientProfiles)
    .where(eq(clientProfiles.userId, userId)).limit(1);
  return p?.id ?? null;
}

export async function getCarrierProfileId(userId: string): Promise<string | null> {
  const [p] = await db.select({ id: carrierProfiles.id }).from(carrierProfiles)
    .where(eq(carrierProfiles.userId, userId)).limit(1);
  return p?.id ?? null;
}

// Client can access (orderId, carrierId) if they own the order.
// Driver can access if their carrierProfileId === carrierId AND they have a bid on the order.
export async function canAccess(
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

// Client: список заказов, у которых есть хотя бы один чат с водителем, сгруппировано по заказу.
export async function listClientRooms(userId: string) {
  const clientProfileId = await getClientProfileId(userId);
  if (!clientProfileId) throw new Forbidden();

  // All orders belonging to this client
  const myOrders = await db.select({
    id: orders.id,
    seqNo: orders.seqNo,
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
      eq(chatReadCursors.userId, userId),
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
    if (m.senderId !== userId && (!lastRead || m.createdAt > lastRead)) {
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
          createdAt: last.createdAt,
          unreadCount: last.unreadCount,
        };
      });
      // Sort drivers by latest message
      drivers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return {
        ...o,
        seqNo: o.seqNo,
        drivers,
      };
    });

  return { orders: result };
}

// Client: все ставки по заказу + инфо о перевозчике и превью последнего сообщения.
export async function listBidRooms(userId: string, orderId: string) {
  const clientProfileId = await getClientProfileId(userId);
  if (!clientProfileId) throw new Forbidden();

  const [order] = await db.select({ id: orders.id, clientProfileId: orders.clientProfileId })
    .from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.clientProfileId !== clientProfileId) throw new Forbidden();

  const bids = await db.select({
    id: orderBids.id,
    carrierProfileId: orderBids.carrierProfileId,
    amount: orderBids.amount,
    currency: orderBids.currency,
    status: orderBids.status,
    comment: orderBids.comment,
    createdAt: orderBids.createdAt,
  }).from(orderBids).where(eq(orderBids.orderId, orderId));

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
      eq(orderMessages.orderId, orderId),
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
}

// Driver: заказы, где клиент начал чат (есть сообщения) со мной.
export async function listDriverRooms(userId: string) {
  const carrierId = await getCarrierProfileId(userId);
  if (!carrierId) throw new Forbidden();

  const msgs = await db.select({
    orderId: orderMessages.orderId,
  }).from(orderMessages)
    .where(eq(orderMessages.carrierProfileId as any, carrierId));

  const orderIds = [...new Set(msgs.map(m => m.orderId))];
  if (orderIds.length === 0) return { rooms: [] };

  const orderRows = await db.select({
    id: orders.id,
    seqNo: orders.seqNo,
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
      eq(chatReadCursors.userId, userId),
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
    if (m.senderId !== userId && (!lastRead || m.createdAt > lastRead)) {
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
      seqNo: order.seqNo,
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
}

// COALESCE на max(created_at) комнаты — курсор на самое свежее сообщение или now().
function cursorSqlFor(orderId: string, carrierId: string) {
  return sql`COALESCE((SELECT max(created_at) FROM order_messages WHERE order_id = ${orderId} AND carrier_profile_id = ${carrierId}), now())`;
}

async function upsertReadCursor(userId: string, orderId: string, carrierId: string) {
  const cursorSql = cursorSqlFor(orderId, carrierId);
  await db.insert(chatReadCursors).values({
    userId,
    orderId,
    carrierProfileId: carrierId,
    lastReadAt: cursorSql,
  }).onConflictDoUpdate({
    target: [chatReadCursors.userId, chatReadCursors.orderId, chatReadCursors.carrierProfileId],
    set: { lastReadAt: cursorSql },
  });
}

// История сообщений комнаты + отметка «прочитано». Доступ проверяет вызывающий (canAccess).
export async function getMessages(userId: string, orderId: string, carrierId: string) {
  await upsertReadCursor(userId, orderId, carrierId);

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
      eq(orderMessages.orderId, orderId),
      eq(orderMessages.carrierProfileId as any, carrierId),
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
}

// Awaitable cursor update — вызывается перед перезагрузкой бейджей, чтобы избежать гонки.
export async function markRead(userId: string, orderId: string, carrierId: string) {
  await upsertReadCursor(userId, orderId, carrierId);
  return { ok: true };
}

export async function saveChatUpload(file: File) {
  if (!file || !file.size) throw new BadRequest('No file');
  const ext = (file.name ?? '').split('.').pop()?.toLowerCase() ?? 'jpg';
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    throw new BadRequest('Invalid file type');
  }
  if (file.size > 5 * 1024 * 1024) throw new BadRequest('File too large (max 5MB)');

  const uploadDir = join(process.cwd(), 'storage', 'chat');
  await mkdir(uploadDir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `/chat/${filename}` };
}

// Сохранить сообщение чата (вызывается из WS-хендлера).
export async function saveMessage(
  orderId: string,
  carrierId: string,
  senderId: string,
  content: string,
  attachmentUrls: string[],
) {
  const [saved] = await db.insert(orderMessages).values({
    orderId,
    carrierProfileId: carrierId,
    senderId,
    message: content || '[Фото]',
    attachments: attachmentUrls.length ? { urls: attachmentUrls } : null,
  }).returning();
  return saved;
}

// userId обоих участников комнаты (клиент заказа + перевозчик) для badge-уведомлений.
export async function getRoomParticipantUserIds(orderId: string, carrierId: string): Promise<string[]> {
  const [orderRow] = await db.select({ clientProfileId: orders.clientProfileId })
    .from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!orderRow) return [];
  const [cp] = await db.select({ userId: clientProfiles.userId })
    .from(clientProfiles).where(eq(clientProfiles.id, orderRow.clientProfileId)).limit(1);
  const [carrier] = await db.select({ userId: carrierProfiles.userId })
    .from(carrierProfiles).where(eq(carrierProfiles.id, carrierId)).limit(1);
  return [cp?.userId, carrier?.userId].filter(Boolean) as string[];
}
