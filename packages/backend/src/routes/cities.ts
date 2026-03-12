import { Elysia, t } from 'elysia';
import { db } from '../db';
import { cities } from '../db/schema';
import { eq } from 'drizzle-orm';

export const cityRoutes = new Elysia({ prefix: '/cities' })
  .get('/', async () => {
    return await db.select().from(cities).where(eq(cities.isActive, true));
  })
  .post('/', async ({ body }) => {
    return await db.insert(cities).values(body).returning();
  }, {
    body: t.Object({
      name: t.String(),
      type: t.String({ default: 'BOTH' })
    })
  })
  .delete('/:id', async ({ params: { id } }) => {
    return await db.delete(cities).where(eq(cities.id, id)).returning();
  });
