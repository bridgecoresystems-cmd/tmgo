import { Elysia } from 'elysia';
import { db } from '../../db';
import { mailingMessages, mailingRecipients, users } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

export const cabinetMailingRoutes = new Elysia({ prefix: '/cabinet/mailing' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { user };
  })
  .get('/', async ({ user }) => {
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
      .where(eq(mailingRecipients.recipientId, user.id))
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
  })
  .post('/read-all', async ({ user }) => {
    await db
      .update(mailingRecipients)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(mailingRecipients.recipientId, user.id));
    return { success: true };
  })
  .post('/:id/read', async ({ user, params }) => {
    await db
      .update(mailingRecipients)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(mailingRecipients.messageId, parseInt(params.id)),
          eq(mailingRecipients.recipientId, user.id)
        )
      );
    return { success: true };
  });
