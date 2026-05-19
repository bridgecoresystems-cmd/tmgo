import { db } from '../../db';
import { driverCitizenships, profileChangeRequests } from '../../db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { Forbidden, NotFound } from '../../lib/errors';

// Статусы, при которых редактирование требует change_request
// (совместимость со старыми: waiting_verification, request).
const LOCKED_STATUSES = ['submitted', 'verified', 'suspended', 'waiting_verification', 'request'];

function formatCitizenship(c: typeof driverCitizenships.$inferSelect) {
  const d = (x: Date | null | undefined) => (x ? new Date(x).toISOString().slice(0, 10) : null);
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

type CarrierProfile = { id: string; verificationStatus?: string | null };

async function hasApprovedUnlock(carrierId: string, fieldKey: string) {
  const [approved] = await db
    .select()
    .from(profileChangeRequests)
    .where(and(
      eq(profileChangeRequests.carrierId, carrierId),
      eq(profileChangeRequests.fieldKey, fieldKey),
      eq(profileChangeRequests.status, 'approved'),
      gte(profileChangeRequests.unlockedUntil, new Date()),
    ))
    .limit(1);
  return Boolean(approved);
}

export async function listCitizenships(carrierId: string) {
  const list = await db
    .select()
    .from(driverCitizenships)
    .where(eq(driverCitizenships.carrierId, carrierId))
    .orderBy(desc(driverCitizenships.createdAt));
  return list.map(formatCitizenship);
}

export async function addCitizenship(
  carrier: CarrierProfile,
  input: { country: string; acquired_at?: string | null; scan_url?: string | null },
) {
  const vStatus = carrier.verificationStatus ?? 'not_submitted';
  if (LOCKED_STATUSES.includes(vStatus) && !(await hasApprovedUnlock(carrier.id, 'citizenship:add'))) {
    throw new Forbidden('Для добавления гражданства после верификации требуется одобренный запрос на изменение');
  }

  const [citizenship] = await db.insert(driverCitizenships).values({
    carrierId: carrier.id,
    country: input.country,
    acquiredAt: input.acquired_at ? new Date(input.acquired_at) : null,
    scanUrl: input.scan_url || null,
    status: 'active',
  }).returning();

  return formatCitizenship(citizenship!);
}

export async function revokeCitizenship(carrier: CarrierProfile, id: string) {
  const [existing] = await db
    .select()
    .from(driverCitizenships)
    .where(and(
      eq(driverCitizenships.id, id),
      eq(driverCitizenships.carrierId, carrier.id),
    ))
    .limit(1);
  if (!existing) throw new NotFound('Гражданство не найдено');

  const vStatus = carrier.verificationStatus ?? 'not_submitted';
  if (LOCKED_STATUSES.includes(vStatus) && !(await hasApprovedUnlock(carrier.id, 'citizenship:revoke'))) {
    throw new Forbidden('Для отказа от гражданства требуется одобренный запрос на изменение');
  }

  const [updated] = await db
    .update(driverCitizenships)
    .set({ status: 'revoked', revokedAt: new Date() })
    .where(eq(driverCitizenships.id, existing.id))
    .returning();

  return formatCitizenship(updated!);
}
