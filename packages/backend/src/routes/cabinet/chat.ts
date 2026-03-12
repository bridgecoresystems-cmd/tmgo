import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { orders, orderMessages, orderResponses, carrierProfiles, users } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const rooms = new Map<string, Set<any>>();

async function canAccessOrderChat(userId: string, userRole: string, orderId: string): Promise<boolean> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return false;

  if (order.clientId === userId) return true;

  if (userRole === 'driver') {
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, userId)).limit(1);
    if (!profile) return false;
    if (order.carrierId === profile.id) return true;
    const [resp] = await db
      .select()
      .from(orderResponses)
      .where(and(eq(orderResponses.orderId, orderId), eq(orderResponses.carrierId, profile.id)))
      .limit(1);
    return !!resp;
  }
  return false;
}

async function getOtherPartyName(orderId: string, currentUserId: string): Promise<string> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return 'Чат';

  if (order.clientId === currentUserId) {
    if (order.carrierId) {
      const [carrier] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.id, order.carrierId)).limit(1);
      if (carrier) {
        const [u] = await db.select().from(users).where(eq(users.id, carrier.userId)).limit(1);
        return u?.name || carrier.companyName || 'Перевозчик';
      }
    }
    const [resp] = await db
      .select()
      .from(orderResponses)
      .where(eq(orderResponses.orderId, orderId))
      .limit(1);
    if (resp) {
      const [carrier] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.id, resp.carrierId)).limit(1);
      if (carrier) {
        const [u] = await db.select().from(users).where(eq(users.id, carrier.userId)).limit(1);
        return u?.name || carrier.companyName || 'Перевозчик';
      }
    }
    return 'Перевозчик';
  } else {
    const [order2] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (order2?.clientId) {
      const [u] = await db.select().from(users).where(eq(users.id, order2.clientId)).limit(1);
      return u?.name || 'Заказчик';
    }
    return 'Заказчик';
  }
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
  .get('/room/:orderId', async ({ user, params, set }) => {
    const ok = await canAccessOrderChat(user.id, user.role!, params.orderId);
    if (!ok) {
      set.status = 403;
      return { error: 'Forbidden' };
    }
    const title = await getOtherPartyName(params.orderId, user.id);
    return { id: params.orderId, orderId: params.orderId, title };
  })
  .get('/messages/:orderId', async ({ user, params, set }) => {
    const ok = await canAccessOrderChat(user.id, user.role!, params.orderId);
    if (!ok) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    const rows = await db
      .select({
        id: orderMessages.id,
        orderId: orderMessages.orderId,
        senderId: orderMessages.senderId,
        message: orderMessages.message,
        attachments: orderMessages.attachments,
        createdAt: orderMessages.createdAt,
        senderName: users.name,
      })
      .from(orderMessages)
      .leftJoin(users, eq(orderMessages.senderId, users.id))
      .where(eq(orderMessages.orderId, params.orderId))
      .orderBy(desc(orderMessages.createdAt))
      .limit(100);

    return rows.reverse().map((r) => ({
      id: r.id,
      orderId: r.orderId,
      userId: r.senderId,
      content: r.message,
      attachments: (r.attachments as { urls?: string[] })?.urls || [],
      createdAt: r.createdAt?.toISOString(),
      user: { id: r.senderId, name: r.senderName || 'Unknown' },
    }));
  })
  .post('/upload', async ({ user, body, set }) => {
    const file = body.file;
    if (!file || !file.size) {
      set.status = 400;
      return { error: 'No file' };
    }
    const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'jpg';
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      set.status = 400;
      return { error: 'Invalid file type' };
    }
    if (file.size > 5 * 1024 * 1024) {
      set.status = 400;
      return { error: 'File too large (max 5MB)' };
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'chat');
    await mkdir(uploadDir, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);
    const buf = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buf));

    const url = `/uploads/chat/${filename}`;
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
    }),
  })
  .ws('/ws/:orderId', {
    async open(ws) {
      const user = (ws.data as any).user;
      const orderId = (ws.data.params as any).orderId;
      if (!user || !orderId) {
        ws.close();
        return;
      }
      const ok = await canAccessOrderChat(user.id, user.role!, orderId);
      if (!ok) {
        ws.close();
        return;
      }
      if (!rooms.has(orderId)) rooms.set(orderId, new Set());
      rooms.get(orderId)!.add(ws);
    },

    async message(ws, raw: any) {
      const user = (ws.data as any).user;
      const orderId = (ws.data.params as any).orderId;
      if (!user || !orderId) return;

      let msg: any;
      try {
        msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        return;
      }

      if (msg?.type === 'message') {
        const content = (msg.content as string)?.trim() || '';
        const attachmentUrls = Array.isArray(msg.attachments) ? msg.attachments : [];

        if (!content && attachmentUrls.length === 0) return;

        const [saved] = await db
          .insert(orderMessages)
          .values({
            orderId,
            senderId: user.id,
            message: content || '[Фото]',
            attachments: attachmentUrls.length ? { urls: attachmentUrls } : null,
          })
          .returning();

        const payload = JSON.stringify({
          type: 'message',
          message: {
            id: saved.id,
            orderId,
            userId: user.id,
            content: saved.message,
            attachments: attachmentUrls,
            createdAt: saved.createdAt?.toISOString(),
            user: { id: user.id, name: user.name },
          },
        });

        rooms.get(orderId)?.forEach((conn) => {
          try {
            conn.send(payload);
          } catch {}
        });
      }

      if (msg?.type === 'typing') {
        const payload = JSON.stringify({
          type: 'typing',
          userId: user.id,
          name: user.name,
        });
        rooms.get(orderId)?.forEach((conn) => {
          if (conn !== ws) {
            try {
              conn.send(payload);
            } catch {}
          }
        });
      }

      if (msg?.type === 'stop_typing') {
        const payload = JSON.stringify({
          type: 'stop_typing',
          userId: user.id,
        });
        rooms.get(orderId)?.forEach((conn) => {
          if (conn !== ws) {
            try {
              conn.send(payload);
            } catch {}
          }
        });
      }
    },

    close(ws) {
      const orderId = (ws.data.params as any).orderId;
      if (orderId) {
        rooms.get(orderId)?.delete(ws);
        if ((rooms.get(orderId)?.size ?? 0) === 0) rooms.delete(orderId);
      }
    },
  });
