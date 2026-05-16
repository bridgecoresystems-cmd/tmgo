import { Elysia } from 'elysia';
import { db } from '../../db';
import { contactMessages } from '../../db/schema';
import { desc, eq } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

export const adminContactsRoutes = new Elysia({ prefix: '/admin/contacts' })
  .get('', async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    try {
      const messages = await db.select()
        .from(contactMessages)
        .orderBy(desc(contactMessages.createdAt));

      return messages;
    } catch (error: any) {
      console.error('Error in admin contacts route:', error);
      set.status = 500;
      return { error: error.message };
    }
  })
  .patch('/:id/status', async ({ request, params, body, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const { status } = body as { status: string };
    await db.update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, params.id));

    return { success: true };
  });
