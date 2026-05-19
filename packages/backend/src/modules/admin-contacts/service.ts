import { db } from '../../db';
import { contactMessages } from '../../db/schema';
import { desc, eq } from 'drizzle-orm';

export function listContactMessages() {
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

export async function setContactStatus(id: string, status: string) {
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
  return { success: true };
}
