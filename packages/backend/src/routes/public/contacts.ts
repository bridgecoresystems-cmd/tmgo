import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { contactMessages } from '../../db/schema';

export const publicContactsRoutes = new Elysia({ prefix: '/public/contacts' })
  .post('', async ({ body, set }) => {
    try {
      const { name, email, message } = body as { name: string, email: string, message: string };
      
      if (!name || !email || !message) {
        set.status = 400;
        return { error: 'Missing fields' };
      }

      await db.insert(contactMessages).values({
        name,
        email,
        message,
      });
      return { success: true };
    } catch (e: any) {
      console.error('Failed to save contact message', e);
      await Bun.write('error_log_public.txt', e.stack || e.message);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String(),
      message: t.String(),
    })
  });
