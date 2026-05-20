import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { eq, and, desc, inArray, isNull } from 'drizzle-orm';
import { db } from '../../db';
import {
  carrierProfiles, profileEditRequests, driverDocuments,
  driverCitizenships, driverContacts, profileVerificationHistory,
} from '../../db/schema';
import { getUnlockedKeys } from '../../lib/field-access';
import { BadRequest, Forbidden } from '../../lib/errors';

type CarrierProfile = typeof carrierProfiles.$inferSelect;
type UserLike = { id: string; email: string | null };

const EDITABLE_FIELD_KEYS = [
  'surname', 'given_name', 'patronymic', 'date_of_birth', 'citizenship', 'gender', 'status', 'employment_category',
  'phone', 'additional_emails', 'company_name', 'license_number', 'license_expiry', 'license_categories',
  'license_issue_date', 'license_issued_by', 'license_scan_url', 'has_international_license',
  'international_license_number', 'international_license_validity', 'last_medical_examination_date',
  'hire_source', 'attached_documents', 'inn', 'address', 'passport_series', 'passport_number',
  'passport_series_number', 'passport_issue_date', 'passport_expiry_date', 'passport_issued_by', 'place_of_birth', 'residential_address',
  'passport_scan_url', 'passport_add', 'permission_entry_zone', 'permission_issue_date', 'permission_validity_date',
  'medical_certificate', 'medical_certificate_scan_url', 'technical_minimum_certificate', 'tachograph_card_number',
  'other_permits', 'bank_name', 'bank_account', 'bank_bik',
] as const;

const COMBINED_FIELDS: Record<string, string[]> = {
  passport_series_number: ['passport_series', 'passport_number'],
};

const MULTI_FIELD_BASES = ['phone', 'citizenship', 'additional_emails'] as const;

const ALLOWED_UPLOAD_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

function isValidFieldKey(key: string): boolean {
  if (EDITABLE_FIELD_KEYS.includes(key as (typeof EDITABLE_FIELD_KEYS)[number])) return true;
  if (key === 'passport_add') return true;
  for (const base of MULTI_FIELD_BASES) {
    if (key === `${base}_add`) return true;
    const m = key.match(new RegExp(`^${base}_(\\d+)$`));
    if (m && parseInt(m[1], 10) >= 0) return true;
  }
  return false;
}

