import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { carrierProfiles, driverDocuments, driverCitizenships, profileVerificationHistory } from '../../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

const REQUIRED_FOR_VERIFICATION = {
  profile: ['surname', 'givenName', 'dateOfBirth', 'gender'] as const,
  documents: [
    { docType: 'passport' as const, minCount: 1 },
    { docType: 'drivers_license' as const, minCount: 1 },
  ],
  citizenships: { minCount: 1 },
};

function getMissingFields(profile: typeof carrierProfiles.$inferSelect, docs: { docType: string }[], citizenships: { id: string }[]): string[] {
  const missing: string[] = [];
  for (const key of REQUIRED_FOR_VERIFICATION.profile) {
    const val = (profile as any)[key];
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

export const adminDriversVerifyRoutes = new Elysia({ prefix: '/admin/drivers' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { adminUser: user };
  })
  .get('/:driverId/verification-history', async ({ params, set }) => {
    const [profile] = await db
      .select()
      .from(carrierProfiles)
      .where(eq(carrierProfiles.userId, params.driverId))
      .limit(1);
    if (!profile) {
      set.status = 404;
      return { error: 'Профиль водителя не найден' };
    }
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
  })
  .post('/:driverId/verify', async ({ params, body, set, adminUser }) => {
    const [profile] = await db
      .select()
      .from(carrierProfiles)
      .where(eq(carrierProfiles.userId, params.driverId))
      .limit(1);
    if (!profile) {
      set.status = 404;
      return { error: 'Профиль водителя не найден' };
    }
    if (profile.verificationStatus !== 'submitted' && profile.verificationStatus !== 'waiting_verification') {
      set.status = 400;
      return { error: 'Верифицировать можно только профиль со статусом submitted' };
    }

    const docs = await db
      .select({ docType: driverDocuments.docType })
      .from(driverDocuments)
      .where(and(
        eq(driverDocuments.carrierId, profile.id),
        // active или pending_verification — документ загружен
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
    if (missing.length > 0) {
      set.status = 400;
      return { error: 'Не заполнены обязательные поля', missing_fields: missing };
    }

    const prevStatus = profile.verificationStatus;
    await db
      .update(carrierProfiles)
      .set({
        verificationStatus: 'verified',
        isVerified: true,
        verificationComment: null,
        verifiedAt: new Date(),
        verifiedBy: adminUser.id,
        updatedAt: new Date(),
      })
      .where(eq(carrierProfiles.id, profile.id));

    await db.insert(profileVerificationHistory).values({
      carrierId: profile.id,
      action: 'verified',
      previousStatus: prevStatus,
      newStatus: 'verified',
      comment: (body as any).comment ?? null,
      performedBy: adminUser.id,
      performedByRole: 'admin',
    });

    return { success: true, verification_status: 'verified' };
  }, {
    body: t.Object({
      comment: t.Optional(t.Nullable(t.String())),
    }),
  })
  .post('/:driverId/reject', async ({ params, body, set, adminUser }) => {
    const [profile] = await db
      .select()
      .from(carrierProfiles)
      .where(eq(carrierProfiles.userId, params.driverId))
      .limit(1);
    if (!profile) {
      set.status = 404;
      return { error: 'Профиль водителя не найден' };
    }
    if (profile.verificationStatus !== 'submitted' && profile.verificationStatus !== 'waiting_verification') {
      set.status = 400;
      return { error: 'Отклонить можно только профиль со статусом submitted' };
    }
    const comment = (body as any).comment;
    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      set.status = 400;
      return { error: 'Укажите причину отклонения (comment обязателен)' };
    }

    const prevStatus = profile.verificationStatus;
    await db
      .update(carrierProfiles)
      .set({
        verificationStatus: 'rejected',
        verificationComment: comment.trim(),
        updatedAt: new Date(),
      })
      .where(eq(carrierProfiles.id, profile.id));

    await db.insert(profileVerificationHistory).values({
      carrierId: profile.id,
      action: 'rejected',
      previousStatus: prevStatus,
      newStatus: 'rejected',
      comment: comment.trim(),
      performedBy: adminUser.id,
      performedByRole: 'admin',
    });

    return { success: true, verification_status: 'rejected' };
  }, {
    body: t.Object({
      comment: t.String(),
    }),
  })
  .post('/:driverId/suspend', async ({ params, body, set, adminUser }) => {
    const [profile] = await db
      .select()
      .from(carrierProfiles)
      .where(eq(carrierProfiles.userId, params.driverId))
      .limit(1);
    if (!profile) {
      set.status = 404;
      return { error: 'Профиль водителя не найден' };
    }
    if (profile.verificationStatus !== 'verified') {
      set.status = 400;
      return { error: 'Приостановить можно только верифицированного водителя' };
    }
    const comment = (body as any).comment;
    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      set.status = 400;
      return { error: 'Укажите причину приостановки' };
    }

    const prevStatus = profile.verificationStatus;
    await db
      .update(carrierProfiles)
      .set({
        verificationStatus: 'suspended',
        verificationComment: comment.trim(),
        updatedAt: new Date(),
      })
      .where(eq(carrierProfiles.id, profile.id));

    await db.insert(profileVerificationHistory).values({
      carrierId: profile.id,
      action: 'suspended',
      previousStatus: prevStatus,
      newStatus: 'suspended',
      comment: comment.trim(),
      performedBy: adminUser.id,
      performedByRole: 'admin',
    });

    return { success: true, verification_status: 'suspended' };
  }, {
    body: t.Object({
      comment: t.String(),
      reason: t.Optional(t.String()),
    }),
  })
  .post('/:driverId/restore', async ({ params, body, set, adminUser }) => {
    const [profile] = await db
      .select()
      .from(carrierProfiles)
      .where(eq(carrierProfiles.userId, params.driverId))
      .limit(1);
    if (!profile) {
      set.status = 404;
      return { error: 'Профиль водителя не найден' };
    }
    if (profile.verificationStatus !== 'suspended') {
      set.status = 400;
      return { error: 'Восстановить можно только приостановленного водителя' };
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
      comment: (body as any).comment ?? null,
      performedBy: adminUser.id,
      performedByRole: 'admin',
    });

    return { success: true, verification_status: 'verified' };
  }, {
    body: t.Object({
      comment: t.Optional(t.Nullable(t.String())),
    }),
  });
