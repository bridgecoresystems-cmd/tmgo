import { db } from '../../db';
import { cities } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';

type CityInsert = typeof cities.$inferInsert;

export function listAllCities() {
  return db.select().from(cities).orderBy(asc(cities.sortOrder), asc(cities.name));
}

export function listActiveCities() {
  return db
    .select()
    .from(cities)
    .where(eq(cities.isActive, true))
    .orderBy(asc(cities.sortOrder), asc(cities.name));
}

export async function createCity(body: CityInsert) {
  const [created] = await db.insert(cities).values(body).returning();
  return created;
}

export async function updateCity(id: string, body: Partial<CityInsert>) {
  const [updated] = await db
    .update(cities)
    .set(body)
    .where(eq(cities.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteCity(id: string) {
  const [deleted] = await db
    .delete(cities)
    .where(eq(cities.id, id))
    .returning();
  return deleted ?? null;
}
