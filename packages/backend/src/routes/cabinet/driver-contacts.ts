import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { carrierProfiles, driverContacts } from '../../db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

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

export const cabinetDriverContactsRoutes = new Elysia({ prefix: '/cabinet/driver/contacts' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'driver') {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    let [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, user.id)).limit(1);
    if (!profile) {
      const [created] = await db.insert(carrierProfiles).values({ userId: user.id }).returning();
      profile = created!;
    }
    return { user, carrierProfile: profile };
  })

  // GET /cabinet/driver/contacts — список активных доп. контактов
  .get('/', async ({ carrierProfile }) => {
    const list = await db
      .select()
      .from(driverContacts)
      .where(and(
        eq(driverContacts.carrierId, carrierProfile.id),
        isNull(driverContacts.deletedAt),
      ))
      .orderBy(desc(driverContacts.createdAt));
    return list.map(formatContact);
  })

  // POST /cabinet/driver/contacts — добавить контакт
  // Дополнительные контакты водитель добавляет свободно в любой момент
  .post('/', async ({ carrierProfile, body }) => {
    const b = body as any;
    const [contact] = await db.insert(driverContacts).values({
      carrierId: carrierProfile.id,
      contactType: b.contact_type,
      value: b.value,
      label: b.label || null,
      isActive: true,
    }).returning();
    return formatContact(contact!);
  }, {
    body: t.Object({
      contact_type: t.Union([t.Literal('phone'), t.Literal('email')]),
      value: t.String(),
      label: t.Optional(t.Nullable(t.String())),
    }),
  })

  // PATCH /cabinet/driver/contacts/:id — изменить метку
  .patch('/:id', async ({ carrierProfile, params, body, set }) => {
    const [existing] = await db
      .select()
      .from(driverContacts)
      .where(and(
        eq(driverContacts.id, params.id),
        eq(driverContacts.carrierId, carrierProfile.id),
        isNull(driverContacts.deletedAt),
      ))
      .limit(1);
    if (!existing) { set.status = 404; return { error: 'Контакт не найден' }; }

    const b = body as any;
    const updateData: Record<string, any> = {};
    if (b.value !== undefined) updateData.value = b.value;
    if (b.label !== undefined) updateData.label = b.label;
    if (b.is_active !== undefined) updateData.isActive = b.is_active;

    const [updated] = await db
      .update(driverContacts)
      .set(updateData)
      .where(eq(driverContacts.id, params.id))
      .returning();
    return formatContact(updated!);
  }, {
    body: t.Object({
      value: t.Optional(t.String()),
      label: t.Optional(t.Nullable(t.String())),
      is_active: t.Optional(t.Boolean()),
    }),
  })

  // DELETE /cabinet/driver/contacts/:id — soft delete
  .delete('/:id', async ({ carrierProfile, params, set }) => {
    const [existing] = await db
      .select()
      .from(driverContacts)
      .where(and(
        eq(driverContacts.id, params.id),
        eq(driverContacts.carrierId, carrierProfile.id),
        isNull(driverContacts.deletedAt),
      ))
      .limit(1);
    if (!existing) { set.status = 404; return { error: 'Контакт не найден' }; }

    await db
      .update(driverContacts)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(driverContacts.id, existing.id));

    return { success: true, id: existing.id };
  });