function parseMultiValue(s: string | null | undefined): string[] {
  if (!s || typeof s !== 'string') return [];
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

function mergeMultiValue(
  original: string,
  incoming: string | null | undefined,
  unlocked: string[],
  baseKey: string,
): string {
  const origArr = parseMultiValue(original);
  const inArr = parseMultiValue(incoming);
  const result: string[] = [];
  const canEditAll = unlocked.includes(baseKey);
  const canAdd = canEditAll || unlocked.includes(`${baseKey}_add`);
  for (let i = 0; i < origArr.length; i++) {
    const key = `${baseKey}_${i}`;
    if (canEditAll || unlocked.includes(key)) {
      result.push(inArr[i] ?? origArr[i]);
    } else {
      result.push(origArr[i]);
    }
  }
  for (let i = origArr.length; i < inArr.length; i++) {
    if (canAdd && inArr[i]) result.push(inArr[i]);
  }
  return result.filter(Boolean).join(', ');
}

function buildProfileUpdate(body: Record<string, unknown>) {
  const updateData: Record<string, unknown> = {};
  if (body.surname !== undefined) updateData.surname = body.surname;
  if (body.given_name !== undefined) updateData.givenName = body.given_name;
  if (body.patronymic !== undefined) updateData.patronymic = body.patronymic;
  if (body.date_of_birth !== undefined) updateData.dateOfBirth = body.date_of_birth ? new Date(body.date_of_birth as string) : null;
  if (body.citizenship !== undefined) updateData.citizenship = body.citizenship;
  if (body.gender !== undefined) updateData.gender = body.gender;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.employment_category !== undefined) updateData.employmentCategory = body.employment_category;
  if (body.company_name !== undefined) updateData.companyName = body.company_name;
  if (body.license_number !== undefined) updateData.licenseNumber = body.license_number;
  if (body.license_expiry !== undefined) updateData.licenseExpiry = body.license_expiry ? new Date(body.license_expiry as string) : null;
  if (body.license_categories !== undefined) updateData.licenseCategories = body.license_categories;
  if (body.license_issue_date !== undefined) updateData.licenseIssueDate = body.license_issue_date ? new Date(body.license_issue_date as string) : null;
  if (body.license_issued_by !== undefined) updateData.licenseIssuedBy = body.license_issued_by;
  if (body.license_scan_url !== undefined) updateData.licenseScanUrl = body.license_scan_url;
  if (body.has_international_license !== undefined) updateData.hasInternationalLicense = body.has_international_license;
  if (body.international_license_number !== undefined) updateData.internationalLicenseNumber = body.international_license_number;
  if (body.international_license_validity !== undefined) updateData.internationalLicenseValidity = body.international_license_validity;
  if (body.last_medical_examination_date !== undefined) updateData.lastMedicalExaminationDate = body.last_medical_examination_date ? new Date(body.last_medical_examination_date as string) : null;
  if (body.hire_source !== undefined) updateData.hireSource = body.hire_source;
  if (body.attached_documents !== undefined) updateData.attachedDocuments = body.attached_documents;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.additional_emails !== undefined) updateData.additionalEmails = body.additional_emails;
  if (body.inn !== undefined) updateData.inn = body.inn;
  if (body.address !== undefined) updateData.address = body.address;
  if (body.passport_series !== undefined) updateData.passportSeries = body.passport_series;
  if (body.passport_number !== undefined) updateData.passportNumber = body.passport_number;
  if (body.passport_issue_date !== undefined) updateData.passportIssueDate = body.passport_issue_date ? new Date(body.passport_issue_date as string) : null;
  if (body.passport_expiry_date !== undefined) updateData.passportExpiryDate = body.passport_expiry_date ? new Date(body.passport_expiry_date as string) : null;
  if (body.passport_issued_by !== undefined) updateData.passportIssuedBy = body.passport_issued_by;
  if (body.place_of_birth !== undefined) updateData.placeOfBirth = body.place_of_birth;
  if (body.residential_address !== undefined) updateData.residentialAddress = body.residential_address;
  if (body.passport_scan_url !== undefined) updateData.passportScanUrl = body.passport_scan_url;
  if (body.extra_passports !== undefined) {
    const arr = Array.isArray(body.extra_passports) ? body.extra_passports : [];
    updateData.extraPassports = arr.map((p: Record<string, unknown>) => ({
      passport_series: p.passport_series ?? null,
      passport_number: p.passport_number ?? null,
      passport_issue_date: p.passport_issue_date ?? null,
      passport_expiry_date: p.passport_expiry_date ?? null,
      passport_issued_by: p.passport_issued_by ?? null,
      place_of_birth: p.place_of_birth ?? null,
      residential_address: p.residential_address ?? null,
      passport_scan_url: p.passport_scan_url ?? null,
    }));
  }
  if (body.permission_entry_zone !== undefined) updateData.permissionEntryZone = body.permission_entry_zone;
  if (body.permission_issue_date !== undefined) updateData.permissionIssueDate = body.permission_issue_date ? new Date(body.permission_issue_date as string) : null;
  if (body.permission_validity_date !== undefined) updateData.permissionValidityDate = body.permission_validity_date ? new Date(body.permission_validity_date as string) : null;
  if (body.medical_certificate !== undefined) updateData.medicalCertificate = body.medical_certificate;
  if (body.medical_certificate_scan_url !== undefined) updateData.medicalCertificateScanUrl = body.medical_certificate_scan_url;
  if (body.technical_minimum_certificate !== undefined) updateData.technicalMinimumCertificate = body.technical_minimum_certificate;
  if (body.tachograph_card_number !== undefined) updateData.tachographCardNumber = body.tachograph_card_number;
  if (body.other_permits !== undefined) updateData.otherPermits = body.other_permits;
  if (body.bank_name !== undefined) updateData.bankName = body.bank_name;
  if (body.bank_account !== undefined) updateData.bankAccount = body.bank_account;
  if (body.bank_bik !== undefined) updateData.bankBik = body.bank_bik;
  return updateData;
}

const dateStr = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

// Тело PATCH / и /submit-for-verification возвращает одну и ту же форму — выделили.
function projectUpdated(updated: CarrierProfile) {
  return {
    id: updated.id,
    surname: updated.surname,
    given_name: updated.givenName,
    patronymic: updated.patronymic,
    date_of_birth: dateStr(updated.dateOfBirth),
    citizenship: updated.citizenship,
    gender: updated.gender,
    status: updated.status,
    employment_category: updated.employmentCategory,
    company_name: updated.companyName,
    license_number: updated.licenseNumber,
    license_expiry: dateStr(updated.licenseExpiry),
    license_categories: updated.licenseCategories,
    license_issue_date: dateStr(updated.licenseIssueDate),
    license_issued_by: updated.licenseIssuedBy,
    license_scan_url: updated.licenseScanUrl,
    has_international_license: updated.hasInternationalLicense,
    international_license_number: updated.internationalLicenseNumber,
    international_license_validity: updated.internationalLicenseValidity,
    last_medical_examination_date: dateStr(updated.lastMedicalExaminationDate),
    hire_source: updated.hireSource,
    attached_documents: updated.attachedDocuments,
    phone: updated.phone,
    additional_emails: updated.additionalEmails ?? '',
    inn: updated.inn,
    address: updated.address,
    passport_series: updated.passportSeries,
    passport_number: updated.passportNumber,
    passport_issue_date: dateStr(updated.passportIssueDate),
    passport_expiry_date: dateStr(updated.passportExpiryDate),
    passport_issued_by: updated.passportIssuedBy,
    place_of_birth: updated.placeOfBirth,
    residential_address: updated.residentialAddress,
    passport_scan_url: updated.passportScanUrl,
    passport_is_active: updated.passportIsActive,
    permission_entry_zone: updated.permissionEntryZone,
    permission_issue_date: dateStr(updated.permissionIssueDate),
    permission_validity_date: dateStr(updated.permissionValidityDate),
    medical_certificate: updated.medicalCertificate,
    medical_certificate_scan_url: updated.medicalCertificateScanUrl,
    technical_minimum_certificate: updated.technicalMinimumCertificate,
    tachograph_card_number: updated.tachographCardNumber,
    other_permits: updated.otherPermits,
    bank_name: updated.bankName,
    bank_account: updated.bankAccount,
    bank_bik: updated.bankBik,
    extra_passports: (updated.extraPassports as unknown[]) ?? [],
  };
}

