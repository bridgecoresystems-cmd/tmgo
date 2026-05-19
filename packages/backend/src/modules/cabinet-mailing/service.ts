import { db } from '../../db';
import { mailingMessages, mailingRecipients, users } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function listInbox(userId: string) {
  const rows = await db
    .select({
      id: mailingMessages.id,
      title: mailingMessages.title,
      content: mailingMessages.content,
      sentAt: mailingMessages.sentAt,
      isRead: mailingRecipients.isRead,
      readAt: mailingRecipients.readAt,
      receivedAt: mailingRecipients.receivedAt,
      createdByName: users.name,
    })
    .from(mailingRecipients)
    .innerJoin(mailingMessages, eq(mailingRecipients.messageId, mailingMessages.id))
    .leftJoin(users, eq(mailingMessages.createdById, users.id))
    .where(eq(mailingRecipients.recipientId, userId))
    .orderBy(desc(mailingMessages.sentAt));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    is_read: r.isRead,
    sent_at: r.sentAt?.toISOString() ?? null,
    read_at: r.readAt?.toISOString() ?? null,
    received_at: r.receivedAt?.toISOString(),
    sender: r.createdByName || 'Администрация',
  }));
}

export async function markAllRead(userId: string) {
  await db
    .update(mailingRecipients)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(mailingRecipients.recipientId, userId));
  return { success: true };
}

export async function markRead(userId: string, messageId: string) {
  await db
    .update(mailingRecipients)
    .set({ isRead: true, readAt: new Date() })
    .where(and(
      eq(mailingRecipients.messageId, parseInt(messageId)),
      eq(mailingRecipients.recipientId, userId),
    ));
  return { success: true };
}
