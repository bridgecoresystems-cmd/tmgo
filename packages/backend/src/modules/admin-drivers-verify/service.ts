import { db } from '../../db';
import { carrierProfiles, driverDocuments, driverCitizenships, profileVerificationHistory } from '../../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { NotFound, BadRequest } from '../../lib/errors';

// /verify отдаёт 400 с доп. полем missing_fields — несёт его через ошибку.
export class MissingFieldsError extends BadRequest {
  missingFields: string[];
  constructor(missingFields: string[]) {
    super('Не заполнены обязательные поля');
    this.missingFields = missingFields;
  }
}

const REQUIRED_FOR_VERIFICATION = {
  profile: ['surname', 'givenName', 'dateOfBirth', 'gender'] as const,
  documents: [
    { docType: 'passport' as const, minCount: 1 },
    { docType: 'drivers_license' as const, minCount: 1 },
  ],
  citizenships: { minCount: 1 },
};

function getMissingFields(
  profile: typeof carrierProfiles.$inferSelect,
  docs: { docType: string }[],
  citizenships: { id: string }[],
): string[] {
  const missing: string[] = [];
  for (const key of REQUIRED_FOR_VERIFICATION.profile) {
    const val = profile[key];
    if (!val || (typeof val === 'string' && !val.trim())) missing.push(key);
  }
  for (const { docType, minCount } of REQUIRED_FOR_VERIFICATION.documents) {
    const count = docs.filter((d) => d.docType === docType).length;
    if (count < minCount) missing.push(`${docType}:${minCount}`);
  }
  if (citizenships.length < REQUIRED_FOR_VERIFICATION.citizenships.minCount) {
    missing.push('citizenships:1');
  }
  return missing;
}

async function findProfile(driverId: string) {
  const [profile] = await db
    .select()
    .from(carrierProfiles)
    .where(eq(carrierProfiles.userId, driverId))
    .limit(1);
  if (!profile) throw new NotFound('Профиль водителя не найден');
  return profile;
}

function requireComment(comment: unknown, message: string): string {
  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    throw new BadRequest(message);
  }
  return comment.trim();
}

export async function getVerificationHistory(driverId: string) {
  const profile = await findProfile(driverId);
  const history = await db
    .select()
    .from(profileVerificationHistory)
    .where(eq(profileVerificationHistory.carrierId, profile.id))
    .orderBy(desc(profileVerificationHistory.createdAt));
  return history.map((h) => ({
    id: h.id,
    action: h.action,
    previous_status: h.previousStatus,
    new_status: h.newStatus,
    comment: h.comment,
    performed_by: h.performedBy,
    performed_by_role: h.performedByRole,
    created_at: h.createdAt ? new Date(h.createdAt).toISOString().slice(0, 10) : null,
  }));
}

export async function verifyDriver(adminId: string, driverId: string, comment?: string | null) {
  const profile = await findProfile(driverId);
  if (profile.verificationStatus !== 'submitted' && profile.verificationStatus !== 'waiting_verification') {
    throw new BadRequest('Верифицировать можно только профиль со статусом submitted');
  }

  const docs = await db
    .select({ docType: driverDocuments.docType })
    .from(driverDocuments)
    .where(and(
      eq(driverDocuments.carrierId, profile.id),
      inArray(driverDocuments.status, ['active', 'pending_verification']),
    ));
  const citizenships = await db
    .select({ id: driverCitizenships.id })
    .from(driverCitizenships)
    .where(and(
      eq(driverCitizenships.carrierId, profile.id),
      eq(driverCitizenships.status, 'active'),
    ));
  const missing = getMissingFields(profile, docs, citizenships);
  if (missing.length > 0) throw new MissingFieldsError(missing);

  const prevStatus = profile.verificationStatus;
  await db
    .update(carrierProfiles)
    .set({
      verificationStatus: 'verified',
      isVerified: true,
      verificationComment: null,
      verifiedAt: new Date(),
      verifiedBy: adminId,
      updatedAt: new Date(),
    })
    .where(eq(carrierProfiles.id, profile.id));

  await db.insert(profileVerificationHistory).values({
    carrierId: profile.id,
    action: 'verified',
    previousStatus: prevStatus,
    newStatus: 'verified',
    comment: comment ?? null,
    performedBy: adminId,
    performedByRole: 'admin',
  });

  return { success: true, verification_status: 'verified' };
}

export async function rejectDriver(adminId: string, driverId: string, comment: unknown) {
  const profile = await findProfile(driverId);
  if (profile.verificationStatus !== 'submitted' && profile.verificationStatus !== 'waiting_verification') {
    throw new BadRequest('Отклонить можно только профиль со статусом submitted');
  }
  const trimmed = requireComment(comment, 'Укажите причину отклонения (comment обязателен)');

  const prevStatus = profile.verificationStatus;
  await db
    .update(carrierProfiles)
    .set({
      verificationStatus: 'rejected',
      verificationComment: trimmed,
      updatedAt: new Date(),
    })
    .where(eq(carrierProfiles.id, profile.id));

  await db.insert(profileVerificationHistory).values({
    carrierId: profile.id,
    action: 'rejected',
    previousStatus: prevStatus,
    newStatus: 'rejected',
    comment: trimmed,
    performedBy: adminId,
    performedByRole: 'admin',
  });

  return { success: true, verification_status: 'rejected' };
}

export async function suspendDriver(adminId: string, driverId: string, comment: unknown) {
  const profile = await findProfile(driverId);
  if (profile.verificationStatus !== 'verified') {
    throw new BadRequest('Приостановить можно только верифицированного водителя');
  }
  const trimmed = requireComment(comment, 'Укажите причину приостановки');

  const prevStatus = profile.verificationStatus;
  await db
    .update(carrierProfiles)
    .set({
      verificationStatus: 'suspended',
      verificationComment: trimmed,
      updatedAt: new Date(),
    })
    .where(eq(carrierProfiles.id, profile.id));

  await db.insert(profileVerificationHistory).values({
    carrierId: profile.id,
    action: 'suspended',
    previousStatus: prevStatus,
    newStatus: 'suspended',
    comment: trimmed,
    performedBy: adminId,
    performedByRole: 'admin',
  });

  return { success: true, verification_status: 'suspended' };
}

export async function restoreDriver(adminId: string, driverId: string, comment?: string | null) {
  const profile = await findProfile(driverId);
  if (profile.verificationStatus !== 'suspended') {
    throw new BadRequest('Восстановить можно только приостановленного водителя');
  }

  const prevStatus = profile.verificationStatus;
  await db
    .update(carrierProfiles)
    .set({
      verificationStatus: 'verified',
      verificationComment: null,
      updatedAt: new Date(),
    })
    .where(eq(carrierProfiles.id, profile.id));

  await db.insert(profileVerificationHistory).values({
    carrierId: profile.id,
    action: 'restored',
    previousStatus: prevStatus,
    newStatus: 'verified',
    comment: comment ?? null,
    performedBy: adminId,
    performedByRole: 'admin',
  });

  return { success: true, verification_status: 'verified' };
}
