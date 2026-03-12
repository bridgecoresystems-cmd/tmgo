import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { mailingMessages, mailingRecipients, users } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

const recipientTypeLabels: Record<string, string> = {
  all: 'Все',
  client: 'Заказчики',
  driver: 'Перевозчики',
};

export const adminMailingRoutes = new Elysia({ prefix: '/admin/mailing' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { user };
  })
  .get('/', async () => {
    const rows = await db
      .select({
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
      })
      .from(mailingMessages)
      .leftJoin(users, eq(mailingMessages.createdById, users.id))
      .orderBy(desc(mailingMessages.createdAt));

    return rows.map((r) => ({
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
    }));
  })
  .get('/:id', async ({ params, error }) => {
    const [msg] = await db
      .select({
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
      })
      .from(mailingMessages)
      .leftJoin(users, eq(mailingMessages.createdById, users.id))
      .where(eq(mailingMessages.id, parseInt(params.id)));

    if (!msg) return error(404, 'Not found');

    return {
      id: msg.id,
      title: msg.title,
      content: msg.content,
      recipient_type: msg.recipientType,
      recipient_type_display: recipientTypeLabels[msg.recipientType] || msg.recipientType,
      created_by_name: msg.createdByName,
      scheduled_at: msg.scheduledAt?.toISOString() ?? null,
      sent_at: msg.sentAt?.toISOString() ?? null,
      is_sent: msg.isSent,
      total_recipients: msg.totalRecipients,
      created_at: msg.createdAt?.toISOString(),
    };
  })
  .post('/', async ({ user, body }) => {
    const title = (body.title as string)?.trim();
    const content = (body.content as string)?.trim();
    const recipientType = (body.recipient_type as string) || 'all';
    const scheduledAt = body.scheduled_at ? new Date(body.scheduled_at as string) : null;

    if (!title || !content) throw new Error('title and content are required');

    const [created] = await db
      .insert(mailingMessages)
      .values({
        title,
        content,
        recipientType,
        createdById: user.id,
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
  }, {
    body: t.Object({
      title: t.String(),
      content: t.String(),
      recipient_type: t.Optional(t.String()),
      scheduled_at: t.Optional(t.Nullable(t.String())),
    }),
  })
  .post('/:id/send', async ({ params, set }) => {
    const [msg] = await db.select().from(mailingMessages).where(eq(mailingMessages.id, parseInt(params.id))).limit(1);

    if (!msg) {
      set.status = 404;
      return { error: 'Not found' };
    }
    if (msg.isSent) {
      set.status = 400;
      return { error: 'Message already sent' };
    }

    let targetUserIds: string[] = [];
    const allUsers = await db.select({ id: users.id, role: users.role }).from(users);

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
  })
  .delete('/:id', async ({ params, error }) => {
    const [msg] = await db.select().from(mailingMessages).where(eq(mailingMessages.id, parseInt(params.id))).limit(1);
    if (!msg) return error(404, 'Not found');

    await db.delete(mailingRecipients).where(eq(mailingRecipients.messageId, parseInt(params.id)));
    await db.delete(mailingMessages).where(eq(mailingMessages.id, parseInt(params.id)));
    return { message: 'Deleted' };
  });
