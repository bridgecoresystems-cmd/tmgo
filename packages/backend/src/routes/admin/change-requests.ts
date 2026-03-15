import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { carrierProfiles, profileChangeRequests } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

function formatRequest(r: typeof profileChangeRequests.$inferSelect, driverName: string | null) {
  const d = (x: Date | null | undefined) => x ? new Date(x).toISOString().slice(0, 10) : null;
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

export const adminChangeRequestsRoutes = new Elysia({ prefix: '/admin/change-requests' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { adminUser: user };
  })

  // GET /admin/change-requests?status=pending&page=1
  .get('/', async ({ query }) => {
    const status = (query as { status?: string }).status ?? 'pending';
    const page = Math.max(1, parseInt((query as { page?: string }).page ?? '1', 10));
    const limit = 20;
    const offset = (page - 1) * limit;

    const list = await db
      .select({
        request: profileChangeRequests,
        surname: carrierProfiles.surname,
        givenName: carrierProfiles.givenName,
        patronymic: carrierProfiles.patronymic,
      })
      .from(profileChangeRequests)
      .innerJoin(carrierProfiles, eq(profileChangeRequests.carrierId, carrierProfiles.id))
      .where(status === 'all' ? undefined : eq(profileChangeRequests.status, status))
      .orderBy(desc(profileChangeRequests.requestedAt))
      .limit(limit)
      .offset(offset);

    const driverName = (s: string | null, g: string | null, p: string | null) => {
      const parts = [s, g, p].filter(Boolean);
      return parts.length ? parts.join(' ') : null;
    };

    return list.map(({ request: r, surname, givenName, patronymic }) =>
      formatRequest(r, driverName(surname, givenName, patronymic)),
    );
  })

  // POST /admin/change-requests/:requestId/approve
  .post('/:requestId/approve', async ({ params, body, set, adminUser }) => {
    const [existing] = await db
      .select()
      .from(profileChangeRequests)
      .where(eq(profileChangeRequests.id, params.requestId))
      .limit(1);
    if (!existing) {
      set.status = 404;
      return { error: 'Запрос не найден' };
    }
    if (existing.status !== 'pending') {
      set.status = 400;
      return { error: 'Запрос уже рассмотрен' };
    }

    const unlockDays = body.unlock_days ?? 7;
    const unlockedUntil = new Date();
    unlockedUntil.setDate(unlockedUntil.getDate() + unlockDays);

    await db
      .update(profileChangeRequests)
      .set({
        status: 'approved',
        adminComment: body.comment ?? null,
        resolvedBy: adminUser.id,
        resolvedAt: new Date(),
        unlockedUntil,
      })
      .where(eq(profileChangeRequests.id, params.requestId));

    return {
      success: true,
      status: 'approved',
      unlocked_until: unlockedUntil.toISOString().slice(0, 10),
    };
  }, {
    body: t.Object({
      comment: t.Optional(t.Nullable(t.String())),
      unlock_days: t.Optional(t.Number()),
    }),
  })

  // POST /admin/change-requests/:requestId/reject
  .post('/:requestId/reject', async ({ params, body, set, adminUser }) => {
    const [existing] = await db
      .select()
      .from(profileChangeRequests)
      .where(eq(profileChangeRequests.id, params.requestId))
      .limit(1);
    if (!existing) {
      set.status = 404;
      return { error: 'Запрос не найден' };
    }
    if (existing.status !== 'pending') {
      set.status = 400;
      return { error: 'Запрос уже рассмотрен' };
    }
    if (!body.comment || typeof body.comment !== 'string' || !body.comment.trim()) {
      set.status = 400;
      return { error: 'Укажите причину отклонения' };
    }

    await db
      .update(profileChangeRequests)
      .set({
        status: 'rejected',
        adminComment: body.comment.trim(),
        resolvedBy: adminUser.id,
        resolvedAt: new Date(),
      })
      .where(eq(profileChangeRequests.id, params.requestId));

    return { success: true, status: 'rejected' };
  }, {
    body: t.Object({
      comment: t.String(),
    }),
  });
