import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { cities } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';

export const adminCitiesRoutes = new Elysia({ prefix: '/admin/cities' })
  .get('/', async () => {
    return db.select().from(cities).orderBy(asc(cities.sortOrder), asc(cities.name));
  })
  .post('/', async ({ body }) => {
    const [created] = await db.insert(cities).values(body).returning();
    return created;
  }, {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      type: t.Optional(t.String()),
      nameRu: t.Optional(t.String()),
      country: t.Optional(t.String()),
      region: t.Optional(t.String()),
      isActive: t.Optional(t.Boolean()),
      sortOrder: t.Optional(t.Number()),
    }),
  })
  .patch('/:id', async ({ params, body, error }) => {
    const [updated] = await db
      .update(cities)
      .set(body)
      .where(eq(cities.id, params.id))
      .returning();
    if (!updated) return error(404, 'City not found');
    return updated;
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      type: t.Optional(t.String()),
      nameRu: t.Optional(t.String()),
      country: t.Optional(t.String()),
      region: t.Optional(t.String()),
      isActive: t.Optional(t.Boolean()),
      sortOrder: t.Optional(t.Number()),
    }),
  })
  .delete('/:id', async ({ params, error }) => {
    const [deleted] = await db
      .delete(cities)
      .where(eq(cities.id, params.id))
      .returning();
    if (!deleted) return error(404, 'City not found');
    return { success: true };
  });

// Public endpoint для SearchBar
export const publicCitiesRoutes = new Elysia({ prefix: '/cities' })
  .get('/', async () => {
    return db
      .select()
      .from(cities)
      .where(eq(cities.isActive, true))
      .orderBy(asc(cities.sortOrder), asc(cities.name));
  });
