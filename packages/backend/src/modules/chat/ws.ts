import { signAttachmentUrls } from '../../lib/chat-attachments';
import { canAccess, saveMessage, getRoomParticipantUserIds } from './service';

// room key = orderId:carrierProfileId
const rooms = new Map<string, Set<any>>();
// userId → WS connections for badge notifications
const notifyConns = new Map<string, Set<any>>();

function roomKey(orderId: string, carrierId: string) {
  return `${orderId}:${carrierId}`;
}

// WS /cabinet/chat/ws/:orderId/:carrierId — комната конкретной пары заказ+перевозчик.
export const roomWsHandler = {
  async open(ws: any) {
    const user = (ws.data as any).user;
    const { orderId, carrierId } = ws.data.params as any;
    if (!user || !orderId || !carrierId) { ws.close(); return; }
    const ok = await canAccess(user.id, user.role!, orderId, carrierId);
    if (!ok) { ws.close(); return; }
    const key = roomKey(orderId, carrierId);
    if (!rooms.has(key)) rooms.set(key, new Set());
    rooms.get(key)!.add(ws);
  },

  async message(ws: any, raw: any) {
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

      const saved = await saveMessage(orderId, carrierId, user.id, content, attachmentUrls);

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
      const participantIds = await getRoomParticipantUserIds(orderId, carrierId);
      for (const uid of participantIds) {
        if (uid !== user.id) {
          notifyConns.get(uid)?.forEach(c => { try { c.send(notifyPayload); } catch {} });
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

  close(ws: any) {
    const { orderId, carrierId } = ws.data.params as any;
    if (orderId && carrierId) {
      const key = roomKey(orderId, carrierId);
      rooms.get(key)?.delete(ws);
      if ((rooms.get(key)?.size ?? 0) === 0) rooms.delete(key);
    }
  },
};

// WS /cabinet/chat/ws/notify — user-level badge refresh channel.
export const notifyWsHandler = {
  open(ws: any) {
    const user = (ws.data as any).user;
    if (!user) { ws.close(); return; }
    if (!notifyConns.has(user.id)) notifyConns.set(user.id, new Set());
    notifyConns.get(user.id)!.add(ws);
  },
  message() {},
  close(ws: any) {
    const user = (ws.data as any).user;
    if (user) {
      notifyConns.get(user.id)?.delete(ws);
      if ((notifyConns.get(user.id)?.size ?? 0) === 0) notifyConns.delete(user.id);
    }
  },
};
