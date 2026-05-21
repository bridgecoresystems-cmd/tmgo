import { join } from 'path';
import { randomUUID } from 'crypto';
import { storage } from '../../lib/storage';
import { db } from '../../db';
import {
  users, accounts, carrierProfiles, sessions, profileEditRequests, profileChangeRequests,
  vehicles, orderResponses, driverServices, orders, orderMessages, orderStatusLog,
  driverCitizenships, driverContacts, driverDocuments, clientProfiles,
} from '../../db/schema';
import { eq, and, desc, inArray, isNull } from 'drizzle-orm';
import { AppError, BadRequest } from '../../lib/errors';

// ── Контракт ошибок ───────────────────────────────────────────────
// Старый код использовал Elysia `error(status, 'msg')` (тело — raw-string) И
// `set.status=X; return {error:'msg'}` (тело — объект). Сохраняем оба контракта:
// - PlainError → onError возвращает голую строку
// - BadRequest/NotFound и т.п. → mapErrorToResponse возвращает {error: code}
export class PlainError extends AppError {
  constructor(status: number, message: string) {
    super(status, message);
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'] as const;
const ALLOWED_DOC_TYPES = ['passport', 'drivers_license', 'visa', 'medical_certificate', 'insurance', 'tachograph_card', 'technical_minimum_cert', 'adr_certificate', 'other', 'document'] as const;
const DOC_TYPES_LIST = ['passport', 'drivers_license', 'visa', 'medical_certificate', 'tachograph_card', 'technical_minimum_cert', 'adr_certificate'] as const;

function safeExt(name: string): string | null {
  const ext = (name || '').split('.').pop()?.toLowerCase() || null;
  return ext && (ALLOWED_EXT as readonly string[]).includes(ext) ? ext : null;
}

function safeDocType(docType: unknown): string {
  const s = String(docType || 'document').toLowerCase().replace(/[^a-z0-9_]/g, '');
  return (ALLOWED_DOC_TYPES as readonly string[]).includes(s) ? s : 'document';
}

function isUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

function dateStr(x: Date | string | null | undefined): string | null {
  if (x == null) return null;
  const dt = x instanceof Date ? x : new Date(x as string);
  return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
}

async function findUser(id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return u;
}

async function findDriverProfile(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) throw new PlainError(404, 'User not found');
  if (u.role !== 'driver') throw new PlainError(400, 'User is not a driver');
  const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, userId)).limit(1);
  if (!profile) throw new PlainError(404, 'Driver profile not found');
  return { user: u, profile };
}

// ── Users CRUD ────────────────────────────────────────────────────

export async function createUser(body: { email: string; password: string; name?: string; role: 'admin' | 'dispatcher' }) {
  const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
  if (existing.length > 0) throw new PlainError(400, 'Пользователь с таким email уже существует');
  const hashedPassword = await Bun.password.hash(body.password, { algorithm: 'bcrypt', cost: 10 });
  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    name: body.name || body.email.split('@')[0],
    email: body.email,
    emailVerified: true,
    role: body.role,
  });
  await db.insert(accounts).values({
    id: crypto.randomUUID(),
    accountId: body.email,
    providerId: 'credential',
    userId,
    password: hashedPassword,
  });
  const [created] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return created!;
}

export async function listUsers(query: { include_inactive?: string; inactive_only?: string }) {
  const includeInactive = query.include_inactive === '1';
  const inactiveOnly = query.inactive_only === '1';
  const list = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      surname: carrierProfiles.surname,
      givenName: carrierProfiles.givenName,
      patronymic: carrierProfiles.patronymic,
      verificationStatus: carrierProfiles.verificationStatus,
      isOnline: carrierProfiles.isOnline,
    })
    .from(users)
    .leftJoin(carrierProfiles, eq(users.id, carrierProfiles.userId))
    .where(
      inactiveOnly ? eq(users.isActive, false) : includeInactive ? eq(users.id, users.id) : eq(users.isActive, true)
    )
    .orderBy(users.createdAt);
  return list.map((row) => {
    const parts = [row.surname, row.givenName, row.patronymic].filter(Boolean);
    const driverName = parts.length ? parts.join(' ') : null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.createdAt,
      is_active: row.isActive,
      driverName,
      verification_status: row.verificationStatus ?? null,
      is_online: row.role === 'driver' ? (row.isOnline ?? false) : null,
    };
  });
}

