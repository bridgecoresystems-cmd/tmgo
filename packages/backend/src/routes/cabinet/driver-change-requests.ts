import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { carrierProfiles, profileChangeRequests } from '../../db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

const VALID_FIELD_KEYS = [
  'surname', 'given_name', 'patronymic', 'date_of_birth', 'gender',
  'passport:add', 'passport:renew', 'drivers_license:renew',   'medical_certificate:renew', 'medical_certificate:add',
  'visa:add', 'tachograph_card:add', 'technical_minimum_cert:add', 'adr_certificate:add', 'insurance:add', 'entry_permit:add',
  'citizenship:add', 'citizenship:revoke', 'identity_correction',
] as const;

function formatRequest(r: typeof profileChangeRequests.$inferSelect) {
  const d = (x: Date | null | undefined) => x ? new Date(x).toISOString().slice(0, 10) : null;
  return {
    id: r.id,
    field_key: r.fieldKey,
    current_value: r.currentValue,
    requested_value: r.requestedValue,
    reason: r.reason,
    status: r.status,
    admin_comment: r.adminComment,
    requested_at: d(r.requestedAt),
    resolved_at: d(r.resolvedAt),
    unlocked_until: d(r.unlockedUntil),
  };
}

export const cabinetDriverChangeRequestsRoutes = new Elysia({ prefix: '/cabinet/driver/change-requests' })
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

  // GET /cabinet/driver/change-requests — список своих запросов
  .get('/', async ({ carrierProfile }) => {
    const list = await db
      .select()
      .from(profileChangeRequests)
      .where(eq(profileChangeRequests.carrierId, carrierProfile.id))
      .orderBy(desc(profileChangeRequests.requestedAt));
    return list.map(formatRequest);
  })

  // GET /cabinet/driver/change-requests/unlocked — какие ключи разблокированы
  .get('/unlocked', async ({ carrierProfile }) => {
    const now = new Date();
    const unlocked = await db
      .select({
        fieldKey: profileChangeRequests.fieldKey,
        unlockedUntil: profileChangeRequests.unlockedUntil,
      })
      .from(profileChangeRequests)
      .where(and(
        eq(profileChangeRequests.carrierId, carrierProfile.id),
        eq(profileChangeRequests.status, 'approved'),
        gt(profileChangeRequests.unlockedUntil, now),
      ));
    const unlocked_keys = unlocked.map((u) => u.fieldKey);
    const expires_at: Record<string, string> = {};
    for (const u of unlocked) {
      if (u.unlockedUntil) expires_at[u.fieldKey] = new Date(u.unlockedUntil).toISOString().slice(0, 10);
    }
    return { unlocked_keys, expires_at };
  })

  // POST /cabinet/driver/change-requests — создать запрос
  .post('/', async ({ carrierProfile, body, set }) => {
    const vStatus = carrierProfile.verificationStatus ?? 'not_submitted';
    const isLocked = ['submitted', 'verified', 'suspended', 'waiting_verification', 'request'].includes(vStatus);
    if (!isLocked) {
      set.status = 400;
      return { error: 'Запрос на изменение нужен только после верификации. Сначала отправьте карточку.' };
    }

    const fieldKey = body.field_key as string;
    if (!VALID_FIELD_KEYS.includes(fieldKey as any)) {
      set.status = 400;
      return { error: 'Неизвестный тип запроса' };
    }

    if (!body.reason || typeof body.reason !== 'string' || !body.reason.trim()) {
      set.status = 400;
      return { error: 'Укажите причину запроса' };
    }

    // Проверка на дубликат pending
    const [existing] = await db
      .select()
      .from(profileChangeRequests)
      .where(and(
        eq(profileChangeRequests.carrierId, carrierProfile.id),
        eq(profileChangeRequests.fieldKey, fieldKey),
        eq(profileChangeRequests.status, 'pending'),
      ))
      .limit(1);
    if (existing) {
      set.status = 400;
      return { error: 'Запрос на это изменение уже отправлен' };
    }

    const [req] = await db
      .insert(profileChangeRequests)
      .values({
        carrierId: carrierProfile.id,
        fieldKey,
        currentValue: body.current_value ?? null,
        requestedValue: body.requested_value ?? null,
        reason: body.reason.trim(),
        status: 'pending',
      })
      .returning();

    return formatRequest(req!);
  }, {
    body: t.Object({
      field_key: t.String(),
      reason: t.String(),
      requested_value: t.Optional(t.Nullable(t.String())),
      current_value: t.Optional(t.Nullable(t.String())),
      attachment_url: t.Optional(t.Nullable(t.String())),
    }),
  })

  // DELETE /cabinet/driver/change-requests/:requestId — отозвать (только pending)
  .delete('/:requestId', async ({ carrierProfile, params, set }) => {
    const [existing] = await db
      .select()
      .from(profileChangeRequests)
      .where(and(
        eq(profileChangeRequests.id, params.requestId),
        eq(profileChangeRequests.carrierId, carrierProfile.id),
      ))
      .limit(1);
    if (!existing) {
      set.status = 404;
      return { error: 'Запрос не найден' };
    }
    if (existing.status !== 'pending') {
      set.status = 400;
      return { error: 'Можно отозвать только ожидающий запрос' };
    }
    await db
      .update(profileChangeRequests)
      .set({ status: 'cancelled' })
      .where(eq(profileChangeRequests.id, params.requestId));
    return { success: true, status: 'cancelled' };
  });
