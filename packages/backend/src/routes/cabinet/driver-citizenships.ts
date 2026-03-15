import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { carrierProfiles, driverCitizenships, profileChangeRequests } from '../../db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

// Статусы, при которых редактирование гражданств требует change_request (совместимость со старыми: waiting_verification, request)
const LOCKED_STATUSES = ['submitted', 'verified', 'suspended', 'waiting_verification', 'request'];

function formatCitizenship(c: typeof driverCitizenships.$inferSelect) {
  const d = (x: Date | null | undefined) => x ? new Date(x).toISOString().slice(0, 10) : null;
  return {
    id: c.id,
    carrier_id: c.carrierId,
    country: c.country,
    acquired_at: d(c.acquiredAt),
    revoked_at: d(c.revokedAt),
    scan_url: c.scanUrl,
    status: c.status,
    verified_at: d(c.verifiedAt),
    created_at: d(c.createdAt),
  };
}

export const cabinetDriverCitizenshipsRoutes = new Elysia({ prefix: '/cabinet/driver/citizenships' })
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

  // GET /cabinet/driver/citizenships — список гражданств
  .get('/', async ({ carrierProfile }) => {
    const list = await db
      .select()
      .from(driverCitizenships)
      .where(eq(driverCitizenships.carrierId, carrierProfile.id))
      .orderBy(desc(driverCitizenships.createdAt));
    return list.map(formatCitizenship);
  })

  // POST /cabinet/driver/citizenships — добавить гражданство
  .post('/', async ({ carrierProfile, body, set }) => {
    const vStatus = carrierProfile.verificationStatus ?? 'not_submitted';
    const isLocked = LOCKED_STATUSES.includes(vStatus);

    if (isLocked) {
      // После верификации — нужен approved change_request
      const [approved] = await db
        .select()
        .from(profileChangeRequests)
        .where(and(
          eq(profileChangeRequests.carrierId, carrierProfile.id),
          eq(profileChangeRequests.fieldKey, 'citizenship:add'),
          eq(profileChangeRequests.status, 'approved'),
          gte(profileChangeRequests.unlockedUntil, new Date()),
        ))
        .limit(1);
      if (!approved) {
        set.status = 403;
        return { error: 'Для добавления гражданства после верификации требуется одобренный запрос на изменение' };
      }
    }

    const b = body as any;
    const [citizenship] = await db.insert(driverCitizenships).values({
      carrierId: carrierProfile.id,
      country: b.country,
      acquiredAt: b.acquired_at ? new Date(b.acquired_at) : null,
      scanUrl: b.scan_url || null,
      status: 'active',
    }).returning();

    return formatCitizenship(citizenship!);
  }, {
    body: t.Object({
      country: t.String(),
      acquired_at: t.Optional(t.Nullable(t.String())),
      scan_url: t.Optional(t.Nullable(t.String())),
    }),
  })

  // DELETE /cabinet/driver/citizenships/:id — отказ от гражданства (soft: status → revoked)
  .delete('/:id', async ({ carrierProfile, params, body, set }) => {
    const [existing] = await db
      .select()
      .from(driverCitizenships)
      .where(and(
        eq(driverCitizenships.id, params.id),
        eq(driverCitizenships.carrierId, carrierProfile.id),
      ))
      .limit(1);
    if (!existing) { set.status = 404; return { error: 'Гражданство не найдено' }; }

    const vStatus = carrierProfile.verificationStatus ?? 'not_submitted';
    const isLocked = LOCKED_STATUSES.includes(vStatus);

    if (isLocked) {
      const [approved] = await db
        .select()
        .from(profileChangeRequests)
        .where(and(
          eq(profileChangeRequests.carrierId, carrierProfile.id),
          eq(profileChangeRequests.fieldKey, 'citizenship:revoke'),
          eq(profileChangeRequests.status, 'approved'),
          gte(profileChangeRequests.unlockedUntil, new Date()),
        ))
        .limit(1);
      if (!approved) {
        set.status = 403;
        return { error: 'Для отказа от гражданства требуется одобренный запрос на изменение' };
      }
    }

    const b = (body ?? {}) as any;
    const [updated] = await db
      .update(driverCitizenships)
      .set({ status: 'revoked', revokedAt: new Date() })
      .where(eq(driverCitizenships.id, existing.id))
      .returning();

    return formatCitizenship(updated!);
  }, {
    body: t.Optional(t.Object({})),
  });