export async function getUser(id: string) {
  const u = await findUser(id);
  if (!u) throw new PlainError(404, 'User not found');
  return u;
}

export async function updateUser(id: string, body: { role?: string; name?: string }) {
  const [updated] = await db
    .update(users)
    .set({ ...body, updatedAt: new Date() } as any)
    .where(eq(users.id, id))
    .returning();
  if (!updated) throw new PlainError(404, 'User not found');
  return updated;
}

export async function activateUser(id: string) {
  const [updated] = await db
    .update(users)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  if (!updated) throw new PlainError(404, 'User not found');
  return { success: true, message: 'Пользователь восстановлен' };
}

export async function deactivateUser(id: string) {
  const target = await findUser(id);
  if (!target) throw new PlainError(404, 'User not found');
  if (target.role === 'admin') {
    const activeAdmins = await db.select().from(users).where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
    if (activeAdmins.length <= 1) throw new PlainError(400, 'Нельзя деактивировать последнего администратора');
  }
  const [updated] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  if (!updated) throw new PlainError(404, 'User not found');
  await db.delete(sessions).where(eq(sessions.userId, id));
  return { success: true, message: 'Пользователь деактивирован' };
}

// Original wraps в try/catch и отдаёт 500 {error: msg} при любой ошибке —
// сохраняем поведение через BadRequest? Нет: нужен 500. Бросаем напрямую AppError(500).
export async function deleteUser(id: string) {
  try {
    const target = await findUser(id);
    if (!target) throw new PlainError(404, 'User not found');
    if (target.role === 'admin') {
      const admins = await db.select().from(users).where(eq(users.role, 'admin'));
      if (admins.length <= 1) throw new PlainError(400, 'Нельзя удалить последнего администратора');
    }

    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, id)).limit(1);
    if (profile) {
      const profileId = profile.id;
      await db.delete(driverServices).where(eq(driverServices.carrierId, profileId));
      await db.delete(orderResponses).where(eq(orderResponses.carrierId, profileId));
      await db.delete(vehicles).where(eq(vehicles.carrierId, profileId));
    }

    const clientProfilesList = await db.select({ id: clientProfiles.id }).from(clientProfiles).where(eq(clientProfiles.userId, id));
    for (const cp of clientProfilesList) {
      const clientOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.clientProfileId, cp.id));
      for (const o of clientOrders) {
        await db.delete(orderResponses).where(eq(orderResponses.orderId, o.id));
        await db.delete(orderMessages).where(eq(orderMessages.orderId, o.id));
      }
      await db.delete(orders).where(eq(orders.clientProfileId, cp.id));
    }
    await db.delete(clientProfiles).where(eq(clientProfiles.userId, id));

    await db.delete(orderMessages).where(eq(orderMessages.senderId, id));
    // orderStatusLog.changedBy → users.id без cascade; nullable (null = система/BullMQ).
    // Обнуляем, чтобы не терять аудит-лог смены статусов и не ловить FK violation на delete users.
    await db.update(orderStatusLog).set({ changedBy: null }).where(eq(orderStatusLog.changedBy, id));
    await db.delete(sessions).where(eq(sessions.userId, id));
    await db.delete(accounts).where(eq(accounts.userId, id));
    if (profile) {
      await db.delete(carrierProfiles).where(eq(carrierProfiles.userId, id));
    }
    await db.delete(users).where(eq(users.id, id));
    return { success: true, message: 'Пользователь удалён навсегда' };
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    console.error('[admin users DELETE]', e);
    // 500 с телом {error: msg} — спецконтракт; используем BadRequest-подобный объектный вид через AppError 500.
    const msg = e?.message || 'Ошибка удаления пользователя';
    const wrapped = new BadRequest(msg);
    wrapped.status = 500;
    throw wrapped;
  }
}

// ── Driver profile (огромный response builder) ────────────────────

const PASSPORT_DOC_FIELDS = (d: any) => ({
  id: d.id,
  series: d.series,
  number: d.number,
  issued_by: d.issuedBy,
  issued_at: dateStr(d.issuedAt),
  expires_at: dateStr(d.expiresAt),
  place_of_birth: d.placeOfBirth,
  residential_address: d.residentialAddress,
  scan_url: d.scanUrl,
  status: d.status,
});

const LICENSE_DOC_FIELDS = (d: any) => ({
  id: d.id,
  number: d.number,
  issued_by: d.issuedBy,
  issued_at: dateStr(d.issuedAt),
  expires_at: dateStr(d.expiresAt),
  license_categories: d.licenseCategories,
  scan_url: d.scanUrl,
  status: d.status,
});

