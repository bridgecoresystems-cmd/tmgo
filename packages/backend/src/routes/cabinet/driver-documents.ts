import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { carrierProfiles, driverDocuments, profileChangeRequests } from '../../db/schema';
import { eq, and, or, isNull, lte, gte, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Документы, которые водитель может добавлять свободно (без change_request)
const FREE_ADD_DOC_TYPES = [
  'medical_certificate', 'insurance', 'visa', 'entry_permit',
  'tachograph_card', 'technical_minimum_cert', 'adr_certificate', 'other',
  'international_drivers_license',
];

// Документы, требующие change_request для обновления
const RESTRICTED_DOC_TYPES = ['passport', 'drivers_license'];

// Статусы, при которых паспорт/ВУ требуют change_request (совместимость со старыми: waiting_verification, request)
const LOCKED_STATUSES = ['submitted', 'verified', 'suspended', 'waiting_verification', 'request'];

async function uploadDocScan(carrierId: string, docType: string, file: File): Promise<string> {
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'jpg';
  if (!ALLOWED_EXTS.includes(ext)) throw new Error('Только PDF, JPG, PNG (макс. 10 МБ)');
  if (file.size > MAX_FILE_SIZE) throw new Error('Файл слишком большой (макс. 10 МБ)');
  const uploadDir = join(process.cwd(), 'storage', 'driver-docs', carrierId);
  await mkdir(uploadDir, { recursive: true });
  const filename = `${docType}_${randomUUID()}.${ext}`;
  const filepath = join(uploadDir, filename);
  const buf = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(buf));
  return `/cabinet/driver/document-files/${carrierId}/${filename}`;
}

function formatDoc(doc: typeof driverDocuments.$inferSelect) {
  const d = (x: Date | null | undefined) => x ? new Date(x).toISOString().slice(0, 10) : null;
  return {
    id: doc.id,
    carrier_id: doc.carrierId,
    doc_type: doc.docType,
    country: doc.country,
    series: doc.series,
    number: doc.number,
    issued_by: doc.issuedBy,
    issued_at: d(doc.issuedAt),
    expires_at: d(doc.expiresAt),
    place_of_birth: doc.placeOfBirth,
    residential_address: doc.residentialAddress,
    license_categories: doc.licenseCategories,
    permission_zone: doc.permissionZone,
    notes: doc.notes,
    scan_url: doc.scanUrl,
    status: doc.status,
    valid_from: d(doc.validFrom),
    valid_until: d(doc.validUntil),
    superseded_by_id: doc.supersededById,
    rejection_reason: doc.rejectionReason,
    verified_at: d(doc.verifiedAt),
    created_at: d(doc.createdAt),
    updated_at: d(doc.updatedAt),
  };
}

