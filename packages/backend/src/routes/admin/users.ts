import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const adminUsersRoutes = new Elysia({ prefix: '/admin/users' })
  .get('/', async () => {
    const list = await db.select().from(users).orderBy(users.createdAt);
    return list;
  })
  .get('/:id', async ({ params, error }) => {
    const [found] = await db.select().from(users).where(eq(users.id, params.id));
    if (!found) return error(404, 'User not found');
    return found;
  })
  .patch('/:id', async ({ params, body, error }) => {
    const [updated] = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, params.id))
      .returning();
    if (!updated) return error(404, 'User not found');
    return updated;
  }, {
    body: t.Object({
      role: t.Optional(t.Union([
        t.Literal('client'),
        t.Literal('driver'),
        t.Literal('dispatcher'),
        t.Literal('admin'),
      ])),
      name: t.Optional(t.String()),
    }),
  })
  .delete('/:id', async ({ params, error }) => {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, params.id))
      .returning();
    if (!deleted) return error(404, 'User not found');
    return { success: true };
  });
