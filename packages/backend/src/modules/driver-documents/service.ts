import { join } from 'path';
import { randomUUID } from 'crypto';
import { storage } from '../../lib/storage';
import { db } from '../../db';
import { driverDocuments, profileChangeRequests } from '../../db/schema';
import { eq, and, or, gte, desc } from 'drizzle-orm';
import { Forbidden, NotFound, BadRequest } from '../../lib/errors';

const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const DOC_TYPE_TO_ADD_KEY: Record<string, string> = {
  passport: 'passport:add',
  drivers_license: 'drivers_license:renew',
  international_drivers_license: 'drivers_license:renew',
  visa: 'visa:add',
  medical_certificate: 'medical_certificate:add',
  tachograph_card: 'tachograph_card:add',
  technical_minimum_cert: 'technical_minimum_cert:add',
  adr_certificate: 'adr_certificate:add',
  insurance: 'insurance:add',
  entry_permit: 'entry_permit:add',
};

const LOCKED_STATUSES = ['submitted', 'verified', 'suspended', 'waiting_verification', 'request'];

async function hasApprovedRequest(carrierId: string, fieldKey: string): Promise<boolean> {
  const [req] = await db
    .select({ id: profileChangeRequests.id })
    .from(profileChangeRequests)
    .where(and(
      eq(profileChangeRequests.carrierId, carrierId),
      eq(profileChangeRequests.fieldKey, fieldKey),
      eq(profileChangeRequests.status, 'approved'),
      gte(profileChangeRequests.unlockedUntil, new Date()),
    ))
    .limit(1);
  return !!req;
}

function safeDocType(docType: unknown): string {
  const s = String(docType || 'document').toLowerCase().replace(/[^a-z0-9_]/g, '');
  return s || 'document';
}

async function uploadDocScan(carrierId: string, docType: string, file: File): Promise<string> {
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'jpg';
  if (!ALLOWED_EXTS.includes(ext)) throw new BadRequest('Только PDF, JPG, PNG (макс. 10 МБ)');
  if (file.size > MAX_FILE_SIZE) throw new BadRequest('Файл слишком большой (макс. 10 МБ)');
  const safeType = safeDocType(docType);
  const safeCarrierId = carrierId.replace(/[^a-z0-9-]/gi, '');
  const filename = `${safeType}_${randomUUID()}.${ext}`;
  await storage.put(`driver-docs/${safeCarrierId}/${filename}`, await file.arrayBuffer());
  return `/cabinet/driver/document-files/${carrierId}/${filename}`;
}

