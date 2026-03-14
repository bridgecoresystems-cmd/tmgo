import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { users, accounts, carrierProfiles, sessions, profileEditRequests } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserFromRequest } from '../../lib/auth';

export const adminUsersRoutes = new Elysia({ prefix: '/admin/users' })
  .derive(async ({ request, set }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      set.status = 401;
      throw new Error('Unauthorized');
    }
    return { adminUser: user };
  })
  .post('/', async ({ body, error }) => {
    const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) {
      return error(400, 'Пользователь с таким email уже существует');
    }
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
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
      name: t.Optional(t.String()),
      role: t.Union([t.Literal('admin'), t.Literal('dispatcher')]),
    }),
  })
  .get('/', async ({ query }) => {
    const q = query as { include_inactive?: string; inactive_only?: string };
    const includeInactive = q.include_inactive === '1';
    const inactiveOnly = q.inactive_only === '1';
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
      };
    });
  })
  .get('/:id', async ({ params, error }) => {
    const [found] = await db.select().from(users).where(eq(users.id, params.id));
    if (!found) return error(404, 'User not found');
    return found;
  })
  .patch('/:id', async ({ params, body, error }) => {
    const [updated] = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, params.id))
      .returning();
    if (!updated) return error(404, 'User not found');
    return updated;
  }, {
    body: t.Object({
      role: t.Optional(t.Union([
        t.Literal('client'),
        t.Literal('driver'),
        t.Literal('dispatcher'),
        t.Literal('admin'),
      ])),
      name: t.Optional(t.String()),
    }),
  })
  .post('/:id/activate', async ({ params, error }) => {
    const [updated] = await db
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, params.id))
      .returning();
    if (!updated) return error(404, 'User not found');
    return { success: true, message: 'Пользователь восстановлен' };
  })
  .post('/:id/deactivate', async ({ params, error }) => {
    const [target] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!target) return error(404, 'User not found');
    if (target.role === 'admin') {
      const activeAdmins = await db.select().from(users).where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
      if (activeAdmins.length <= 1) {
        return error(400, 'Нельзя деактивировать последнего администратора');
      }
    }
    const [updated] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, params.id))
      .returning();
    if (!updated) return error(404, 'User not found');
    await db.delete(sessions).where(eq(sessions.userId, params.id));
    return { success: true, message: 'Пользователь деактивирован' };
  })
  .delete('/:id', async ({ params, error }) => {
    const [target] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!target) return error(404, 'User not found');
    if (target.role === 'admin') {
      const admins = await db.select().from(users).where(eq(users.role, 'admin'));
      if (admins.length <= 1) {
        return error(400, 'Нельзя удалить последнего администратора');
      }
    }
    await db.delete(users).where(eq(users.id, params.id));
    return { success: true, message: 'Пользователь удалён навсегда' };
  })
  .get('/:id/driver-profile', async ({ params, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    const d = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : null);
    return {
      id: profile.id,
      surname: profile.surname,
      given_name: profile.givenName,
      patronymic: profile.patronymic,
      date_of_birth: d(profile.dateOfBirth),
      citizenship: profile.citizenship,
      gender: profile.gender,
      phone: profile.phone,
      email: user.email,
      additional_emails: profile.additionalEmails ?? '',
      status: profile.status,
      employment_category: profile.employmentCategory,
      company_name: profile.companyName,
      license_number: profile.licenseNumber,
      license_expiry: d(profile.licenseExpiry),
      license_categories: profile.licenseCategories,
      license_issue_date: d(profile.licenseIssueDate),
      license_issued_by: profile.licenseIssuedBy,
      license_scan_url: profile.licenseScanUrl,
      has_international_license: profile.hasInternationalLicense,
      international_license_number: profile.internationalLicenseNumber,
      international_license_validity: profile.internationalLicenseValidity,
      last_medical_examination_date: d(profile.lastMedicalExaminationDate),
      hire_source: profile.hireSource,
      attached_documents: profile.attachedDocuments,
      inn: profile.inn,
      address: profile.address,
      passport_series: profile.passportSeries,
      passport_number: profile.passportNumber,
      passport_issue_date: d(profile.passportIssueDate),
      passport_expiry_date: d(profile.passportExpiryDate),
      passport_issued_by: profile.passportIssuedBy,
      place_of_birth: profile.placeOfBirth,
      residential_address: profile.residentialAddress,
      passport_scan_url: profile.passportScanUrl,
      permission_entry_zone: profile.permissionEntryZone,
      permission_issue_date: d(profile.permissionIssueDate),
      permission_validity_date: d(profile.permissionValidityDate),
      medical_certificate: profile.medicalCertificate,
      medical_certificate_scan_url: profile.medicalCertificateScanUrl,
      technical_minimum_certificate: profile.technicalMinimumCertificate,
      tachograph_card_number: profile.tachographCardNumber,
      other_permits: profile.otherPermits,
      bank_name: profile.bankName,
      bank_account: profile.bankAccount,
      bank_bik: profile.bankBik,
      is_verified: profile.isVerified,
      verification_status: profile.verificationStatus ?? 'not_verified',
      unlocked_fields: (profile.unlockedFields as string[]) ?? [],
      rating: profile.rating,
      updated_at: profile.updatedAt ? profile.updatedAt.toISOString().slice(0, 10) : null,
    };
  })
  .patch('/:id/driver-profile', async ({ params, body, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');

    const updateData: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
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
      passport_scan_url: 'passportScanUrl', permission_entry_zone: 'permissionEntryZone',
      permission_issue_date: 'permissionIssueDate', permission_validity_date: 'permissionValidityDate',
      medical_certificate: 'medicalCertificate', medical_certificate_scan_url: 'medicalCertificateScanUrl',
      technical_minimum_certificate: 'technicalMinimumCertificate', tachograph_card_number: 'tachographCardNumber',
      other_permits: 'otherPermits', bank_name: 'bankName', bank_account: 'bankAccount', bank_bik: 'bankBik',
    };
    const dateKeys = ['date_of_birth', 'license_expiry', 'license_issue_date', 'last_medical_examination_date', 'passport_issue_date', 'passport_expiry_date', 'permission_issue_date', 'permission_validity_date'];
    const bodyAny = body as Record<string, unknown>;
    for (const [key, dbKey] of Object.entries(fieldMap)) {
      if (bodyAny[key] === undefined) continue;
      const val = bodyAny[key];
      if (dateKeys.includes(key)) {
        (updateData as any)[dbKey] = val ? new Date(val as string) : null;
      } else if (key === 'has_international_license') {
        (updateData as any)[dbKey] = val;
      } else {
        (updateData as any)[dbKey] = val;
      }
    }
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(carrierProfiles)
      .set(updateData as any)
      .where(eq(carrierProfiles.id, profile.id))
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
      phone: updated!.phone,
      is_verified: updated!.isVerified,
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
  .get('/:id/edit-requests', async ({ params, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    const list = await db
      .select({ id: profileEditRequests.id, fieldKey: profileEditRequests.fieldKey, status: profileEditRequests.status, driverComment: profileEditRequests.driverComment, fieldValue: profileEditRequests.fieldValue, requestedAt: profileEditRequests.requestedAt, resolvedAt: profileEditRequests.resolvedAt })
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
      const d = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : null);
      const map: Record<string, string | null | undefined> = {
        surname: profile.surname, given_name: profile.givenName, patronymic: profile.patronymic,
        date_of_birth: d(profile.dateOfBirth), citizenship: profile.citizenship, gender: profile.gender,
        status: profile.status, employment_category: profile.employmentCategory, phone: profile.phone,
        additional_emails: profile.additionalEmails, passport_series: profile.passportSeries,
        passport_number: profile.passportNumber, company_name: profile.companyName, license_number: profile.licenseNumber,
        license_expiry: d(profile.licenseExpiry), license_categories: profile.licenseCategories,
        passport_issue_date: d(profile.passportIssueDate), passport_expiry_date: d(profile.passportExpiryDate),
        passport_issued_by: profile.passportIssuedBy, place_of_birth: profile.placeOfBirth,
        residential_address: profile.residentialAddress, passport_scan_url: profile.passportScanUrl ? '(файл загружен)' : null,
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
  })
  .post('/:id/edit-requests/:requestId/approve', async ({ params, error, adminUser }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    const [req] = await db
      .select()
      .from(profileEditRequests)
      .where(and(
        eq(profileEditRequests.id, params.requestId),
        eq(profileEditRequests.carrierId, profile.id),
        eq(profileEditRequests.status, 'pending')
      ))
      .limit(1);
    if (!req) return error(404, 'Запрос не найден или уже обработан');
    const COMBINED_FIELDS: Record<string, string[]> = { passport_series_number: ['passport_series', 'passport_number'] };
    const unlocked = ((profile.unlockedFields as string[]) ?? []).filter(Boolean);
    const keysToAdd = COMBINED_FIELDS[req.fieldKey] ?? [req.fieldKey];
    for (const k of keysToAdd) {
      if (!unlocked.includes(k)) unlocked.push(k);
    }
    await db
      .update(profileEditRequests)
      .set({ status: 'approved', resolvedAt: new Date(), resolvedById: adminUser?.id ?? null })
      .where(eq(profileEditRequests.id, params.requestId));

    const stillPending = await db
      .select()
      .from(profileEditRequests)
      .where(and(
        eq(profileEditRequests.carrierId, profile.id),
        eq(profileEditRequests.status, 'pending')
      ));
    const newStatus = stillPending.length > 0 ? 'request' : 'waiting_verification';

    await db
      .update(carrierProfiles)
      .set({
        unlockedFields: unlocked,
        verificationStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(carrierProfiles.id, profile.id));
    return { success: true, field_key: req.fieldKey, unlocked_fields: unlocked };
  })
  .post('/:id/verify', async ({ params, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    const [updated] = await db
      .update(carrierProfiles)
      .set({ isVerified: true, verificationStatus: 'verified', updatedAt: new Date() })
      .where(eq(carrierProfiles.id, profile.id))
      .returning();
    return { success: true, is_verified: updated!.isVerified, verification_status: updated!.verificationStatus };
  })
  .post('/:id/driver-profile/upload-passport', async ({ params, body, set, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
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
    const uploadDir = join(process.cwd(), 'storage', 'driver-docs', profile.id);
    await mkdir(uploadDir, { recursive: true });
    const filename = `passport_${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);
    const buf = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buf));
    const url = `/cabinet/driver/documents/${profile.id}/${filename}`;
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
    }),
  })
  .post('/:id/driver-profile/upload-license', async ({ params, body, set, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
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
    const uploadDir = join(process.cwd(), 'storage', 'driver-docs', profile.id);
    await mkdir(uploadDir, { recursive: true });
    const filename = `license_${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);
    const buf = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buf));
    const url = `/cabinet/driver/documents/${profile.id}/${filename}`;
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
    }),
  })
  .post('/:id/driver-profile/upload-medical', async ({ params, body, set, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
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
    const uploadDir = join(process.cwd(), 'storage', 'driver-docs', profile.id);
    await mkdir(uploadDir, { recursive: true });
    const filename = `medical_${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);
    const buf = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buf));
    const url = `/cabinet/driver/documents/${profile.id}/${filename}`;
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
    }),
  });