export const cabinetDriverDocumentsRoutes = new Elysia({ prefix: '/cabinet/driver/documents' })
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

  // GET /cabinet/driver/documents — список всех документов (кроме superseded по умолчанию)
  .get('/', async ({ carrierProfile, query }) => {
    const showHistory = (query as any).show_history === 'true';
    const docs = await db
      .select()
      .from(driverDocuments)
      .where(
        showHistory
          ? eq(driverDocuments.carrierId, carrierProfile.id)
          : and(
              eq(driverDocuments.carrierId, carrierProfile.id),
              or(
                eq(driverDocuments.status, 'active'),
                eq(driverDocuments.status, 'pending_verification'),
                eq(driverDocuments.status, 'expired'),
                eq(driverDocuments.status, 'rejected'),
              )
            )
      )
      .orderBy(desc(driverDocuments.createdAt));
    return docs.map(formatDoc);
  })

  // GET /cabinet/driver/documents/:id — один документ
  .get('/:id', async ({ carrierProfile, params, set }) => {
    const [doc] = await db
      .select()
      .from(driverDocuments)
      .where(and(
        eq(driverDocuments.id, params.id),
        eq(driverDocuments.carrierId, carrierProfile.id),
      ))
      .limit(1);
    if (!doc) { set.status = 404; return { error: 'Документ не найден' }; }
    return formatDoc(doc);
  })

  // POST /cabinet/driver/documents — добавить новый документ
  .post('/', async ({ carrierProfile, body, set }) => {
    const docType = (body as any).doc_type as string;
    const vStatus = carrierProfile.verificationStatus ?? 'not_submitted';
    const isLocked = LOCKED_STATUSES.includes(vStatus);

    // Для паспорта и ВУ после верификации — нужен одобренный change_request
    if (isLocked && RESTRICTED_DOC_TYPES.includes(docType)) {
      const changeKey = docType === 'passport' ? 'passport:add' : 'drivers_license:renew';
      const [approved] = await db
        .select()
        .from(profileChangeRequests)
        .where(and(
          eq(profileChangeRequests.carrierId, carrierProfile.id),
          eq(profileChangeRequests.fieldKey, changeKey),
          eq(profileChangeRequests.status, 'approved'),
          gte(profileChangeRequests.unlockedUntil, new Date()),
        ))
        .limit(1);
      if (!approved) {
        set.status = 403;
        return { error: `Для добавления ${docType} после верификации требуется одобренный запрос на изменение (${changeKey})` };
      }
    }

    const b = body as any;
    const [doc] = await db.insert(driverDocuments).values({
      carrierId: carrierProfile.id,
      docType: docType as any,
      country: b.country || null,
      series: b.series || null,
      number: b.number || null,
      issuedBy: b.issued_by || null,
      issuedAt: b.issued_at ? new Date(b.issued_at) : null,
      expiresAt: b.expires_at ? new Date(b.expires_at) : null,
      placeOfBirth: b.place_of_birth || null,
      residentialAddress: b.residential_address || null,
      licenseCategories: b.license_categories || null,
      permissionZone: b.permission_zone || null,
      notes: b.notes || null,
      scanUrl: b.scan_url || null,
      status: 'pending_verification',
    }).returning();

    return formatDoc(doc!);
  }, {
    body: t.Object({
      doc_type: t.String(),
      country: t.Optional(t.Nullable(t.String())),
      series: t.Optional(t.Nullable(t.String())),
      number: t.Optional(t.Nullable(t.String())),
      issued_by: t.Optional(t.Nullable(t.String())),
      issued_at: t.Optional(t.Nullable(t.String())),
      expires_at: t.Optional(t.Nullable(t.String())),
      place_of_birth: t.Optional(t.Nullable(t.String())),
      residential_address: t.Optional(t.Nullable(t.String())),
      license_categories: t.Optional(t.Nullable(t.String())),
      permission_zone: t.Optional(t.Nullable(t.String())),
      notes: t.Optional(t.Nullable(t.String())),
      scan_url: t.Optional(t.Nullable(t.String())),
    }),
  })

  // PATCH /cabinet/driver/documents/:id — обновить документ
  .patch('/:id', async ({ carrierProfile, params, body, set }) => {
    const [existing] = await db
      .select()
      .from(driverDocuments)
      .where(and(
        eq(driverDocuments.id, params.id),
        eq(driverDocuments.carrierId, carrierProfile.id),
      ))
      .limit(1);
    if (!existing) { set.status = 404; return { error: 'Документ не найден' }; }

    const vStatus = carrierProfile.verificationStatus ?? 'not_submitted';
    const isLocked = LOCKED_STATUSES.includes(vStatus);

    if (isLocked && RESTRICTED_DOC_TYPES.includes(existing.docType)) {
      const changeKey = existing.docType === 'passport' ? 'passport:renew' : 'drivers_license:renew';
      const [approved] = await db
        .select()
        .from(profileChangeRequests)
        .where(and(
          eq(profileChangeRequests.carrierId, carrierProfile.id),
          eq(profileChangeRequests.fieldKey, changeKey),
          eq(profileChangeRequests.status, 'approved'),
          gte(profileChangeRequests.unlockedUntil, new Date()),
        ))
        .limit(1);
      if (!approved) {
        set.status = 403;
        return { error: 'Для изменения этого документа требуется одобренный запрос на изменение' };
      }
    }

    const b = body as any;
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (b.country !== undefined) updateData.country = b.country;
    if (b.series !== undefined) updateData.series = b.series;
    if (b.number !== undefined) updateData.number = b.number;
    if (b.issued_by !== undefined) updateData.issuedBy = b.issued_by;
    if (b.issued_at !== undefined) updateData.issuedAt = b.issued_at ? new Date(b.issued_at) : null;
    if (b.expires_at !== undefined) updateData.expiresAt = b.expires_at ? new Date(b.expires_at) : null;
    if (b.place_of_birth !== undefined) updateData.placeOfBirth = b.place_of_birth;
    if (b.residential_address !== undefined) updateData.residentialAddress = b.residential_address;
    if (b.license_categories !== undefined) updateData.licenseCategories = b.license_categories;
    if (b.permission_zone !== undefined) updateData.permissionZone = b.permission_zone;
    if (b.notes !== undefined) updateData.notes = b.notes;
    if (b.scan_url !== undefined) updateData.scanUrl = b.scan_url;

    const [updated] = await db
      .update(driverDocuments)
      .set(updateData)
      .where(eq(driverDocuments.id, params.id))
      .returning();

    return formatDoc(updated!);
  }, {
    body: t.Object({
      country: t.Optional(t.Nullable(t.String())),
      series: t.Optional(t.Nullable(t.String())),
      number: t.Optional(t.Nullable(t.String())),
      issued_by: t.Optional(t.Nullable(t.String())),
      issued_at: t.Optional(t.Nullable(t.String())),
      expires_at: t.Optional(t.Nullable(t.String())),
      place_of_birth: t.Optional(t.Nullable(t.String())),
      residential_address: t.Optional(t.Nullable(t.String())),
      license_categories: t.Optional(t.Nullable(t.String())),
      permission_zone: t.Optional(t.Nullable(t.String())),
      notes: t.Optional(t.Nullable(t.String())),
      scan_url: t.Optional(t.Nullable(t.String())),
    }),
  })

  // POST /cabinet/driver/documents/:id/renew — загрузить новую версию документа
  // Старый получает status='superseded', новый создаётся как pending_verification
  .post('/:id/renew', async ({ carrierProfile, params, body, set }) => {
    const [existing] = await db
      .select()
      .from(driverDocuments)
      .where(and(
        eq(driverDocuments.id, params.id),
        eq(driverDocuments.carrierId, carrierProfile.id),
      ))
      .limit(1);
    if (!existing) { set.status = 404; return { error: 'Документ не найден' }; }

    const vStatus = carrierProfile.verificationStatus ?? 'not_submitted';
    const isLocked = LOCKED_STATUSES.includes(vStatus);

    if (isLocked && RESTRICTED_DOC_TYPES.includes(existing.docType)) {
      const changeKey = existing.docType === 'passport' ? 'passport:renew' : 'drivers_license:renew';
      const [approved] = await db
        .select()
        .from(profileChangeRequests)
        .where(and(
          eq(profileChangeRequests.carrierId, carrierProfile.id),
          eq(profileChangeRequests.fieldKey, changeKey),
          eq(profileChangeRequests.status, 'approved'),
          gte(profileChangeRequests.unlockedUntil, new Date()),
        ))
        .limit(1);
      if (!approved) {
        set.status = 403;
        return { error: 'Для обновления паспорта/ВУ требуется одобренный запрос на изменение' };
      }
    }

    const b = body as any;
    const now = new Date();

    // Создаём новую запись
    const [newDoc] = await db.insert(driverDocuments).values({
      carrierId: carrierProfile.id,
      docType: existing.docType,
      country: b.country ?? existing.country,
      series: b.series ?? existing.series,
      number: b.number ?? existing.number,
      issuedBy: b.issued_by ?? existing.issuedBy,
      issuedAt: b.issued_at ? new Date(b.issued_at) : existing.issuedAt,
      expiresAt: b.expires_at ? new Date(b.expires_at) : existing.expiresAt,
      placeOfBirth: b.place_of_birth ?? existing.placeOfBirth,
      residentialAddress: b.residential_address ?? existing.residentialAddress,
      licenseCategories: b.license_categories ?? existing.licenseCategories,
      permissionZone: b.permission_zone ?? existing.permissionZone,
      notes: b.notes ?? existing.notes,
      scanUrl: b.scan_url ?? existing.scanUrl,
      status: 'pending_verification',
      validFrom: now,
    }).returning();

    // Помечаем старый как superseded
    await db.update(driverDocuments)
      .set({ status: 'superseded', validUntil: now, supersededById: newDoc!.id, updatedAt: now })
      .where(eq(driverDocuments.id, existing.id));

    return formatDoc(newDoc!);
  }, {
    body: t.Object({
      country: t.Optional(t.Nullable(t.String())),
      series: t.Optional(t.Nullable(t.String())),
      number: t.Optional(t.Nullable(t.String())),
      issued_by: t.Optional(t.Nullable(t.String())),
      issued_at: t.Optional(t.Nullable(t.String())),
      expires_at: t.Optional(t.Nullable(t.String())),
      place_of_birth: t.Optional(t.Nullable(t.String())),
      residential_address: t.Optional(t.Nullable(t.String())),
      license_categories: t.Optional(t.Nullable(t.String())),
      permission_zone: t.Optional(t.Nullable(t.String())),
      notes: t.Optional(t.Nullable(t.String())),
      scan_url: t.Optional(t.Nullable(t.String())),
    }),
  })

  // DELETE /cabinet/driver/documents/:id — soft delete (status → revoked)
  .delete('/:id', async ({ carrierProfile, params, set }) => {
    const [existing] = await db
      .select()
      .from(driverDocuments)
      .where(and(
        eq(driverDocuments.id, params.id),
        eq(driverDocuments.carrierId, carrierProfile.id),
      ))
      .limit(1);
    if (!existing) { set.status = 404; return { error: 'Документ не найден' }; }

    const vStatus = carrierProfile.verificationStatus ?? 'not_submitted';
    const isLocked = LOCKED_STATUSES.includes(vStatus);
    if (isLocked && RESTRICTED_DOC_TYPES.includes(existing.docType)) {
      set.status = 403;
      return { error: 'Нельзя удалить паспорт/ВУ после верификации' };
    }

    await db.update(driverDocuments)
      .set({ status: 'revoked', validUntil: new Date(), updatedAt: new Date() })
      .where(eq(driverDocuments.id, existing.id));

    return { success: true, id: existing.id, status: 'revoked' };
  })

  // POST /cabinet/driver/documents/upload — загрузить скан документа
  .post('/upload', async ({ carrierProfile, body, set }) => {
    const file = (body as any).file as File;
    const docType = (body as any).doc_type as string || 'document';
    if (!file || !file.size) { set.status = 400; return { error: 'Файл не загружен' }; }
    try {
      const url = await uploadDocScan(carrierProfile.id, docType, file);
      return { url };
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  }, {
    body: t.Object({
      file: t.File(),
      doc_type: t.Optional(t.String()),
    }),
  });