function formatDoc(doc: typeof driverDocuments.$inferSelect) {
  const d = (x: Date | null | undefined) => (x ? new Date(x).toISOString().slice(0, 10) : null);
  const allowed_classes = doc.docType === 'adr_certificate' && doc.licenseCategories
    ? doc.licenseCategories.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;
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
    allowed_classes,
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

type Carrier = { id: string; verificationStatus?: string | null };

async function ensureUnlocked(carrier: Carrier, fieldKey: string | undefined, message: string) {
  const vStatus = carrier.verificationStatus ?? 'not_submitted';
  if (LOCKED_STATUSES.includes(vStatus) && fieldKey) {
    if (!(await hasApprovedRequest(carrier.id, fieldKey))) throw new Forbidden(message);
  }
}

async function findOwnedDoc(carrierId: string, id: string) {
  const [doc] = await db
    .select()
    .from(driverDocuments)
    .where(and(eq(driverDocuments.id, id), eq(driverDocuments.carrierId, carrierId)))
    .limit(1);
  if (!doc) throw new NotFound('Документ не найден');
  return doc;
}

export async function listDocuments(carrierId: string, showHistory: boolean) {
  const docs = await db
    .select()
    .from(driverDocuments)
    .where(
      showHistory
        ? eq(driverDocuments.carrierId, carrierId)
        : and(
          eq(driverDocuments.carrierId, carrierId),
          or(
            eq(driverDocuments.status, 'active'),
            eq(driverDocuments.status, 'pending_verification'),
            eq(driverDocuments.status, 'expired'),
            eq(driverDocuments.status, 'rejected'),
          ),
        ),
    )
    .orderBy(desc(driverDocuments.createdAt));
  return docs.map(formatDoc);
}

export async function getDocument(carrierId: string, id: string) {
  return formatDoc(await findOwnedDoc(carrierId, id));
}

export async function createDocument(carrier: Carrier, body: Record<string, any>) {
  const docType = body.doc_type as string;
  const changeKey = DOC_TYPE_TO_ADD_KEY[docType];
  await ensureUnlocked(carrier, changeKey,
    `Для добавления этого документа требуется одобренный запрос (${changeKey})`);

  const licenseCategories = docType === 'adr_certificate' && Array.isArray(body.allowed_classes)
    ? body.allowed_classes.filter(Boolean).join(',')
    : (body.license_categories || null);
  const [doc] = await db.insert(driverDocuments).values({
    carrierId: carrier.id,
    docType: docType as typeof driverDocuments.$inferInsert['docType'],
    country: body.country || null,
    series: body.series || null,
    number: body.number || null,
    issuedBy: body.issued_by || null,
    issuedAt: body.issued_at ? new Date(body.issued_at) : null,
    expiresAt: body.expires_at ? new Date(body.expires_at) : null,
    placeOfBirth: body.place_of_birth || null,
    residentialAddress: body.residential_address || null,
    licenseCategories,
    permissionZone: body.permission_zone || null,
    notes: body.notes || null,
    scanUrl: body.scan_url || null,
    status: 'pending_verification',
  }).returning();
  return formatDoc(doc!);
}

export async function updateDocument(carrier: Carrier, id: string, body: Record<string, any>) {
  const existing = await findOwnedDoc(carrier.id, id);
  await ensureUnlocked(carrier, DOC_TYPE_TO_ADD_KEY[existing.docType],
    'Для изменения этого документа требуется одобренный запрос на изменение');

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (body.country !== undefined) updateData.country = body.country;
  if (body.series !== undefined) updateData.series = body.series;
  if (body.number !== undefined) updateData.number = body.number;
  if (body.issued_by !== undefined) updateData.issuedBy = body.issued_by;
  if (body.issued_at !== undefined) updateData.issuedAt = body.issued_at ? new Date(body.issued_at) : null;
  if (body.expires_at !== undefined) updateData.expiresAt = body.expires_at ? new Date(body.expires_at) : null;
  if (body.place_of_birth !== undefined) updateData.placeOfBirth = body.place_of_birth;
  if (body.residential_address !== undefined) updateData.residentialAddress = body.residential_address;
  if (body.allowed_classes !== undefined) {
    updateData.licenseCategories = Array.isArray(body.allowed_classes) ? body.allowed_classes.filter(Boolean).join(',') : null;
  } else if (body.license_categories !== undefined) {
    updateData.licenseCategories = body.license_categories;
  }
  if (body.permission_zone !== undefined) updateData.permissionZone = body.permission_zone;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.scan_url !== undefined) updateData.scanUrl = body.scan_url;

  const [updated] = await db
    .update(driverDocuments)
    .set(updateData)
    .where(eq(driverDocuments.id, id))
    .returning();
  return formatDoc(updated!);
}

export async function renewDocument(carrier: Carrier, id: string, body: Record<string, any>) {
  const existing = await findOwnedDoc(carrier.id, id);
  await ensureUnlocked(carrier, DOC_TYPE_TO_ADD_KEY[existing.docType],
    'Для обновления этого документа требуется одобренный запрос на изменение');

  const now = new Date();
  const [newDoc] = await db.insert(driverDocuments).values({
    carrierId: carrier.id,
    docType: existing.docType,
    country: body.country ?? existing.country,
    series: body.series ?? existing.series,
    number: body.number ?? existing.number,
    issuedBy: body.issued_by ?? existing.issuedBy,
    issuedAt: body.issued_at ? new Date(body.issued_at) : existing.issuedAt,
    expiresAt: body.expires_at ? new Date(body.expires_at) : existing.expiresAt,
    placeOfBirth: body.place_of_birth ?? existing.placeOfBirth,
    residentialAddress: body.residential_address ?? existing.residentialAddress,
    licenseCategories: body.license_categories ?? existing.licenseCategories,
    permissionZone: body.permission_zone ?? existing.permissionZone,
    notes: body.notes ?? existing.notes,
    scanUrl: body.scan_url ?? existing.scanUrl,
    status: 'pending_verification',
    validFrom: now,
  }).returning();

  await db.update(driverDocuments)
    .set({ status: 'superseded', validUntil: now, supersededById: newDoc!.id, updatedAt: now })
    .where(eq(driverDocuments.id, existing.id));

  return formatDoc(newDoc!);
}

export async function deleteDocument(carrier: Carrier, id: string) {
  const existing = await findOwnedDoc(carrier.id, id);
  await ensureUnlocked(carrier, DOC_TYPE_TO_ADD_KEY[existing.docType],
    'Для удаления этого документа требуется одобренный запрос на изменение');

  await db.update(driverDocuments)
    .set({ status: 'revoked', validUntil: new Date(), updatedAt: new Date() })
    .where(eq(driverDocuments.id, existing.id));

  return { success: true, id: existing.id, status: 'revoked' };
}

export async function uploadScan(carrierId: string, docType: string, file: File | undefined) {
  if (!file || !file.size) throw new BadRequest('Файл не загружен');
  const url = await uploadDocScan(carrierId, docType, file);
  return { url };
}