const VISA_DOC_FIELDS = (d: any) => ({
  id: d.id,
  country: d.country,
  number: d.number,
  issued_at: dateStr(d.issuedAt),
  expires_at: dateStr(d.expiresAt),
  scan_url: d.scanUrl,
  status: d.status,
});

const MEDICAL_DOC_FIELDS = (d: any) => ({
  id: d.id,
  number: d.number,
  issued_at: dateStr(d.issuedAt),
  expires_at: dateStr(d.expiresAt),
  scan_url: d.scanUrl,
  status: d.status,
});

const TACHO_DOC_FIELDS = (d: any) => ({
  id: d.id,
  number: d.number,
  country: d.country,
  issued_at: dateStr(d.issuedAt),
  expires_at: dateStr(d.expiresAt),
  scan_url: d.scanUrl,
  status: d.status,
});

const TECH_MIN_DOC_FIELDS = (d: any) => ({
  id: d.id,
  number: d.number,
  issued_by: d.issuedBy,
  issued_at: dateStr(d.issuedAt),
  expires_at: dateStr(d.expiresAt),
  scan_url: d.scanUrl,
  status: d.status,
});

const ADR_DOC_FIELDS = (d: any) => {
  const allowed = d.licenseCategories ? d.licenseCategories.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  return {
    id: d.id,
    issued_by: d.issuedBy,
    number: d.number,
    allowed_classes: allowed,
    license_categories: d.licenseCategories,
    issued_at: dateStr(d.issuedAt),
    expires_at: dateStr(d.expiresAt),
    scan_url: d.scanUrl,
    status: d.status,
  };
};

async function fetchDocsOfType(carrierId: string, type: string) {
  return db.select().from(driverDocuments)
    .where(and(
      eq(driverDocuments.carrierId, carrierId),
      eq(driverDocuments.docType, type as any),
      inArray(driverDocuments.status, ['active', 'pending_verification']),
    ))
    .orderBy(desc(driverDocuments.createdAt));
}

