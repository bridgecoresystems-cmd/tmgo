import { db } from '../../db';
import { profileChangeRequests } from '../../db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { BadRequest, NotFound } from '../../lib/errors';

const VALID_FIELD_KEYS = [
  'surname', 'given_name', 'patronymic', 'date_of_birth', 'gender',
  'passport:add', 'passport:renew', 'drivers_license:renew', 'medical_certificate:renew', 'medical_certificate:add',
  'visa:add', 'tachograph_card:add', 'technical_minimum_cert:add', 'adr_certificate:add', 'insurance:add', 'entry_permit:add',
  'citizenship:add', 'citizenship:revoke', 'identity_correction',
] as const;

const LOCKED_STATUSES = ['submitted', 'verified', 'suspended', 'waiting_verification', 'request'];

function formatRequest(r: typeof profileChangeRequests.$inferSelect) {
  const d = (x: Date | null | undefined) => (x ? new Date(x).toISOString().slice(0, 10) : null);
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

export async function listChangeRequests(carrierId: string) {
  const list = await db
    .select()
    .from(profileChangeRequests)
    .where(eq(profileChangeRequests.carrierId, carrierId))
    .orderBy(desc(profileChangeRequests.requestedAt));
  return list.map(formatRequest);
}

export async function listUnlockedKeys(carrierId: string) {
  const now = new Date();
  const unlocked = await db
    .select({
      fieldKey: profileChangeRequests.fieldKey,
      unlockedUntil: profileChangeRequests.unlockedUntil,
    })
    .from(profileChangeRequests)
    .where(and(
      eq(profileChangeRequests.carrierId, carrierId),
      eq(profileChangeRequests.status, 'approved'),
      gt(profileChangeRequests.unlockedUntil, now),
    ));
  const unlocked_keys = unlocked.map((u) => u.fieldKey);
  const expires_at: Record<string, string> = {};
  for (const u of unlocked) {
    if (u.unlockedUntil) expires_at[u.fieldKey] = new Date(u.unlockedUntil).toISOString().slice(0, 10);
  }
  return { unlocked_keys, expires_at };
}

export async function createChangeRequest(
  carrier: { id: string; verificationStatus?: string | null },
  input: { field_key: string; reason: string; requested_value?: string | null; current_value?: string | null },
) {
  const vStatus = carrier.verificationStatus ?? 'not_submitted';
  if (!LOCKED_STATUSES.includes(vStatus)) {
    throw new BadRequest('Запрос на изменение нужен только после верификации. Сначала отправьте карточку.');
  }

  const fieldKey = input.field_key;
  if (!VALID_FIELD_KEYS.includes(fieldKey as (typeof VALID_FIELD_KEYS)[number])) {
    throw new BadRequest('Неизвестный тип запроса');
  }

  if (!input.reason || typeof input.reason !== 'string' || !input.reason.trim()) {
    throw new BadRequest('Укажите причину запроса');
  }

  const [existing] = await db
    .select()
    .from(profileChangeRequests)
    .where(and(
      eq(profileChangeRequests.carrierId, carrier.id),
      eq(profileChangeRequests.fieldKey, fieldKey),
      eq(profileChangeRequests.status, 'pending'),
    ))
    .limit(1);
  if (existing) throw new BadRequest('Запрос на это изменение уже отправлен');

  const [req] = await db
    .insert(profileChangeRequests)
    .values({
      carrierId: carrier.id,
      fieldKey,
      currentValue: input.current_value ?? null,
      requestedValue: input.requested_value ?? null,
      reason: input.reason.trim(),
      status: 'pending',
    })
    .returning();

  return formatRequest(req!);
}

export async function cancelChangeRequest(carrierId: string, requestId: string) {
  const [existing] = await db
    .select()
    .from(profileChangeRequests)
    .where(and(
      eq(profileChangeRequests.id, requestId),
      eq(profileChangeRequests.carrierId, carrierId),
    ))
    .limit(1);
  if (!existing) throw new NotFound('Запрос не найден');
  if (existing.status !== 'pending') throw new BadRequest('Можно отозвать только ожидающий запрос');

  await db
    .update(profileChangeRequests)
    .set({ status: 'cancelled' })
    .where(eq(profileChangeRequests.id, requestId));
  return { success: true, status: 'cancelled' };
}
