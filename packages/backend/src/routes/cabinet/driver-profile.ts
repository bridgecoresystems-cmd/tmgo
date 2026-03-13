import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { carrierProfiles } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

export const cabinetDriverProfileRoutes = new Elysia({ prefix: '/cabinet/driver/profile' })
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
  .get('/', async ({ user, carrierProfile }) => {
    const d = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
    return {
      id: carrierProfile.id,
      // 1. Основная информация
      surname: carrierProfile.surname,
      given_name: carrierProfile.givenName,
      patronymic: carrierProfile.patronymic,
      date_of_birth: d(carrierProfile.dateOfBirth),
      citizenship: carrierProfile.citizenship,
      gender: carrierProfile.gender,
      phone: carrierProfile.phone,
      email: user.email,
      additional_emails: carrierProfile.additionalEmails ?? '',
      status: carrierProfile.status,
      employment_category: carrierProfile.employmentCategory,
      // Остальные поля
      company_name: carrierProfile.companyName,
      license_number: carrierProfile.licenseNumber,
      license_expiry: d(carrierProfile.licenseExpiry),
      // 3. Водительское удостоверение
      license_categories: carrierProfile.licenseCategories,
      license_issue_date: d(carrierProfile.licenseIssueDate),
      license_issued_by: carrierProfile.licenseIssuedBy,
      license_scan_url: carrierProfile.licenseScanUrl,
      has_international_license: carrierProfile.hasInternationalLicense,
      international_license_number: carrierProfile.internationalLicenseNumber,
      international_license_validity: carrierProfile.internationalLicenseValidity,
      last_medical_examination_date: d(carrierProfile.lastMedicalExaminationDate),
      hire_source: carrierProfile.hireSource,
      attached_documents: carrierProfile.attachedDocuments,
      inn: carrierProfile.inn,
      address: carrierProfile.address,
      // 2. Паспортные данные
      passport_series: carrierProfile.passportSeries,
      passport_number: carrierProfile.passportNumber,
      passport_issue_date: d(carrierProfile.passportIssueDate),
      passport_expiry_date: d(carrierProfile.passportExpiryDate),
      passport_issued_by: carrierProfile.passportIssuedBy,
      place_of_birth: carrierProfile.placeOfBirth,
      residential_address: carrierProfile.residentialAddress,
      passport_scan_url: carrierProfile.passportScanUrl,
      // 4. Разрешительные документы
      permission_entry_zone: carrierProfile.permissionEntryZone,
      permission_issue_date: d(carrierProfile.permissionIssueDate),
      permission_validity_date: d(carrierProfile.permissionValidityDate),
      medical_certificate: carrierProfile.medicalCertificate,
      medical_certificate_scan_url: carrierProfile.medicalCertificateScanUrl,
      technical_minimum_certificate: carrierProfile.technicalMinimumCertificate,
      tachograph_card_number: carrierProfile.tachographCardNumber,
      other_permits: carrierProfile.otherPermits,
      // Остальные
      bank_name: carrierProfile.bankName,
      bank_account: carrierProfile.bankAccount,
      bank_bik: carrierProfile.bankBik,
      is_verified: carrierProfile.isVerified,
      verification_status: carrierProfile.verificationStatus ?? 'not_verified',
      rating: carrierProfile.rating,
      updated_at: carrierProfile.updatedAt ? carrierProfile.updatedAt.toISOString().slice(0, 10) : null,
    };
  })
  .get('/verification-status', async ({ carrierProfile }) => {
    return { verification_status: carrierProfile.verificationStatus ?? 'not_verified' };
  })
  .patch('/', async ({ carrierProfile, body }) => {
    const updateData: Record<string, unknown> = {};
    if (body.surname !== undefined) updateData.surname = body.surname;
    if (body.given_name !== undefined) updateData.givenName = body.given_name;
    if (body.patronymic !== undefined) updateData.patronymic = body.patronymic;
    if (body.date_of_birth !== undefined) updateData.dateOfBirth = body.date_of_birth ? new Date(body.date_of_birth) : null;
    if (body.citizenship !== undefined) updateData.citizenship = body.citizenship;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.employment_category !== undefined) updateData.employmentCategory = body.employment_category;
    if (body.company_name !== undefined) updateData.companyName = body.company_name;
    if (body.license_number !== undefined) updateData.licenseNumber = body.license_number;
    if (body.license_expiry !== undefined) updateData.licenseExpiry = body.license_expiry ? new Date(body.license_expiry) : null;
    if (body.license_categories !== undefined) updateData.licenseCategories = body.license_categories;
    if (body.license_issue_date !== undefined) updateData.licenseIssueDate = body.license_issue_date ? new Date(body.license_issue_date) : null;
    if (body.license_issued_by !== undefined) updateData.licenseIssuedBy = body.license_issued_by;
    if (body.license_scan_url !== undefined) updateData.licenseScanUrl = body.license_scan_url;
    if (body.has_international_license !== undefined) updateData.hasInternationalLicense = body.has_international_license;
    if (body.international_license_number !== undefined) updateData.internationalLicenseNumber = body.international_license_number;
    if (body.international_license_validity !== undefined) updateData.internationalLicenseValidity = body.international_license_validity;
    if (body.last_medical_examination_date !== undefined) updateData.lastMedicalExaminationDate = body.last_medical_examination_date ? new Date(body.last_medical_examination_date) : null;
    if (body.hire_source !== undefined) updateData.hireSource = body.hire_source;
    if (body.attached_documents !== undefined) updateData.attachedDocuments = body.attached_documents;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.additional_emails !== undefined) updateData.additionalEmails = body.additional_emails;
    if (body.inn !== undefined) updateData.inn = body.inn;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.passport_series !== undefined) updateData.passportSeries = body.passport_series;
    if (body.passport_number !== undefined) updateData.passportNumber = body.passport_number;
    if (body.passport_issue_date !== undefined) updateData.passportIssueDate = body.passport_issue_date ? new Date(body.passport_issue_date) : null;
    if (body.passport_expiry_date !== undefined) updateData.passportExpiryDate = body.passport_expiry_date ? new Date(body.passport_expiry_date) : null;
    if (body.passport_issued_by !== undefined) updateData.passportIssuedBy = body.passport_issued_by;
    if (body.place_of_birth !== undefined) updateData.placeOfBirth = body.place_of_birth;
    if (body.residential_address !== undefined) updateData.residentialAddress = body.residential_address;
    if (body.passport_scan_url !== undefined) updateData.passportScanUrl = body.passport_scan_url;
    if (body.permission_entry_zone !== undefined) updateData.permissionEntryZone = body.permission_entry_zone;
    if (body.permission_issue_date !== undefined) updateData.permissionIssueDate = body.permission_issue_date ? new Date(body.permission_issue_date) : null;
    if (body.permission_validity_date !== undefined) updateData.permissionValidityDate = body.permission_validity_date ? new Date(body.permission_validity_date) : null;
    if (body.medical_certificate !== undefined) updateData.medicalCertificate = body.medical_certificate;
    if (body.medical_certificate_scan_url !== undefined) updateData.medicalCertificateScanUrl = body.medical_certificate_scan_url;
    if (body.technical_minimum_certificate !== undefined) updateData.technicalMinimumCertificate = body.technical_minimum_certificate;
    if (body.tachograph_card_number !== undefined) updateData.tachographCardNumber = body.tachograph_card_number;
    if (body.other_permits !== undefined) updateData.otherPermits = body.other_permits;
    if (body.bank_name !== undefined) updateData.bankName = body.bank_name;
    if (body.bank_account !== undefined) updateData.bankAccount = body.bank_account;
    if (body.bank_bik !== undefined) updateData.bankBik = body.bank_bik;
    updateData.updatedAt = new Date();
    updateData.verificationStatus = 'waiting_verification';

    const [updated] = await db
      .update(carrierProfiles)
      .set(updateData as any)
      .where(eq(carrierProfiles.id, carrierProfile.id))
      .returning();

    const d = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : null);
    return {
      id: updated!.id,
      surname: updated!.surname,
      given_name: updated!.givenName,
      patronymic: updated!.patronymic,
      date_of_birth: d(updated!.dateOfBirth),
      citizenship: updated!.citizenship,
      gender: updated!.gender,
      status: updated!.status,
      employment_category: updated!.employmentCategory,
      company_name: updated!.companyName,
      license_number: updated!.licenseNumber,
      license_expiry: d(updated!.licenseExpiry),
      license_categories: updated!.licenseCategories,
      license_issue_date: d(updated!.licenseIssueDate),
      license_issued_by: updated!.licenseIssuedBy,
      license_scan_url: updated!.licenseScanUrl,
      has_international_license: updated!.hasInternationalLicense,
      international_license_number: updated!.internationalLicenseNumber,
      international_license_validity: updated!.internationalLicenseValidity,
      last_medical_examination_date: d(updated!.lastMedicalExaminationDate),
      hire_source: updated!.hireSource,
      attached_documents: updated!.attachedDocuments,
      phone: updated!.phone,
      additional_emails: updated!.additionalEmails ?? '',
      inn: updated!.inn,
      address: updated!.address,
      passport_series: updated!.passportSeries,
      passport_number: updated!.passportNumber,
      passport_issue_date: d(updated!.passportIssueDate),
      passport_expiry_date: d(updated!.passportExpiryDate),
      passport_issued_by: updated!.passportIssuedBy,
      place_of_birth: updated!.placeOfBirth,
      residential_address: updated!.residentialAddress,
      passport_scan_url: updated!.passportScanUrl,
      permission_entry_zone: updated!.permissionEntryZone,
      permission_issue_date: d(updated!.permissionIssueDate),
      permission_validity_date: d(updated!.permissionValidityDate),
      medical_certificate: updated!.medicalCertificate,
      medical_certificate_scan_url: updated!.medicalCertificateScanUrl,
      technical_minimum_certificate: updated!.technicalMinimumCertificate,
      tachograph_card_number: updated!.tachographCardNumber,
      other_permits: updated!.otherPermits,
      bank_name: updated!.bankName,
      bank_account: updated!.bankAccount,
      bank_bik: updated!.bankBik,
    };
  }, {
    body: t.Object({
      surname: t.Optional(t.Nullable(t.String())),
      given_name: t.Optional(t.Nullable(t.String())),
      patronymic: t.Optional(t.Nullable(t.String())),
      date_of_birth: t.Optional(t.Nullable(t.String())),
      citizenship: t.Optional(t.Nullable(t.String())),
      gender: t.Optional(t.Nullable(t.String())),
      status: t.Optional(t.Nullable(t.String())),
      employment_category: t.Optional(t.Nullable(t.String())),
      company_name: t.Optional(t.Nullable(t.String())),
      license_number: t.Optional(t.Nullable(t.String())),
      license_expiry: t.Optional(t.Nullable(t.String())),
      license_categories: t.Optional(t.Nullable(t.String())),
      license_issue_date: t.Optional(t.Nullable(t.String())),
      license_issued_by: t.Optional(t.Nullable(t.String())),
      license_scan_url: t.Optional(t.Nullable(t.String())),
      has_international_license: t.Optional(t.Nullable(t.Boolean())),
      international_license_number: t.Optional(t.Nullable(t.String())),
      international_license_validity: t.Optional(t.Nullable(t.String())),
      last_medical_examination_date: t.Optional(t.Nullable(t.String())),
      hire_source: t.Optional(t.Nullable(t.String())),
      attached_documents: t.Optional(t.Nullable(t.String())),
      phone: t.Optional(t.Nullable(t.String())),
      additional_emails: t.Optional(t.Nullable(t.String())),
      inn: t.Optional(t.Nullable(t.String())),
      address: t.Optional(t.Nullable(t.String())),
      passport_series: t.Optional(t.Nullable(t.String())),
      passport_number: t.Optional(t.Nullable(t.String())),
      passport_issue_date: t.Optional(t.Nullable(t.String())),
      passport_expiry_date: t.Optional(t.Nullable(t.String())),
      passport_issued_by: t.Optional(t.Nullable(t.String())),
      place_of_birth: t.Optional(t.Nullable(t.String())),
      residential_address: t.Optional(t.Nullable(t.String())),
      passport_scan_url: t.Optional(t.Nullable(t.String())),
      permission_entry_zone: t.Optional(t.Nullable(t.String())),
      permission_issue_date: t.Optional(t.Nullable(t.String())),
      permission_validity_date: t.Optional(t.Nullable(t.String())),
      medical_certificate: t.Optional(t.Nullable(t.String())),
      medical_certificate_scan_url: t.Optional(t.Nullable(t.String())),
      technical_minimum_certificate: t.Optional(t.Nullable(t.String())),
      tachograph_card_number: t.Optional(t.Nullable(t.String())),
      other_permits: t.Optional(t.Nullable(t.String())),
      bank_name: t.Optional(t.Nullable(t.String())),
      bank_account: t.Optional(t.Nullable(t.String())),
      bank_bik: t.Optional(t.Nullable(t.String())),
    }),
  })
  .post('/upload-passport', async ({ carrierProfile, body, set }) => {
    const file = body.file;
    if (!file || !file.size) {
      set.status = 400;
      return { error: 'No file' };
    }
    const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'jpg';
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext)) {
      set.status = 400;
      return { error: 'Только PDF, JPG, PNG (макс. 10 МБ)' };
    }
    if (file.size > 10 * 1024 * 1024) {
      set.status = 400;
      return { error: 'Файл слишком большой (макс. 10 МБ)' };
    }
    const uploadDir = join(process.cwd(), 'storage', 'driver-docs', carrierProfile.id);
    await mkdir(uploadDir, { recursive: true });
    const filename = `passport_${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);
    const buf = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buf));
    const url = `/cabinet/driver/documents/${carrierProfile.id}/${filename}`;
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
    }),
  })
  .post('/upload-license', async ({ carrierProfile, body, set }) => {
    const file = body.file;
    if (!file || !file.size) {
      set.status = 400;
      return { error: 'No file' };
    }
    const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'jpg';
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext)) {
      set.status = 400;
      return { error: 'Только PDF, JPG, PNG (макс. 10 МБ)' };
    }
    if (file.size > 10 * 1024 * 1024) {
      set.status = 400;
      return { error: 'Файл слишком большой (макс. 10 МБ)' };
    }
    const uploadDir = join(process.cwd(), 'storage', 'driver-docs', carrierProfile.id);
    await mkdir(uploadDir, { recursive: true });
    const filename = `license_${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);
    const buf = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buf));
    const url = `/cabinet/driver/documents/${carrierProfile.id}/${filename}`;
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
    }),
  })
  .post('/upload-medical', async ({ carrierProfile, body, set }) => {
    const file = body.file;
    if (!file || !file.size) {
      set.status = 400;
      return { error: 'No file' };
    }
    const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'jpg';
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext)) {
      set.status = 400;
      return { error: 'Только PDF, JPG, PNG (макс. 10 МБ)' };
    }
    if (file.size > 10 * 1024 * 1024) {
      set.status = 400;
      return { error: 'Файл слишком большой (макс. 10 МБ)' };
    }
    const uploadDir = join(process.cwd(), 'storage', 'driver-docs', carrierProfile.id);
    await mkdir(uploadDir, { recursive: true });
    const filename = `medical_${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);
    const buf = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buf));
    const url = `/cabinet/driver/documents/${carrierProfile.id}/${filename}`;
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
    }),
  });
