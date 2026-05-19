import { db } from '../../db';
import { mailingMessages, mailingRecipients, users } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { NotFound, BadRequest } from '../../lib/errors';

const recipientTypeLabels: Record<string, string> = {
  all: 'Все',
  client: 'Заказчики',
  driver: 'Перевозчики',
};

function formatMessage(r: {
  id: number; title: string; content: string; recipientType: string;
  scheduledAt: Date | null; sentAt: Date | null; isSent: boolean;
  totalRecipients: number | null; createdAt: Date | null; createdByName: string | null;
}) {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    recipient_type: r.recipientType,
    recipient_type_display: recipientTypeLabels[r.recipientType] || r.recipientType,
    created_by_name: r.createdByName,
    scheduled_at: r.scheduledAt?.toISOString() ?? null,
    sent_at: r.sentAt?.toISOString() ?? null,
    is_sent: r.isSent,
    total_recipients: r.totalRecipients,
    created_at: r.createdAt?.toISOString(),
  };
}

const messageColumns = {
  id: mailingMessages.id,
  title: mailingMessages.title,
  content: mailingMessages.content,
  recipientType: mailingMessages.recipientType,
  scheduledAt: mailingMessages.scheduledAt,
  sentAt: mailingMessages.sentAt,
  isSent: mailingMessages.isSent,
  totalRecipients: mailingMessages.totalRecipients,
  createdAt: mailingMessages.createdAt,
  createdByName: users.name,
};

export async function listMessages() {
  const rows = await db
    .select(messageColumns)
    .from(mailingMessages)
    .leftJoin(users, eq(mailingMessages.createdById, users.id))
    .orderBy(desc(mailingMessages.createdAt));
  return rows.map(formatMessage);
}

// Возвращает null если не найдено — route отдаёт 404 голой строкой (contract 1:1).
export async function getMessage(id: string) {
  const [msg] = await db
    .select(messageColumns)
    .from(mailingMessages)
    .leftJoin(users, eq(mailingMessages.createdById, users.id))
    .where(eq(mailingMessages.id, parseInt(id)));
  return msg ? formatMessage(msg) : null;
}

export async function createMessage(userId: string, body: {
  title: string; content: string; recipient_type?: string; scheduled_at?: string | null;
}) {
  const title = body.title?.trim();
  const content = body.content?.trim();
  const recipientType = body.recipient_type || 'all';
  const scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : null;

  // Историческое поведение: plain Error → дефолтный обработчик Elysia (не AppError).
  if (!title || !content) throw new Error('title and content are required');

  const [created] = await db
    .insert(mailingMessages)
    .values({
      title,
      content,
      recipientType,
      createdById: userId,
      scheduledAt,
      isSent: false,
      totalRecipients: 0,
    })
    .returning();

  return {
    id: created.id,
    title: created.title,
    content: created.content,
    recipient_type: created.recipientType,
    is_sent: false,
    total_recipients: 0,
    created_at: created.createdAt?.toISOString(),
  };
}

export async function sendMessage(id: string) {
  const [msg] = await db.select().from(mailingMessages)
    .where(eq(mailingMessages.id, parseInt(id))).limit(1);

  if (!msg) throw new NotFound('Not found');
  if (msg.isSent) throw new BadRequest('Message already sent');

  const allUsers = await db.select({ id: users.id, role: users.role }).from(users);
  let targetUserIds: string[];
  if (msg.recipientType === 'client') {
    targetUserIds = allUsers.filter((u) => u.role === 'client').map((u) => u.id);
  } else if (msg.recipientType === 'driver') {
    targetUserIds = allUsers.filter((u) => u.role === 'driver').map((u) => u.id);
  } else {
    targetUserIds = allUsers.filter((u) => u.role === 'client' || u.role === 'driver').map((u) => u.id);
  }

  for (const rid of targetUserIds) {
    await db.insert(mailingRecipients).values({
      messageId: msg.id,
      recipientId: rid,
      isRead: false,
    });
  }

  await db
    .update(mailingMessages)
    .set({ isSent: true, sentAt: new Date(), totalRecipients: targetUserIds.length })
    .where(eq(mailingMessages.id, msg.id));

  return { message: 'Sent', total_recipients: targetUserIds.length };
}

// Возвращает null если не найдено — route отдаёт 404 голой строкой (contract 1:1).
export async function deleteMessage(id: string) {
  const [msg] = await db.select().from(mailingMessages)
    .where(eq(mailingMessages.id, parseInt(id))).limit(1);
  if (!msg) return null;

  await db.delete(mailingRecipients).where(eq(mailingRecipients.messageId, parseInt(id)));
  await db.delete(mailingMessages).where(eq(mailingMessages.id, parseInt(id)));
  return { message: 'Deleted' };
}