// ── GET / ──
export async function getProfile(user: UserLike, carrierProfile: CarrierProfile) {
  const changeRequestUnlocked = await getUnlockedKeys(carrierProfile.id);
  const unlocked_fields = [...changeRequestUnlocked];

  const legacyCitizenships = (carrierProfile.citizenship ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const citizenshipsFromTable = await db.select({ country: driverCitizenships.country })
    .from(driverCitizenships)
    .where(and(eq(driverCitizenships.carrierId, carrierProfile.id), eq(driverCitizenships.status, 'active')));
  const allCitizenships = [...new Set([...legacyCitizenships, ...citizenshipsFromTable.map((c) => c.country).filter(Boolean)])];
  const citizenship = allCitizenships.join(', ');

  const legacyPhones = (carrierProfile.phone ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const contactsFromTable = await db.select({ value: driverContacts.value })
    .from(driverContacts)
    .where(and(
      eq(driverContacts.carrierId, carrierProfile.id),
      eq(driverContacts.contactType, 'phone'),
      eq(driverContacts.isActive, true),
      isNull(driverContacts.deletedAt),
    ));
  const allPhones = [...new Set([...legacyPhones, ...contactsFromTable.map((c) => c.value).filter(Boolean)])];
  const phone = allPhones.join(', ');

  const legacyEmails = (carrierProfile.additionalEmails ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const emailsFromTable = await db.select({ value: driverContacts.value })
    .from(driverContacts)
    .where(and(
      eq(driverContacts.carrierId, carrierProfile.id),
      eq(driverContacts.contactType, 'email'),
      eq(driverContacts.isActive, true),
      isNull(driverContacts.deletedAt),
    ));
  const allEmails = [...new Set([...legacyEmails, ...emailsFromTable.map((c) => c.value).filter(Boolean)])];
  const additional_emails = allEmails.join(', ');

  const fetchActiveDocs = (docType: string) =>
    db.select().from(driverDocuments)
      .where(and(
        eq(driverDocuments.carrierId, carrierProfile.id),
        eq(driverDocuments.docType, docType),
        inArray(driverDocuments.status, ['active', 'pending_verification']),
      ))
      .orderBy(desc(driverDocuments.createdAt));

  const passportDocs = await fetchActiveDocs('passport');
  const passports_from_documents = passportDocs.map((doc) => ({
    id: doc.id,
    series: doc.series,
    number: doc.number,
    issued_by: doc.issuedBy,
    issued_at: dateStr(doc.issuedAt),
    expires_at: dateStr(doc.expiresAt),
    place_of_birth: doc.placeOfBirth,
    residential_address: doc.residentialAddress,
    scan_url: doc.scanUrl,
    status: doc.status,
  }));

  const licenseDocs = await fetchActiveDocs('drivers_license');
  const licenses_from_documents = licenseDocs.map((doc) => ({
    id: doc.id,
    number: doc.number,
    issued_by: doc.issuedBy,
    issued_at: dateStr(doc.issuedAt),
    expires_at: dateStr(doc.expiresAt),
    license_categories: doc.licenseCategories,
    scan_url: doc.scanUrl,
    status: doc.status,
  }));

  const visaDocs = await fetchActiveDocs('visa');
  const visas_from_documents = visaDocs.map((doc) => ({
    id: doc.id,
    country: doc.country,
    number: doc.number,
    issued_at: dateStr(doc.issuedAt),
    expires_at: dateStr(doc.expiresAt),
    scan_url: doc.scanUrl,
    status: doc.status,
  }));

  const medicalDocs = await fetchActiveDocs('medical_certificate');
  const medical_certificates_from_documents = medicalDocs.map((doc) => ({
    id: doc.id,
    number: doc.number,
    issued_at: dateStr(doc.issuedAt),
    expires_at: dateStr(doc.expiresAt),
    scan_url: doc.scanUrl,
    status: doc.status,
  }));

  const tachographDocs = await fetchActiveDocs('tachograph_card');
  const tachograph_cards_from_documents = tachographDocs.map((doc) => ({
    id: doc.id,
    number: doc.number,
    country: doc.country,
    issued_at: dateStr(doc.issuedAt),
    expires_at: dateStr(doc.expiresAt),
    scan_url: doc.scanUrl,
    status: doc.status,
  }));

  const techMinDocs = await fetchActiveDocs('technical_minimum_cert');
  const technical_minimum_certs_from_documents = techMinDocs.map((doc) => ({
    id: doc.id,
    number: doc.number,
    issued_by: doc.issuedBy,
    issued_at: dateStr(doc.issuedAt),
    expires_at: dateStr(doc.expiresAt),
    scan_url: doc.scanUrl,
    status: doc.status,
  }));

  const adrDocs = await fetchActiveDocs('adr_certificate');
  const adr_certs_from_documents = adrDocs.map((doc) => {
    const allowed = doc.licenseCategories ? doc.licenseCategories.split(',').map((s) => s.trim()).filter(Boolean) : [];
    return {
      id: doc.id,
      issued_by: doc.issuedBy,
      number: doc.number,
      allowed_classes: allowed,
      license_categories: doc.licenseCategories,
      issued_at: dateStr(doc.issuedAt),
      expires_at: dateStr(doc.expiresAt),
      scan_url: doc.scanUrl,
      status: doc.status,
    };
  });

  return {
    id: carrierProfile.id,
    surname: carrierProfile.surname,
    given_name: carrierProfile.givenName,
    patronymic: carrierProfile.patronymic,
    date_of_birth: dateStr(carrierProfile.dateOfBirth),
    citizenship,
    gender: carrierProfile.gender,
    phone,
    email: user.email,
    additional_emails,
    status: carrierProfile.status,
    employment_category: carrierProfile.employmentCategory,
    company_name: carrierProfile.companyName,
    license_number: carrierProfile.licenseNumber,
    license_expiry: dateStr(carrierProfile.licenseExpiry),
    license_categories: carrierProfile.licenseCategories,
    license_issue_date: dateStr(carrierProfile.licenseIssueDate),
    license_issued_by: carrierProfile.licenseIssuedBy,
    license_scan_url: carrierProfile.licenseScanUrl,
    licenses_from_documents,
    has_international_license: carrierProfile.hasInternationalLicense,
    international_license_number: carrierProfile.internationalLicenseNumber,
    international_license_validity: carrierProfile.internationalLicenseValidity,
    last_medical_examination_date: dateStr(carrierProfile.lastMedicalExaminationDate),
    hire_source: carrierProfile.hireSource,
    attached_documents: carrierProfile.attachedDocuments,
    inn: carrierProfile.inn,
    address: carrierProfile.address,
    passport_series: carrierProfile.passportSeries,
    passport_number: carrierProfile.passportNumber,
    passport_issue_date: dateStr(carrierProfile.passportIssueDate),
    passport_expiry_date: dateStr(carrierProfile.passportExpiryDate),
    passport_issued_by: carrierProfile.passportIssuedBy,
    place_of_birth: carrierProfile.placeOfBirth,
    residential_address: carrierProfile.residentialAddress,
    passport_scan_url: carrierProfile.passportScanUrl,
    passport_is_active: carrierProfile.passportIsActive,
    extra_passports: (carrierProfile.extraPassports as unknown[]) ?? [],
    passports_from_documents,
    visas_from_documents,
    medical_certificates_from_documents,
    tachograph_cards_from_documents,
    technical_minimum_certs_from_documents,
    adr_certs_from_documents,
    permission_entry_zone: carrierProfile.permissionEntryZone,
    permission_issue_date: dateStr(carrierProfile.permissionIssueDate),
    permission_validity_date: dateStr(carrierProfile.permissionValidityDate),
    medical_certificate: carrierProfile.medicalCertificate,
    medical_certificate_scan_url: carrierProfile.medicalCertificateScanUrl,
    technical_minimum_certificate: carrierProfile.technicalMinimumCertificate,
    tachograph_card_number: carrierProfile.tachographCardNumber,
    other_permits: carrierProfile.otherPermits,
    bank_name: carrierProfile.bankName,
    bank_account: carrierProfile.bankAccount,
    bank_bik: carrierProfile.bankBik,
    is_verified: carrierProfile.isVerified,
    is_online: carrierProfile.isOnline ?? false,
    verification_status: carrierProfile.verificationStatus ?? 'not_verified',
    unlocked_fields,
    hidden_fields: (carrierProfile.hiddenFields as string[]) ?? [],
    rating: carrierProfile.rating,
    updated_at: carrierProfile.updatedAt ? carrierProfile.updatedAt.toISOString().slice(0, 10) : null,
  };
}

// ── GET /verification-status ──
export async function getVerificationStatus(carrierProfile: CarrierProfile) {
  const vStatus = carrierProfile.verificationStatus ?? 'not_verified';
  const LOCKED = ['submitted', 'verified', 'suspended', 'waiting_verification', 'request'];
  const can_edit = !LOCKED.includes(vStatus);

  const missing: string[] = [];
  if (!carrierProfile.surname?.trim()) missing.push('surname');
  if (!carrierProfile.givenName?.trim()) missing.push('given_name');
  if (!carrierProfile.dateOfBirth) missing.push('date_of_birth');
  if (!carrierProfile.gender?.trim()) missing.push('gender');

  const docs = await db.select({ docType: driverDocuments.docType }).from(driverDocuments)
    .where(and(eq(driverDocuments.carrierId, carrierProfile.id), inArray(driverDocuments.status, ['active', 'pending_verification'])));
  const hasPassport = docs.some((d) => d.docType === 'passport');
  const hasLicense = docs.some((d) => d.docType === 'drivers_license');
  if (!hasPassport) missing.push('passport');
  if (!hasLicense) missing.push('drivers_license');

  const citizenships = await db.select().from(driverCitizenships)
    .where(and(eq(driverCitizenships.carrierId, carrierProfile.id), eq(driverCitizenships.status, 'active')));
  if (citizenships.length === 0 && !carrierProfile.citizenship?.trim()) missing.push('citizenship');

  return {
    status: vStatus,
    submitted_at: carrierProfile.submittedAt ? new Date(carrierProfile.submittedAt).toISOString().slice(0, 10) : null,
    comment: carrierProfile.verificationComment ?? null,
    can_edit,
    missing_fields: missing,
    unlocked_fields: (carrierProfile.unlockedFields as string[]) ?? [],
  };
}

// ── GET /edit-requests ──
export async function listEditRequests(carrierProfile: CarrierProfile) {
  const list = await db
    .select()
    .from(profileEditRequests)
    .where(eq(profileEditRequests.carrierId, carrierProfile.id))
    .orderBy(desc(profileEditRequests.requestedAt));
  const fieldValue = (fieldKey: string): string => {
    const m = fieldKey.match(/^(.+)_(\d+)$/);
    const addMatch = fieldKey.match(/^(.+)_add$/);
    if (m) {
      const [, base, idx] = m;
      const i = parseInt(idx, 10);
      if (base === 'phone') {
        const arr = (carrierProfile.phone ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        return arr[i] ?? '—';
      }
      if (base === 'citizenship') {
        const arr = (carrierProfile.citizenship ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        return arr[i] ?? '—';
      }
      if (base === 'additional_emails') {
        const arr = (carrierProfile.additionalEmails ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        return arr[i] ?? '—';
      }
    }
    if (addMatch) return '(добавление)';
    if (fieldKey === 'passport_add') return '(добавление второго паспорта)';
    const map: Record<string, string | null | undefined> = {
      surname: carrierProfile.surname, given_name: carrierProfile.givenName, patronymic: carrierProfile.patronymic,
      date_of_birth: dateStr(carrierProfile.dateOfBirth), citizenship: carrierProfile.citizenship, gender: carrierProfile.gender,
      status: carrierProfile.status, employment_category: carrierProfile.employmentCategory, phone: carrierProfile.phone,
      additional_emails: carrierProfile.additionalEmails, passport_series: carrierProfile.passportSeries,
      passport_number: carrierProfile.passportNumber, company_name: carrierProfile.companyName,
      license_number: carrierProfile.licenseNumber, license_expiry: dateStr(carrierProfile.licenseExpiry),
      license_categories: carrierProfile.licenseCategories, passport_issue_date: dateStr(carrierProfile.passportIssueDate),
      passport_expiry_date: dateStr(carrierProfile.passportExpiryDate), passport_issued_by: carrierProfile.passportIssuedBy,
      place_of_birth: carrierProfile.placeOfBirth, residential_address: carrierProfile.residentialAddress,
    };
    const v = map[fieldKey];
    return v ?? '—';
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

// ── PATCH / ──
export async function updateProfile(carrierProfile: CarrierProfile, body: Record<string, unknown>) {
  const status = carrierProfile.verificationStatus ?? 'not_verified';
  const changeRequestUnlocked = await getUnlockedKeys(carrierProfile.id);
  const unlocked = [...changeRequestUnlocked];

  let updateData = buildProfileUpdate(body);

  if (['waiting_verification', 'verified', 'request', 'submitted', 'suspended'].includes(status)) {
    const allowedKeys = new Set(unlocked);
    const dbToFieldKey: Record<string, string> = {
      surname: 'surname', givenName: 'given_name', patronymic: 'patronymic', dateOfBirth: 'date_of_birth',
      citizenship: 'citizenship', gender: 'gender', status: 'status', employmentCategory: 'employment_category',
      phone: 'phone', additionalEmails: 'additional_emails', companyName: 'company_name', licenseNumber: 'license_number',
      licenseExpiry: 'license_expiry', licenseCategories: 'license_categories', licenseIssueDate: 'license_issue_date',
      licenseIssuedBy: 'license_issued_by', licenseScanUrl: 'license_scan_url', hasInternationalLicense: 'has_international_license',
      internationalLicenseNumber: 'international_license_number', internationalLicenseValidity: 'international_license_validity',
      lastMedicalExaminationDate: 'last_medical_examination_date', hireSource: 'hire_source', attachedDocuments: 'attached_documents',
      inn: 'inn', address: 'address', passportSeries: 'passport_series', passportNumber: 'passport_number',
      passportIssueDate: 'passport_issue_date', passportExpiryDate: 'passport_expiry_date', passportIssuedBy: 'passport_issued_by',
      placeOfBirth: 'place_of_birth', residentialAddress: 'residential_address', passportScanUrl: 'passport_scan_url',
      permissionEntryZone: 'permission_entry_zone', permissionIssueDate: 'permission_issue_date', permissionValidityDate: 'permission_validity_date',
      medicalCertificate: 'medical_certificate', medicalCertificateScanUrl: 'medical_certificate_scan_url',
      technicalMinimumCertificate: 'technical_minimum_certificate', tachographCardNumber: 'tachograph_card_number',
      otherPermits: 'other_permits', bankName: 'bank_name', bankAccount: 'bank_account', bankBik: 'bank_bik',
    };
    const filtered: Record<string, unknown> = {};
    for (const [dbKey, v] of Object.entries(updateData)) {
      const fieldKey = dbToFieldKey[dbKey] ?? dbKey;
      if (fieldKey === 'phone' || fieldKey === 'citizenship' || fieldKey === 'additional_emails') {
        const hasAnyUnlock = allowedKeys.has(fieldKey) || unlocked.some((k) => k.startsWith(`${fieldKey}_`));
        if (hasAnyUnlock) {
          const orig =
            fieldKey === 'phone' ? (carrierProfile.phone ?? '') :
            fieldKey === 'citizenship' ? (carrierProfile.citizenship ?? '') :
            (carrierProfile.additionalEmails ?? '');
          const merged = mergeMultiValue(orig, v as string, unlocked, fieldKey);
          if (fieldKey === 'phone') filtered.phone = merged;
          else if (fieldKey === 'additional_emails') filtered.additionalEmails = merged;
          else filtered.citizenship = merged;
        }
      } else if (allowedKeys.has(fieldKey)) {
        filtered[dbKey] = v;
      } else if (dbKey === 'extraPassports' && allowedKeys.has('passport_add')) {
        filtered.extraPassports = v;
      } else {
        const combined = Object.entries(COMBINED_FIELDS).find(([, keys]) => keys.includes(fieldKey));
        if (combined && allowedKeys.has(combined[0])) filtered[dbKey] = v;
      }
    }
    updateData = filtered;
    if (Object.keys(updateData).length === 0) {
      throw new Forbidden('Нет прав на редактирование. Отправьте запрос на изменение.');
    }
  }

  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(carrierProfiles)
    .set(updateData)
    .where(eq(carrierProfiles.id, carrierProfile.id))
    .returning();

  return projectUpdated(updated!);
}

// ── PATCH /online-status ──
export async function updateOnlineStatus(carrierProfile: CarrierProfile, isOnline: boolean) {
  const [updated] = await db
    .update(carrierProfiles)
    .set({ isOnline, updatedAt: new Date() })
    .where(eq(carrierProfiles.id, carrierProfile.id))
    .returning();
  return { is_online: updated!.isOnline };
}

// ── POST /submit-for-verification ──
export async function submitForVerification(carrierProfile: CarrierProfile, body: Record<string, unknown>) {
  const prevStatus = carrierProfile.verificationStatus ?? 'not_submitted';
  const canSubmit = ['not_submitted', 'draft', 'not_verified'].includes(prevStatus);
  if (!canSubmit) {
    throw new BadRequest('Для повторной отправки используйте /resubmit');
  }
  const updateData = buildProfileUpdate(body);
  updateData.updatedAt = new Date();
  updateData.verificationStatus = 'submitted';
  updateData.submittedAt = new Date();
  updateData.unlockedFields = [];

  // Синхронизация legacy → driver_documents/driver_citizenships (если водитель заполнил только форму).
  const merged = { ...carrierProfile, ...updateData } as CarrierProfile;
  const existingDocs = await db.select({ docType: driverDocuments.docType })
    .from(driverDocuments)
    .where(eq(driverDocuments.carrierId, carrierProfile.id));
  const hasPassport = existingDocs.some((d) => d.docType === 'passport');
  const hasLicense = existingDocs.some((d) => d.docType === 'drivers_license');
  if (!hasPassport && (merged.passportSeries || merged.passportNumber)) {
    await db.insert(driverDocuments).values({
      carrierId: carrierProfile.id,
      docType: 'passport',
      series: merged.passportSeries ?? null,
      number: merged.passportNumber ?? null,
      issuedBy: merged.passportIssuedBy ?? null,
      issuedAt: merged.passportIssueDate ?? null,
      expiresAt: merged.passportExpiryDate ?? null,
      placeOfBirth: merged.placeOfBirth ?? null,
      residentialAddress: merged.residentialAddress ?? null,
      scanUrl: merged.passportScanUrl ?? null,
      status: 'pending_verification',
    });
  }
  if (!hasLicense && merged.licenseNumber) {
    await db.insert(driverDocuments).values({
      carrierId: carrierProfile.id,
      docType: 'drivers_license',
      number: merged.licenseNumber,
      issuedBy: merged.licenseIssuedBy ?? null,
      issuedAt: merged.licenseIssueDate ?? null,
      expiresAt: merged.licenseExpiry ?? null,
      licenseCategories: merged.licenseCategories ?? null,
      scanUrl: merged.licenseScanUrl ?? null,
      status: 'pending_verification',
    });
  }
  const existingCitizenships = await db.select().from(driverCitizenships)
    .where(eq(driverCitizenships.carrierId, carrierProfile.id));
  const citizenshipList = (merged.citizenship ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  for (const country of citizenshipList) {
    if (!existingCitizenships.some((c) => c.country === country)) {
      await db.insert(driverCitizenships).values({
        carrierId: carrierProfile.id,
        country,
        status: 'active',
      });
    }
  }

  const [updated] = await db
    .update(carrierProfiles)
    .set(updateData)
    .where(eq(carrierProfiles.id, carrierProfile.id))
    .returning();

  await db.insert(profileVerificationHistory).values({
    carrierId: carrierProfile.id,
    action: 'submitted',
    previousStatus: prevStatus,
    newStatus: 'submitted',
    performedBy: carrierProfile.userId,
    performedByRole: 'driver',
  });

  return {
    success: true,
    verification_status: 'submitted',
    submitted_at: updated!.submittedAt ? new Date(updated!.submittedAt).toISOString().slice(0, 10) : null,
    ...projectUpdated(updated!),
  };
}

// ── POST /resubmit ──
export async function resubmitProfile(carrierProfile: CarrierProfile, body: Record<string, unknown> | undefined) {
  const vStatus = carrierProfile.verificationStatus ?? 'not_verified';
  if (vStatus !== 'rejected') {
    throw new BadRequest('Повторно отправить можно только после отклонения');
  }
  const prevStatus = vStatus;
  const updateData = buildProfileUpdate((body ?? {}) as Record<string, unknown>);
  updateData.updatedAt = new Date();
  updateData.verificationStatus = 'submitted';
  updateData.submittedAt = new Date();
  updateData.verificationComment = null;
  updateData.unlockedFields = [];

  const [updated] = await db
    .update(carrierProfiles)
    .set(updateData)
    .where(eq(carrierProfiles.id, carrierProfile.id))
    .returning();

  await db.insert(profileVerificationHistory).values({
    carrierId: carrierProfile.id,
    action: 'resubmitted',
    previousStatus: prevStatus,
    newStatus: 'submitted',
    performedBy: carrierProfile.userId,
    performedByRole: 'driver',
  });

  return {
    success: true,
    verification_status: 'submitted',
    submitted_at: updated!.submittedAt ? new Date(updated!.submittedAt).toISOString().slice(0, 10) : null,
  };
}

// ── POST /change-request ──
export async function createChangeRequest(
  carrierProfile: CarrierProfile,
  body: { field_key: string; comment?: string | null; requested_value?: string | null },
) {
  const status = carrierProfile.verificationStatus ?? 'not_verified';
  if (status === 'not_verified') {
    throw new BadRequest('Сначала отправьте карточку на верификацию');
  }
  const fieldKey = body.field_key;
  if (!isValidFieldKey(fieldKey)) {
    throw new BadRequest('Неизвестное поле');
  }
  const unlocked = (carrierProfile.unlockedFields as string[]) ?? [];
  const keysToCheck = COMBINED_FIELDS[fieldKey] ?? [fieldKey];
  if (keysToCheck.some((k) => unlocked.includes(k))) {
    throw new BadRequest('Поле уже разблокировано для редактирования');
  }
  const conflictingKeys = new Set([fieldKey, ...(COMBINED_FIELDS[fieldKey] ?? [])]);
  const allPending = await db
    .select({ fieldKey: profileEditRequests.fieldKey })
    .from(profileEditRequests)
    .where(and(
      eq(profileEditRequests.carrierId, carrierProfile.id),
      eq(profileEditRequests.status, 'pending'),
    ));
  const hasConflict = allPending.some((r) =>
    r.fieldKey === fieldKey || (COMBINED_FIELDS[r.fieldKey] ?? []).some((k) => conflictingKeys.has(k)),
  );
  if (hasConflict) {
    throw new BadRequest('Запрос на изменение уже отправлен');
  }
  const fieldValueAtRequest = (): string => {
    if (body.requested_value && typeof body.requested_value === 'string') return body.requested_value.trim();
    const m = fieldKey.match(/^(.+)_(\d+)$/);
    const addMatch = fieldKey.match(/^(.+)_add$/);
    if (m) {
      const [, base, idx] = m;
      const i = parseInt(idx, 10);
      if (base === 'phone') {
        const arr = (carrierProfile.phone ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        return arr[i] ?? '—';
      }
      if (base === 'citizenship') {
        const arr = (carrierProfile.citizenship ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        return arr[i] ?? '—';
      }
      if (base === 'additional_emails') {
        const arr = (carrierProfile.additionalEmails ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        return arr[i] ?? '—';
      }
    }
    if (addMatch) return '(добавление)';
    if (fieldKey === 'passport_series_number') {
      const s = carrierProfile.passportSeries ?? '';
      const n = carrierProfile.passportNumber ?? '';
      return [s, n].filter(Boolean).join(' ') || '—';
    }
    const map: Record<string, string | null | undefined> = {
      surname: carrierProfile.surname, given_name: carrierProfile.givenName, patronymic: carrierProfile.patronymic,
      date_of_birth: dateStr(carrierProfile.dateOfBirth), citizenship: carrierProfile.citizenship, gender: carrierProfile.gender,
      status: carrierProfile.status, employment_category: carrierProfile.employmentCategory, phone: carrierProfile.phone,
      additional_emails: carrierProfile.additionalEmails, passport_series: carrierProfile.passportSeries,
      passport_number: carrierProfile.passportNumber, company_name: carrierProfile.companyName,
      license_number: carrierProfile.licenseNumber, license_expiry: dateStr(carrierProfile.licenseExpiry),
      license_categories: carrierProfile.licenseCategories, passport_issue_date: dateStr(carrierProfile.passportIssueDate),
      passport_expiry_date: dateStr(carrierProfile.passportExpiryDate), passport_issued_by: carrierProfile.passportIssuedBy,
      place_of_birth: carrierProfile.placeOfBirth, residential_address: carrierProfile.residentialAddress,
      passport_scan_url: carrierProfile.passportScanUrl ? '(файл загружен)' : null,
    };
    return map[fieldKey] ?? '—';
  };
  const [req] = await db
    .insert(profileEditRequests)
    .values({
      carrierId: carrierProfile.id,
      fieldKey,
      status: 'pending',
      driverComment: body.comment ?? null,
      fieldValue: fieldValueAtRequest(),
    })
    .returning();

  await db
    .update(carrierProfiles)
    .set({ verificationStatus: 'request', updatedAt: new Date() })
    .where(eq(carrierProfiles.id, carrierProfile.id));

  return { success: true, id: req!.id, field_key: fieldKey, status: 'pending', verification_status: 'request' };
}

// ── Uploads (общий helper) ──
async function saveUpload(carrierId: string, file: File, prefix: string): Promise<string> {
  if (!file || !file.size) {
    throw new BadRequest('No file');
  }
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'jpg';
  if (!ALLOWED_UPLOAD_EXT.includes(ext)) {
    throw new BadRequest('Только PDF, JPG, PNG (макс. 10 МБ)');
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new BadRequest('Файл слишком большой (макс. 10 МБ)');
  }
  const safeCarrierId = carrierId.replace(/[^a-z0-9-]/gi, '');
  const uploadDir = join(process.cwd(), 'storage', 'driver-docs', safeCarrierId);
  await mkdir(uploadDir, { recursive: true });
  const filename = `${prefix}_${randomUUID()}.${ext}`;
  const filepath = join(uploadDir, filename);
  const buf = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(buf));
  return `/cabinet/driver/document-files/${safeCarrierId}/${filename}`;
}

export async function uploadPassport(carrierProfile: CarrierProfile, file: File) {
  const status = carrierProfile.verificationStatus ?? 'not_verified';
  const unlocked = (carrierProfile.unlockedFields as string[]) ?? [];
  if (['waiting_verification', 'verified', 'request'].includes(status) && !unlocked.includes('passport_scan_url')) {
    throw new Forbidden('Нет прав на загрузку. Отправьте запрос на изменение.');
  }
  const url = await saveUpload(carrierProfile.id, file, 'passport');
  return { url };
}

export async function uploadExtraPassport(
  carrierProfile: CarrierProfile,
  file: File,
  rawIndex: number | string | undefined,
) {
  const status = carrierProfile.verificationStatus ?? 'not_verified';
  const unlocked = (carrierProfile.unlockedFields as string[]) ?? [];
  if (['waiting_verification', 'verified', 'request'].includes(status) && !unlocked.includes('passport_add')) {
    throw new Forbidden('Нет прав. Отправьте запрос на добавление паспорта.');
  }
  const index = typeof rawIndex === 'number' ? rawIndex : (parseInt(String(rawIndex || 0), 10) || 0);
  const url = await saveUpload(carrierProfile.id, file, `passport_extra_${index}`);
  return { url };
}

export async function uploadLicense(carrierProfile: CarrierProfile, file: File) {
  const url = await saveUpload(carrierProfile.id, file, 'license');
  return { url };
}

export async function uploadMedical(carrierProfile: CarrierProfile, file: File) {
  // Историческое поведение: /upload-medical НЕ санитизирует carrierId в пути.
  if (!file || !file.size) throw new BadRequest('No file');
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'jpg';
  if (!ALLOWED_UPLOAD_EXT.includes(ext)) throw new BadRequest('Только PDF, JPG, PNG (макс. 10 МБ)');
  if (file.size > MAX_UPLOAD_SIZE) throw new BadRequest('Файл слишком большой (макс. 10 МБ)');
  const uploadDir = join(process.cwd(), 'storage', 'driver-docs', carrierProfile.id);
  await mkdir(uploadDir, { recursive: true });
  const filename = `medical_${randomUUID()}.${ext}`;
  const filepath = join(uploadDir, filename);
  const buf = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(buf));
  return { url: `/cabinet/driver/document-files/${carrierProfile.id}/${filename}` };
}