export async function getDriverProfile(userId: string) {
  const { user, profile } = await findDriverProfile(userId);

  const legacyCitizenships = (profile.citizenship ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const citizenshipsFromTable = await db.select({ country: driverCitizenships.country })
    .from(driverCitizenships)
    .where(and(eq(driverCitizenships.carrierId, profile.id), eq(driverCitizenships.status, 'active')));
  const allCitizenships = [...new Set([...legacyCitizenships, ...citizenshipsFromTable.map((c) => c.country).filter(Boolean)])];
  const citizenship = allCitizenships.join(', ');

  const legacyPhones = (profile.phone ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const contactsFromTable = await db.select({ value: driverContacts.value })
    .from(driverContacts)
    .where(and(
      eq(driverContacts.carrierId, profile.id),
      eq(driverContacts.contactType, 'phone'),
      eq(driverContacts.isActive, true),
      isNull(driverContacts.deletedAt),
    ));
  const allPhones = [...new Set([...legacyPhones, ...contactsFromTable.map((c) => c.value).filter(Boolean)])];
  const phone = allPhones.join(', ');

  const legacyEmails = (profile.additionalEmails ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const emailsFromTable = await db.select({ value: driverContacts.value })
    .from(driverContacts)
    .where(and(
      eq(driverContacts.carrierId, profile.id),
      eq(driverContacts.contactType, 'email'),
      eq(driverContacts.isActive, true),
      isNull(driverContacts.deletedAt),
    ));
  const allEmails = [...new Set([...legacyEmails, ...emailsFromTable.map((c) => c.value).filter(Boolean)])];
  const additional_emails = allEmails.join(', ');

  const passportDocs = await fetchDocsOfType(profile.id, 'passport');
  const licenseDocs = await fetchDocsOfType(profile.id, 'drivers_license');
  const visaDocs = await fetchDocsOfType(profile.id, 'visa');
  const medicalDocs = await fetchDocsOfType(profile.id, 'medical_certificate');
  const tachographDocs = await fetchDocsOfType(profile.id, 'tachograph_card');
  const techMinDocs = await fetchDocsOfType(profile.id, 'technical_minimum_cert');
  const adrDocs = await fetchDocsOfType(profile.id, 'adr_certificate');

  const ratingVal = profile.rating;
  const rating = ratingVal != null ? String(ratingVal) : null;

  return {
    id: profile.id,
    surname: profile.surname,
    given_name: profile.givenName,
    patronymic: profile.patronymic,
    date_of_birth: dateStr(profile.dateOfBirth),
    citizenship,
    gender: profile.gender,
    phone,
    email: user.email,
    additional_emails,
    status: profile.status,
    employment_category: profile.employmentCategory,
    company_name: profile.companyName,
    license_number: profile.licenseNumber,
    license_expiry: dateStr(profile.licenseExpiry),
    license_categories: profile.licenseCategories,
    license_issue_date: dateStr(profile.licenseIssueDate),
    license_issued_by: profile.licenseIssuedBy,
    license_scan_url: profile.licenseScanUrl,
    licenses_from_documents: licenseDocs.map(LICENSE_DOC_FIELDS),
    has_international_license: profile.hasInternationalLicense,
    international_license_number: profile.internationalLicenseNumber,
    international_license_validity: profile.internationalLicenseValidity,
    last_medical_examination_date: dateStr(profile.lastMedicalExaminationDate),
    hire_source: profile.hireSource,
    attached_documents: profile.attachedDocuments,
    inn: profile.inn,
    address: profile.address,
    passport_series: profile.passportSeries,
    passport_number: profile.passportNumber,
    passport_issue_date: dateStr(profile.passportIssueDate),
    passport_expiry_date: dateStr(profile.passportExpiryDate),
    passport_issued_by: profile.passportIssuedBy,
    place_of_birth: profile.placeOfBirth,
    residential_address: profile.residentialAddress,
    passport_scan_url: profile.passportScanUrl,
    passport_is_active: profile.passportIsActive,
    extra_passports: (profile.extraPassports as any[]) ?? [],
    passports_from_documents: passportDocs.map(PASSPORT_DOC_FIELDS),
    visas_from_documents: visaDocs.map(VISA_DOC_FIELDS),
    medical_certificates_from_documents: medicalDocs.map(MEDICAL_DOC_FIELDS),
    tachograph_cards_from_documents: tachographDocs.map(TACHO_DOC_FIELDS),
    technical_minimum_certs_from_documents: techMinDocs.map(TECH_MIN_DOC_FIELDS),
    adr_certs_from_documents: adrDocs.map(ADR_DOC_FIELDS),
    permission_entry_zone: profile.permissionEntryZone,
    permission_issue_date: dateStr(profile.permissionIssueDate),
    permission_validity_date: dateStr(profile.permissionValidityDate),
    medical_certificate: profile.medicalCertificate,
    medical_certificate_scan_url: profile.medicalCertificateScanUrl,
    technical_minimum_certificate: profile.technicalMinimumCertificate,
    tachograph_card_number: profile.tachographCardNumber,
    other_permits: profile.otherPermits,
    bank_name: profile.bankName,
    bank_account: profile.bankAccount,
    bank_bik: profile.bankBik,
    is_verified: profile.isVerified,
    verification_status: String(profile.verificationStatus ?? 'not_verified'),
    unlocked_fields: (profile.unlockedFields as string[]) ?? [],
    hidden_fields: (profile.hiddenFields as string[]) ?? [],
    rating,
    updated_at: profile.updatedAt ? profile.updatedAt.toISOString().slice(0, 10) : null,
  };
}

const DRIVER_FIELD_MAP: Record<string, string> = {
  surname: 'surname', given_name: 'givenName', patronymic: 'patronymic', date_of_birth: 'dateOfBirth',
  citizenship: 'citizenship', gender: 'gender', status: 'status', employment_category: 'employmentCategory',
  company_name: 'companyName', license_number: 'licenseNumber', license_expiry: 'licenseExpiry',
  license_categories: 'licenseCategories', license_issue_date: 'licenseIssueDate', license_issued_by: 'licenseIssuedBy',
  license_scan_url: 'licenseScanUrl', has_international_license: 'hasInternationalLicense',
  international_license_number: 'internationalLicenseNumber', international_license_validity: 'internationalLicenseValidity',
  last_medical_examination_date: 'lastMedicalExaminationDate', hire_source: 'hireSource',
  attached_documents: 'attachedDocuments', phone: 'phone', additional_emails: 'additionalEmails',
  inn: 'inn', address: 'address', passport_series: 'passportSeries', passport_number: 'passportNumber',
  passport_issue_date: 'passportIssueDate', passport_expiry_date: 'passportExpiryDate',
  passport_issued_by: 'passportIssuedBy', place_of_birth: 'placeOfBirth', residential_address: 'residentialAddress',
  passport_scan_url: 'passportScanUrl', passport_is_active: 'passportIsActive', permission_entry_zone: 'permissionEntryZone',
  permission_issue_date: 'permissionIssueDate', permission_validity_date: 'permissionValidityDate',
  medical_certificate: 'medicalCertificate', medical_certificate_scan_url: 'medicalCertificateScanUrl',
  technical_minimum_certificate: 'technicalMinimumCertificate', tachograph_card_number: 'tachographCardNumber',
  other_permits: 'otherPermits', bank_name: 'bankName', bank_account: 'bankAccount', bank_bik: 'bankBik',
};

const DRIVER_DATE_KEYS = ['date_of_birth', 'license_expiry', 'license_issue_date', 'last_medical_examination_date', 'passport_issue_date', 'passport_expiry_date', 'permission_issue_date', 'permission_validity_date'];

export async function updateDriverProfile(userId: string, body: Record<string, unknown>) {
  const { profile } = await findDriverProfile(userId);

  const updateData: Record<string, unknown> = {};
  for (const [key, dbKey] of Object.entries(DRIVER_FIELD_MAP)) {
    if (body[key] === undefined) continue;
    const val = body[key];
    if (DRIVER_DATE_KEYS.includes(key)) {
      updateData[dbKey] = val ? new Date(val as string) : null;
    } else {
      updateData[dbKey] = val;
    }
  }
  if (body.hidden_fields !== undefined) {
    updateData.hiddenFields = Array.isArray(body.hidden_fields) ? body.hidden_fields : [];
  }
  if (body.extra_passports !== undefined) {
    const arr = Array.isArray(body.extra_passports) ? body.extra_passports : [];
    updateData.extraPassports = arr.map((p: any) => ({
      passport_series: p.passport_series ?? null,
      passport_number: p.passport_number ?? null,
      passport_issue_date: p.passport_issue_date ?? null,
      passport_expiry_date: p.passport_expiry_date ?? null,
      passport_issued_by: p.passport_issued_by ?? null,
      place_of_birth: p.place_of_birth ?? null,
      residential_address: p.residential_address ?? null,
      passport_scan_url: p.passport_scan_url ?? null,
      is_active: p.is_active ?? true,
    }));
  }
  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(carrierProfiles)
    .set(updateData as any)
    .where(eq(carrierProfiles.id, profile.id))
    .returning();

  // Синхронизация: при сохранении админом — деактивируем контакты и гражданства из таблиц,
  // чтобы они не «всплывали» при следующей загрузке (GET объединяет legacy + таблицы).
  if (body.phone !== undefined || body.additional_emails !== undefined || body.citizenship !== undefined) {
    const now = new Date();
    if (body.phone !== undefined || body.additional_emails !== undefined) {
      await db.update(driverContacts).set({ deletedAt: now }).where(eq(driverContacts.carrierId, profile.id));
    }
    if (body.citizenship !== undefined) {
      await db.update(driverCitizenships).set({ status: 'revoked', revokedAt: now }).where(eq(driverCitizenships.carrierId, profile.id));
    }
  }

  return {
    id: updated!.id,
    surname: updated!.surname,
    given_name: updated!.givenName,
    patronymic: updated!.patronymic,
    date_of_birth: dateStr(updated!.dateOfBirth),
    citizenship: updated!.citizenship,
    gender: updated!.gender,
    phone: updated!.phone,
    is_verified: updated!.isVerified,
  };
}

// ── Edit requests / Change requests / Verify ──────────────────────

export async function listEditRequests(userId: string) {
  const { profile } = await findDriverProfile(userId);
  const list = await db
    .select({
      id: profileEditRequests.id,
      fieldKey: profileEditRequests.fieldKey,
      status: profileEditRequests.status,
      driverComment: profileEditRequests.driverComment,
      fieldValue: profileEditRequests.fieldValue,
      requestedAt: profileEditRequests.requestedAt,
      resolvedAt: profileEditRequests.resolvedAt,
    })
    .from(profileEditRequests)
    .where(eq(profileEditRequests.carrierId, profile.id))
    .orderBy(desc(profileEditRequests.requestedAt));

  const fieldValue = (fieldKey: string): string => {
    const m = fieldKey.match(/^(.+)_(\d+)$/);
    const addMatch = fieldKey.match(/^(.+)_add$/);
    if (m) {
      const [, base, idx] = m;
      const i = parseInt(idx, 10);
      if (base === 'phone') {
        const arr = (profile.phone ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        return arr[i] ?? '—';
      }
      if (base === 'citizenship') {
        const arr = (profile.citizenship ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        return arr[i] ?? '—';
      }
      if (base === 'additional_emails') {
        const arr = (profile.additionalEmails ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        return arr[i] ?? '—';
      }
    }
    if (addMatch) return '(добавление)';
    if (fieldKey === 'passport_series_number') {
      const s = profile.passportSeries ?? '';
      const n = profile.passportNumber ?? '';
      return [s, n].filter(Boolean).join(' ') || '—';
    }
    const map: Record<string, string | null | undefined> = {
      surname: profile.surname, given_name: profile.givenName, patronymic: profile.patronymic,
      date_of_birth: dateStr(profile.dateOfBirth), citizenship: profile.citizenship, gender: profile.gender,
      status: profile.status, employment_category: profile.employmentCategory, phone: profile.phone,
      additional_emails: profile.additionalEmails, passport_series: profile.passportSeries,
      passport_number: profile.passportNumber, company_name: profile.companyName, license_number: profile.licenseNumber,
      license_expiry: dateStr(profile.licenseExpiry), license_categories: profile.licenseCategories,
      passport_issue_date: dateStr(profile.passportIssueDate), passport_expiry_date: dateStr(profile.passportExpiryDate),
      passport_issued_by: profile.passportIssuedBy, place_of_birth: profile.placeOfBirth,
      residential_address: profile.residentialAddress, passport_scan_url: profile.passportScanUrl ? '(файл загружен)' : null,
    };
    return map[fieldKey] ?? '—';
  };

  return list.map((r) => ({
    id: r.id,
    field_key: r.fieldKey,
    status: r.status,
    driver_comment: r.driverComment,
    requested_at: r.requestedAt,
    resolved_at: r.resolvedAt,
    field_value: r.fieldValue ?? fieldValue(r.fieldKey),
  }));
}

export async function listChangeRequests(userId: string, statusQuery?: string) {
  const { profile } = await findDriverProfile(userId);
  const status = statusQuery ?? 'pending';
  const list = await db
    .select()
    .from(profileChangeRequests)
    .where(
      status === 'all'
        ? eq(profileChangeRequests.carrierId, profile.id)
        : and(eq(profileChangeRequests.carrierId, profile.id), eq(profileChangeRequests.status, status))
    )
    .orderBy(desc(profileChangeRequests.requestedAt));

  const driverName = [profile.surname, profile.givenName, profile.patronymic].filter(Boolean).join(' ') || null;
  return list.map((r) => ({
    id: r.id,
    carrier_id: r.carrierId,
    driver_name: driverName,
    field_key: r.fieldKey,
    current_value: r.currentValue,
    requested_value: r.requestedValue,
    reason: r.reason,
    status: r.status,
    admin_comment: r.adminComment,
    requested_at: dateStr(r.requestedAt),
    resolved_at: dateStr(r.resolvedAt),
    unlocked_until: dateStr(r.unlockedUntil),
  }));
}

const COMBINED_EDIT_FIELDS: Record<string, string[]> = { passport_series_number: ['passport_series', 'passport_number'] };

export async function approveEditRequest(userId: string, requestId: string, adminUserId: string | null) {
  const { profile } = await findDriverProfile(userId);
  const [req] = await db
    .select()
    .from(profileEditRequests)
    .where(and(
      eq(profileEditRequests.id, requestId),
      eq(profileEditRequests.carrierId, profile.id),
      eq(profileEditRequests.status, 'pending'),
    ))
    .limit(1);
  if (!req) throw new PlainError(404, 'Запрос не найден или уже обработан');

  const unlocked = ((profile.unlockedFields as string[]) ?? []).filter(Boolean);
  const keysToAdd = COMBINED_EDIT_FIELDS[req.fieldKey] ?? [req.fieldKey];
  for (const k of keysToAdd) if (!unlocked.includes(k)) unlocked.push(k);

  await db
    .update(profileEditRequests)
    .set({ status: 'approved', resolvedAt: new Date(), resolvedById: adminUserId })
    .where(eq(profileEditRequests.id, requestId));

  const stillPending = await db
    .select()
    .from(profileEditRequests)
    .where(and(
      eq(profileEditRequests.carrierId, profile.id),
      eq(profileEditRequests.status, 'pending'),
    ));
  const newStatus = stillPending.length > 0 ? 'request' : 'waiting_verification';

  await db
    .update(carrierProfiles)
    .set({ unlockedFields: unlocked, verificationStatus: newStatus, updatedAt: new Date() } as any)
    .where(eq(carrierProfiles.id, profile.id));
  return { success: true, field_key: req.fieldKey, unlocked_fields: unlocked };
}

export async function verifyDriver(userId: string) {
  const { profile } = await findDriverProfile(userId);
  const [updated] = await db
    .update(carrierProfiles)
    .set({ isVerified: true, verificationStatus: 'verified', updatedAt: new Date() })
    .where(eq(carrierProfiles.id, profile.id))
    .returning();

  // При верификации водителя активируем все pending документы.
  await db
    .update(driverDocuments)
    .set({ status: 'active', updatedAt: new Date() })
    .where(and(
      eq(driverDocuments.carrierId, profile.id),
      eq(driverDocuments.status, 'pending_verification'),
    ));

  return { success: true, is_verified: updated!.isVerified, verification_status: updated!.verificationStatus };
}

// ── Uploads ───────────────────────────────────────────────────────

async function uploadDriverScan(profileId: string, file: File | undefined, prefix: string, extra = ''): Promise<{ url: string }> {
  // 'Invalid profile' — оригинал отдаёт через error() (raw-string), остальные сообщения этой ручки — {error:'msg'}.
  if (!isUuid(profileId)) throw new PlainError(400, 'Invalid profile');
  if (!file || !file.size) throw new BadRequest('No file');
  const ext = safeExt(file.name || '');
  if (!ext) throw new BadRequest('Только PDF, JPG, PNG (макс. 10 МБ)');
  if (file.size > 10 * 1024 * 1024) throw new BadRequest('Файл слишком большой (макс. 10 МБ)');
  const safeId = profileId.replace(/[^a-z0-9-]/gi, '');
  const filename = `${prefix}${extra ? `_${extra}` : ''}_${randomUUID()}.${ext}`;
  await storage.put(`driver-docs/${safeId}/${filename}`, await file.arrayBuffer());
  return { url: `/cabinet/driver/document-files/${safeId}/${filename}` };
}

export async function uploadPassportScan(userId: string, file: File | undefined) {
  const { profile } = await findDriverProfile(userId);
  return uploadDriverScan(profile.id, file, 'passport');
}

export async function uploadExtraPassportScan(userId: string, file: File | undefined, indexRaw: number | string | undefined) {
  // Старый код не вызывал findDriverProfile (без проверки роли) — оставляем как было: только профиль.
  const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, userId)).limit(1);
  if (!profile) throw new PlainError(404, 'Driver profile not found');
  const rawIndex = typeof indexRaw === 'number' ? indexRaw : (parseInt(String(indexRaw || 0), 10) || 0);
  const index = Math.max(0, Math.min(99, Number.isNaN(rawIndex) ? 0 : rawIndex));
  return uploadDriverScan(profile.id, file, 'passport_extra', String(index));
}

export async function uploadLicenseScan(userId: string, file: File | undefined) {
  const { profile } = await findDriverProfile(userId);
  return uploadDriverScan(profile.id, file, 'license');
}

export async function uploadMedicalScan(userId: string, file: File | undefined) {
  const { profile } = await findDriverProfile(userId);
  return uploadDriverScan(profile.id, file, 'medical');
}

// ── Admin documents (driverDocuments) ─────────────────────────────

function formatDoc(d: any) {
  return {
    id: d.id,
    doc_type: d.docType,
    country: d.country,
    series: d.series,
    number: d.number,
    issued_by: d.issuedBy,
    issued_at: dateStr(d.issuedAt),
    expires_at: dateStr(d.expiresAt),
    place_of_birth: d.placeOfBirth,
    residential_address: d.residentialAddress,
    license_categories: d.licenseCategories,
    scan_url: d.scanUrl,
    status: d.status,
  };
}

export async function listAdminDocuments(userId: string) {
  const { profile } = await findDriverProfile(userId);
  const docs = await db.select().from(driverDocuments).where(and(
    eq(driverDocuments.carrierId, profile.id),
    inArray(driverDocuments.docType, DOC_TYPES_LIST as any),
    inArray(driverDocuments.status, ['active', 'pending_verification']),
  )).orderBy(desc(driverDocuments.createdAt));
  return docs.map(formatDoc);
}

async function findDocOfDriver(userId: string, docId: string) {
  const { profile } = await findDriverProfile(userId);
  const [doc] = await db.select().from(driverDocuments).where(and(
    eq(driverDocuments.id, docId),
    eq(driverDocuments.carrierId, profile.id),
  )).limit(1);
  if (!doc) throw new PlainError(404, 'Document not found');
  return { profile, doc };
}

export async function updateAdminDocument(userId: string, docId: string, body: any) {
  await findDocOfDriver(userId, docId);
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
  if (body.scan_url !== undefined) updateData.scanUrl = body.scan_url;
  const [updated] = await db.update(driverDocuments).set(updateData).where(eq(driverDocuments.id, docId)).returning();
  const r = updated!;
  return {
    id: r.id,
    doc_type: r.docType,
    country: r.country,
    series: r.series,
    number: r.number,
    issued_by: r.issuedBy,
    issued_at: dateStr(r.issuedAt),
    expires_at: dateStr(r.expiresAt),
    place_of_birth: r.placeOfBirth,
    residential_address: r.residentialAddress,
    license_categories: r.licenseCategories,
    scan_url: r.scanUrl,
  };
}

export async function deleteAdminDocument(userId: string, docId: string) {
  await findDocOfDriver(userId, docId);
  await db.update(driverDocuments)
    .set({ status: 'revoked', validUntil: new Date(), updatedAt: new Date() })
    .where(eq(driverDocuments.id, docId));
  return { success: true };
}

export async function updateAdminDocumentStatus(userId: string, docId: string, status: string) {
  await findDocOfDriver(userId, docId);
  if (!['active', 'rejected'].includes(status)) throw new PlainError(400, 'Invalid status');
  await db.update(driverDocuments)
    .set({ status: status as 'active' | 'rejected', updatedAt: new Date() })
    .where(eq(driverDocuments.id, docId));
  return { success: true, id: docId, status };
}

export async function uploadDocumentScan(userId: string, file: File | undefined, docTypeRaw: string | undefined) {
  const { profile } = await findDriverProfile(userId);
  if (!isUuid(profile.id)) throw new PlainError(400, 'Invalid profile');
  if (!file || !file.size) throw new BadRequest('Файл не загружен');
  const ext = safeExt(file.name || '');
  if (!ext) throw new BadRequest('Только PDF, JPG, PNG');
  if (file.size > 10 * 1024 * 1024) throw new BadRequest('Файл слишком большой (макс. 10 МБ)');
  const docType = safeDocType(docTypeRaw);
  const safeId = profile.id.replace(/[^a-z0-9-]/gi, '');
  const filename = `${docType}_${randomUUID()}.${ext}`;
  await storage.put(`driver-docs/${safeId}/${filename}`, await file.arrayBuffer());
  return { url: `/cabinet/driver/document-files/${safeId}/${filename}` };
}

export async function createAdminDocument(userId: string, body: any) {
  const { profile } = await findDriverProfile(userId);
  const docType = body.doc_type as string;
  if (!(DOC_TYPES_LIST as readonly string[]).includes(docType)) throw new PlainError(400, 'Invalid doc_type');
  const licenseCategories = docType === 'adr_certificate' && Array.isArray(body.allowed_classes)
    ? body.allowed_classes.filter(Boolean).join(',')
    : (body.license_categories || null);
  const [doc] = await db.insert(driverDocuments).values({
    carrierId: profile.id,
    docType: docType as any,
    country: body.country || null,
    series: body.series || null,
    number: body.number || null,
    issuedBy: body.issued_by || null,
    issuedAt: body.issued_at ? new Date(body.issued_at) : null,
    expiresAt: body.expires_at ? new Date(body.expires_at) : null,
    placeOfBirth: body.place_of_birth || null,
    residentialAddress: body.residential_address || null,
    licenseCategories,
    scanUrl: body.scan_url || null,
    status: 'active',
  }).returning();
  const r = doc!;
  return {
    id: r.id,
    doc_type: r.docType,
    country: r.country,
    series: r.series,
    number: r.number,
    issued_by: r.issuedBy,
    issued_at: dateStr(r.issuedAt),
    expires_at: dateStr(r.expiresAt),
    place_of_birth: r.placeOfBirth,
    residential_address: r.residentialAddress,
    license_categories: r.licenseCategories,
    scan_url: r.scanUrl,
  };
}
