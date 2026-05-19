import { db } from '../../db';
import { driverContacts } from '../../db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { NotFound } from '../../lib/errors';

function formatContact(c: typeof driverContacts.$inferSelect) {
  return {
    id: c.id,
    carrier_id: c.carrierId,
    contact_type: c.contactType,
    value: c.value,
    label: c.label,
    is_active: c.isActive,
    created_at: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : null,
  };
}

export async function listContacts(carrierId: string) {
  const list = await db.select().from(driverContacts)
    .where(and(eq(driverContacts.carrierId, carrierId), isNull(driverContacts.deletedAt)))
    .orderBy(desc(driverContacts.createdAt));
  return list.map(formatContact);
}

export async function createContact(carrierId: string, input: {
  contact_type: 'phone' | 'email'; value: string; label?: string | null;
}) {
  const [contact] = await db.insert(driverContacts).values({
    carrierId,
    contactType: input.contact_type,
    value: input.value,
    label: input.label || null,
    isActive: true,
  }).returning();
  return formatContact(contact!);
}

async function findOwned(carrierId: string, id: string) {
  const [existing] = await db.select().from(driverContacts)
    .where(and(
      eq(driverContacts.id, id),
      eq(driverContacts.carrierId, carrierId),
      isNull(driverContacts.deletedAt),
    )).limit(1);
  if (!existing) throw new NotFound('Контакт не найден');
  return existing;
}

export async function updateContact(carrierId: string, id: string, input: {
  value?: string; label?: string | null; is_active?: boolean;
}) {
  await findOwned(carrierId, id);

  const updateData: Record<string, unknown> = {};
  if (input.value !== undefined) updateData.value = input.value;
  if (input.label !== undefined) updateData.label = input.label;
  if (input.is_active !== undefined) updateData.isActive = input.is_active;

  const [updated] = await db.update(driverContacts)
    .set(updateData)
    .where(eq(driverContacts.id, id))
    .returning();
  return formatContact(updated!);
}

export async function deleteContact(carrierId: string, id: string) {
  const existing = await findOwned(carrierId, id);
  await db.update(driverContacts)
    .set({ deletedAt: new Date(), isActive: false })
    .where(eq(driverContacts.id, existing.id));
  return { success: true, id: existing.id };
}
