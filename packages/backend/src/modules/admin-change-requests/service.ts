import { db } from '../../db';
import { carrierProfiles, profileChangeRequests } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { NotFound, BadRequest } from '../../lib/errors';

function formatRequest(r: typeof profileChangeRequests.$inferSelect, driverName: string | null) {
  const d = (x: Date | null | undefined) => (x ? new Date(x).toISOString().slice(0, 10) : null);
  return {
    id: r.id,
    carrier_id: r.carrierId,
    driver_name: driverName,
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

function driverName(s: string | null, g: string | null, p: string | null) {
  const parts = [s, g, p].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

export async function listChangeRequests(query: { status?: string; page?: string }) {
  const status = query.status ?? 'pending';
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const list = await db
    .select({
      request: profileChangeRequests,
      surname: carrierProfiles.surname,
      givenName: carrierProfiles.givenName,
      patronymic: carrierProfiles.patronymic,
      userId: carrierProfiles.userId,
    })
    .from(profileChangeRequests)
    .innerJoin(carrierProfiles, eq(profileChangeRequests.carrierId, carrierProfiles.id))
    .where(status === 'all' ? undefined : eq(profileChangeRequests.status, status))
    .orderBy(desc(profileChangeRequests.requestedAt))
    .limit(limit)
    .offset(offset);

  return list.map(({ request: r, surname, givenName, patronymic, userId }) => ({
    ...formatRequest(r, driverName(surname, givenName, patronymic)),
    user_id: userId,
  }));
}

async function findPending(requestId: string) {
  const [existing] = await db
    .select()
    .from(profileChangeRequests)
    .where(eq(profileChangeRequests.id, requestId))
    .limit(1);
  if (!existing) throw new NotFound('Запрос не найден');
  if (existing.status !== 'pending') throw new BadRequest('Запрос уже рассмотрен');
  return existing;
}

export async function approveChangeRequest(
  adminId: string,
  requestId: string,
  body: { comment?: string | null; unlock_days?: number },
) {
  await findPending(requestId);

  const unlockDays = body.unlock_days ?? 7;
  const unlockedUntil = new Date();
  unlockedUntil.setDate(unlockedUntil.getDate() + unlockDays);

  await db
    .update(profileChangeRequests)
    .set({
      status: 'approved',
      adminComment: body.comment ?? null,
      resolvedBy: adminId,
      resolvedAt: new Date(),
      unlockedUntil,
    })
    .where(eq(profileChangeRequests.id, requestId));

  return {
    success: true,
    status: 'approved',
    unlocked_until: unlockedUntil.toISOString().slice(0, 10),
  };
}

export async function rejectChangeRequest(
  adminId: string,
  requestId: string,
  body: { comment: string },
) {
  await findPending(requestId);

  if (!body.comment || typeof body.comment !== 'string' || !body.comment.trim()) {
    throw new BadRequest('Укажите причину отклонения');
  }

  await db
    .update(profileChangeRequests)
    .set({
      status: 'rejected',
      adminComment: body.comment.trim(),
      resolvedBy: adminId,
      resolvedAt: new Date(),
    })
    .where(eq(profileChangeRequests.id, requestId));

  return { success: true, status: 'rejected' };
}
