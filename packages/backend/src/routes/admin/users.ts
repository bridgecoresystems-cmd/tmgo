import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { Elysia, t } from 'elysia';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'] as const;
const ALLOWED_DOC_TYPES = ['passport', 'drivers_license', 'visa', 'medical_certificate', 'insurance', 'tachograph_card', 'technical_minimum_cert', 'adr_certificate', 'other', 'document'] as const;

function safeExt(name: string): string | null {
  const ext = (name || '').split('.').pop()?.toLowerCase() || null;
  return ext && ALLOWED_EXT.includes(ext) ? ext : null;
}

function safeDocType(docType: unknown): string {
  const s = String(docType || 'document').toLowerCase().replace(/[^a-z0-9_]/g, '');
  return ALLOWED_DOC_TYPES.includes(s as any) ? s : 'document';
}

function safeProfileId(id: string): boolean {
  return UUID_REGEX.test(id);
}
import { db } from '../../db';
import { users, accounts, carrierProfiles, sessions, profileEditRequests, profileChangeRequests, vehicles, orderResponses, driverServices, orders, orderMessages, driverCitizenships, driverContacts, driverDocuments } from '../../db/schema';
import { eq, and, desc, inArray, isNull } from 'drizzle-orm';
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
  .delete('/:id', async ({ params, error, set }) => {
    try {
      const [target] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
      if (!target) return error(404, 'User not found');
      if (target.role === 'admin') {
        const admins = await db.select().from(users).where(eq(users.role, 'admin'));
        if (admins.length <= 1) {
          return error(400, 'Нельзя удалить последнего администратора');
        }
      }

      const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
      if (profile) {
        const profileId = profile.id;
        await db.delete(driverServices).where(eq(driverServices.carrierId, profileId));
        await db.delete(orderResponses).where(eq(orderResponses.carrierId, profileId));
        const carrierVehicles = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.carrierId, profileId));
        const vehicleIds = carrierVehicles.map((v) => v.id);
        if (vehicleIds.length > 0) {
          await db.update(orders).set({ vehicleId: null }).where(inArray(orders.vehicleId, vehicleIds));
        }
        await db.delete(vehicles).where(eq(vehicles.carrierId, profileId));
        await db.update(orders).set({ carrierId: null }).where(eq(orders.carrierId, profileId));
      }

      const clientOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.clientId, params.id));
      for (const o of clientOrders) {
        await db.delete(orderResponses).where(eq(orderResponses.orderId, o.id));
        await db.delete(orderMessages).where(eq(orderMessages.orderId, o.id));
      }
      await db.delete(orders).where(eq(orders.clientId, params.id));
      await db.delete(orderMessages).where(eq(orderMessages.senderId, params.id));
      await db.delete(sessions).where(eq(sessions.userId, params.id));
      await db.delete(accounts).where(eq(accounts.userId, params.id));
      if (profile) {
        await db.delete(carrierProfiles).where(eq(carrierProfiles.userId, params.id));
      }
      await db.delete(users).where(eq(users.id, params.id));
      return { success: true, message: 'Пользователь удалён навсегда' };
    } catch (e: any) {
      console.error('[admin users DELETE]', e);
      set.status = 500;
      return { error: e?.message || 'Ошибка удаления пользователя' };
    }
  })
  .get('/:id/driver-profile', async ({ params, error, set }) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
      if (!user) return error(404, 'User not found');
      if (user.role !== 'driver') return error(400, 'User is not a driver');
      const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
      if (!profile) return error(404, 'Driver profile not found');
      const d = (x: Date | string | null | undefined) => {
        if (x == null) return null;
        const dt = x instanceof Date ? x : new Date(x as string);
        return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
      };
      const ratingVal = profile.rating;
      const rating = ratingVal != null ? String(ratingVal) : null;

      const legacyCitizenships = (profile.citizenship ?? '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const citizenshipsFromTable = await db.select({ country: driverCitizenships.country })
        .from(driverCitizenships)
        .where(and(eq(driverCitizenships.carrierId, profile.id), eq(driverCitizenships.status, 'active')));
      const allCitizenships = [...new Set([...legacyCitizenships, ...citizenshipsFromTable.map((c) => c.country).filter(Boolean)])];
      const citizenship = allCitizenships.join(', ');

      const legacyPhones = (profile.phone ?? '').split(',').map((s: string) => s.trim()).filter(Boolean);
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

      const legacyEmails = (profile.additionalEmails ?? '').split(',').map((s: string) => s.trim()).filter(Boolean);
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

      const passportDocs = await db.select()
        .from(driverDocuments)
        .where(and(
          eq(driverDocuments.carrierId, profile.id),
          eq(driverDocuments.docType, 'passport'),
          inArray(driverDocuments.status, ['active', 'pending_verification']),
        ))
        .orderBy(desc(driverDocuments.createdAt));
      const passports_from_documents = passportDocs.map((doc) => ({
        id: doc.id,
        series: doc.series,
        number: doc.number,
        issued_by: doc.issuedBy,
        issued_at: doc.issuedAt ? new Date(doc.issuedAt).toISOString().slice(0, 10) : null,
        expires_at: doc.expiresAt ? new Date(doc.expiresAt).toISOString().slice(0, 10) : null,
        place_of_birth: doc.placeOfBirth,
        residential_address: doc.residentialAddress,
        scan_url: doc.scanUrl,
        status: doc.status,
      }));

      const licenseDocs = await db.select()
        .from(driverDocuments)
        .where(and(
          eq(driverDocuments.carrierId, profile.id),
          eq(driverDocuments.docType, 'drivers_license'),
          inArray(driverDocuments.status, ['active', 'pending_verification']),
        ))
        .orderBy(desc(driverDocuments.createdAt));
      const licenses_from_documents = licenseDocs.map((doc) => ({
        id: doc.id,
        number: doc.number,
        issued_by: doc.issuedBy,
        issued_at: doc.issuedAt ? new Date(doc.issuedAt).toISOString().slice(0, 10) : null,
        expires_at: doc.expiresAt ? new Date(doc.expiresAt).toISOString().slice(0, 10) : null,
        license_categories: doc.licenseCategories,
        scan_url: doc.scanUrl,
        status: doc.status,
      }));

      const visaDocs = await db.select()
        .from(driverDocuments)
        .where(and(
          eq(driverDocuments.carrierId, profile.id),
          eq(driverDocuments.docType, 'visa'),
          inArray(driverDocuments.status, ['active', 'pending_verification']),
        ))
        .orderBy(desc(driverDocuments.createdAt));
      const visas_from_documents = visaDocs.map((doc) => ({
        id: doc.id,
        country: doc.country,
        number: doc.number,
        issued_at: doc.issuedAt ? new Date(doc.issuedAt).toISOString().slice(0, 10) : null,
        expires_at: doc.expiresAt ? new Date(doc.expiresAt).toISOString().slice(0, 10) : null,
        scan_url: doc.scanUrl,
        status: doc.status,
      }));

      const medicalDocs = await db.select()
        .from(driverDocuments)
        .where(and(
          eq(driverDocuments.carrierId, profile.id),
          eq(driverDocuments.docType, 'medical_certificate'),
          inArray(driverDocuments.status, ['active', 'pending_verification']),
        ))
        .orderBy(desc(driverDocuments.createdAt));
      const medical_certificates_from_documents = medicalDocs.map((doc) => ({
        id: doc.id,
        number: doc.number,
        issued_at: doc.issuedAt ? new Date(doc.issuedAt).toISOString().slice(0, 10) : null,
        expires_at: doc.expiresAt ? new Date(doc.expiresAt).toISOString().slice(0, 10) : null,
        scan_url: doc.scanUrl,
        status: doc.status,
      }));

      const tachographDocs = await db.select()
        .from(driverDocuments)
        .where(and(
          eq(driverDocuments.carrierId, profile.id),
          eq(driverDocuments.docType, 'tachograph_card'),
          inArray(driverDocuments.status, ['active', 'pending_verification']),
        ))
        .orderBy(desc(driverDocuments.createdAt));
      const tachograph_cards_from_documents = tachographDocs.map((doc) => ({
        id: doc.id,
        number: doc.number,
        country: doc.country,
        issued_at: doc.issuedAt ? new Date(doc.issuedAt).toISOString().slice(0, 10) : null,
        expires_at: doc.expiresAt ? new Date(doc.expiresAt).toISOString().slice(0, 10) : null,
        scan_url: doc.scanUrl,
        status: doc.status,
      }));

      const techMinDocs = await db.select()
        .from(driverDocuments)
        .where(and(
          eq(driverDocuments.carrierId, profile.id),
          eq(driverDocuments.docType, 'technical_minimum_cert'),
          inArray(driverDocuments.status, ['active', 'pending_verification']),
        ))
        .orderBy(desc(driverDocuments.createdAt));
      const technical_minimum_certs_from_documents = techMinDocs.map((doc) => ({
        id: doc.id,
        number: doc.number,
        issued_by: doc.issuedBy,
        issued_at: doc.issuedAt ? new Date(doc.issuedAt).toISOString().slice(0, 10) : null,
        expires_at: doc.expiresAt ? new Date(doc.expiresAt).toISOString().slice(0, 10) : null,
        scan_url: doc.scanUrl,
        status: doc.status,
      }));

      const adrDocs = await db.select()
        .from(driverDocuments)
        .where(and(
          eq(driverDocuments.carrierId, profile.id),
          eq(driverDocuments.docType, 'adr_certificate'),
          inArray(driverDocuments.status, ['active', 'pending_verification']),
        ))
        .orderBy(desc(driverDocuments.createdAt));
      const adr_certs_from_documents = adrDocs.map((doc) => {
        const allowed = doc.licenseCategories ? doc.licenseCategories.split(',').map((s) => s.trim()).filter(Boolean) : [];
        return {
          id: doc.id,
          issued_by: doc.issuedBy,
          number: doc.number,
          allowed_classes: allowed,
          license_categories: doc.licenseCategories,
          issued_at: doc.issuedAt ? new Date(doc.issuedAt).toISOString().slice(0, 10) : null,
          expires_at: doc.expiresAt ? new Date(doc.expiresAt).toISOString().slice(0, 10) : null,
          scan_url: doc.scanUrl,
          status: doc.status,
        };
      });

      return {
      id: profile.id,
      surname: profile.surname,
      given_name: profile.givenName,
      patronymic: profile.patronymic,
      date_of_birth: d(profile.dateOfBirth),
      citizenship,
      gender: profile.gender,
      phone,
      email: user.email,
      additional_emails,
      status: profile.status,
      employment_category: profile.employmentCategory,
      company_name: profile.companyName,
      license_number: profile.licenseNumber,
      license_expiry: d(profile.licenseExpiry),
      license_categories: profile.licenseCategories,
      license_issue_date: d(profile.licenseIssueDate),
      license_issued_by: profile.licenseIssuedBy,
      license_scan_url: profile.licenseScanUrl,
      licenses_from_documents,
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
      passport_is_active: profile.passportIsActive,
      extra_passports: (profile.extraPassports as any[]) ?? [],
      passports_from_documents,
      visas_from_documents,
      medical_certificates_from_documents,
      tachograph_cards_from_documents,
      technical_minimum_certs_from_documents,
      adr_certs_from_documents,
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
      verification_status: String(profile.verificationStatus ?? 'not_verified'),
      unlocked_fields: (profile.unlockedFields as string[]) ?? [],
      hidden_fields: (profile.hiddenFields as string[]) ?? [],
      rating,
      updated_at: profile.updatedAt ? profile.updatedAt.toISOString().slice(0, 10) : null,
    };
    } catch (e: any) {
      console.error('[admin driver-profile GET]', e);
      set.status = 500;
      return { error: e?.message || 'Internal server error' };
    }
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
      passport_scan_url: 'passportScanUrl', passport_is_active: 'passportIsActive', permission_entry_zone: 'permissionEntryZone',
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
    if (bodyAny.hidden_fields !== undefined) {
      const arr = Array.isArray(bodyAny.hidden_fields) ? bodyAny.hidden_fields : [];
      updateData.hiddenFields = arr;
    }
    if (bodyAny.extra_passports !== undefined) {
      const arr = Array.isArray(bodyAny.extra_passports) ? bodyAny.extra_passports : [];
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
    // чтобы они не «всплывали» при следующей загрузке (GET объединяет legacy + таблицы)
    if (bodyAny.phone !== undefined || bodyAny.additional_emails !== undefined || bodyAny.citizenship !== undefined) {
      const now = new Date();
      if (bodyAny.phone !== undefined || bodyAny.additional_emails !== undefined) {
        await db.update(driverContacts)
          .set({ deletedAt: now })
          .where(eq(driverContacts.carrierId, profile.id));
      }
      if (bodyAny.citizenship !== undefined) {
        await db.update(driverCitizenships)
          .set({ status: 'revoked', revokedAt: now })
          .where(eq(driverCitizenships.carrierId, profile.id));
      }
    }

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
      passport_is_active: t.Optional(t.Nullable(t.Boolean())),
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
      extra_passports: t.Optional(t.Array(t.Object({
        passport_series: t.Optional(t.Nullable(t.String())),
        passport_number: t.Optional(t.Nullable(t.String())),
        passport_issue_date: t.Optional(t.Nullable(t.String())),
        passport_expiry_date: t.Optional(t.Nullable(t.String())),
        passport_issued_by: t.Optional(t.Nullable(t.String())),
        place_of_birth: t.Optional(t.Nullable(t.String())),
        residential_address: t.Optional(t.Nullable(t.String())),
        passport_scan_url: t.Optional(t.Nullable(t.String())),
        is_active: t.Optional(t.Nullable(t.Boolean())),
      }))),
      hidden_fields: t.Optional(t.Array(t.String())),
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
  .get('/:id/change-requests', async ({ params, query, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    const status = (query as { status?: string }).status ?? 'pending';
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
    const d = (x: Date | null | undefined) => (x ? new Date(x).toISOString().slice(0, 10) : null);
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
      requested_at: d(r.requestedAt),
      resolved_at: d(r.resolvedAt),
      unlocked_until: d(r.unlockedUntil),
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

    // Activate all pending documents when driver is verified
    await db
      .update(driverDocuments)
      .set({ status: 'active', updatedAt: new Date() })
      .where(and(
        eq(driverDocuments.carrierId, profile.id),
        eq(driverDocuments.status, 'pending_verification'),
      ));

    return { success: true, is_verified: updated!.isVerified, verification_status: updated!.verificationStatus };
  })
  .post('/:id/driver-profile/upload-passport', async ({ params, body, set, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    if (!safeProfileId(profile.id)) return error(400, 'Invalid profile');
    const file = body.file;
    if (!file || !file.size) {
      set.status = 400;
      return { error: 'No file' };
    }
    const ext = safeExt(file.name || '');
    if (!ext) {
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
    const url = `/cabinet/driver/document-files/${profile.id}/${filename}`;
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
    }),
  })
  .post('/:id/driver-profile/upload-extra-passport', async ({ params, body, set, error }) => {
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    if (!safeProfileId(profile.id)) return error(400, 'Invalid profile');
    const file = body.file;
    const rawIndex = typeof body.index === 'number' ? body.index : (parseInt(String(body.index || 0), 10) || 0);
    const index = Math.max(0, Math.min(99, Number.isNaN(rawIndex) ? 0 : rawIndex));
    if (!file || !file.size) {
      set.status = 400;
      return { error: 'No file' };
    }
    const ext = safeExt(file.name || '');
    if (!ext) {
      set.status = 400;
      return { error: 'Только PDF, JPG, PNG (макс. 10 МБ)' };
    }
    if (file.size > 10 * 1024 * 1024) {
      set.status = 400;
      return { error: 'Файл слишком большой (макс. 10 МБ)' };
    }
    const uploadDir = join(process.cwd(), 'storage', 'driver-docs', profile.id);
    await mkdir(uploadDir, { recursive: true });
    const filename = `passport_extra_${index}_${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);
    const buf = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buf));
    const url = `/cabinet/driver/document-files/${profile.id}/${filename}`;
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
      index: t.Optional(t.Union([t.Number(), t.String()])),
    }),
  })
  .post('/:id/driver-profile/upload-license', async ({ params, body, set, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    if (!safeProfileId(profile.id)) return error(400, 'Invalid profile');
    const file = body.file;
    if (!file || !file.size) {
      set.status = 400;
      return { error: 'No file' };
    }
    const ext = safeExt(file.name || '');
    if (!ext) {
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
    const url = `/cabinet/driver/document-files/${profile.id}/${filename}`;
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
    if (!safeProfileId(profile.id)) return error(400, 'Invalid profile');
    const file = body.file;
    if (!file || !file.size) {
      set.status = 400;
      return { error: 'No file' };
    }
    const ext = safeExt(file.name || '');
    if (!ext) {
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
    const url = `/cabinet/driver/document-files/${profile.id}/${filename}`;
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
    }),
  })

  // ─── Admin: документы водителя (driverDocuments) — для редактирования паспортов/ВУ из «Добавить документы» ───
  .get('/:id/documents', async ({ params, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    const docs = await db.select().from(driverDocuments).where(and(
      eq(driverDocuments.carrierId, profile.id),
      inArray(driverDocuments.docType, ['passport', 'drivers_license', 'visa', 'medical_certificate', 'tachograph_card', 'technical_minimum_cert', 'adr_certificate']),
      inArray(driverDocuments.status, ['active', 'pending_verification']),
    )).orderBy(desc(driverDocuments.createdAt));
    const d = (x: Date | null | undefined) => (x ? new Date(x).toISOString().slice(0, 10) : null);
    return docs.map((doc) => ({
      id: doc.id,
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
      scan_url: doc.scanUrl,
      status: doc.status,
    }));
  })
  .patch('/:id/documents/:docId', async ({ params, body, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    const [doc] = await db.select().from(driverDocuments).where(and(
      eq(driverDocuments.id, params.docId),
      eq(driverDocuments.carrierId, profile.id),
    )).limit(1);
    if (!doc) return error(404, 'Document not found');
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
    if (b.allowed_classes !== undefined) {
      updateData.licenseCategories = Array.isArray(b.allowed_classes) ? b.allowed_classes.filter(Boolean).join(',') : null;
    } else if (b.license_categories !== undefined) {
      updateData.licenseCategories = b.license_categories;
    }
    if (b.scan_url !== undefined) updateData.scanUrl = b.scan_url;
    const [updated] = await db.update(driverDocuments).set(updateData).where(eq(driverDocuments.id, params.docId)).returning();
    const d = (x: Date | null | undefined) => (x ? new Date(x).toISOString().slice(0, 10) : null);
    return {
      id: updated!.id,
      doc_type: updated!.docType,
      country: updated!.country,
      series: updated!.series,
      number: updated!.number,
      issued_by: updated!.issuedBy,
      issued_at: d(updated!.issuedAt),
      expires_at: d(updated!.expiresAt),
      place_of_birth: updated!.placeOfBirth,
      residential_address: updated!.residentialAddress,
      license_categories: updated!.licenseCategories,
      scan_url: updated!.scanUrl,
    };
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
      allowed_classes: t.Optional(t.Array(t.String())),
      scan_url: t.Optional(t.Nullable(t.String())),
    }),
  })
  .delete('/:id/documents/:docId', async ({ params, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    const [doc] = await db.select().from(driverDocuments).where(and(
      eq(driverDocuments.id, params.docId),
      eq(driverDocuments.carrierId, profile.id),
    )).limit(1);
    if (!doc) return error(404, 'Document not found');
    await db.update(driverDocuments)
      .set({ status: 'revoked', validUntil: new Date(), updatedAt: new Date() })
      .where(eq(driverDocuments.id, params.docId));
    return { success: true };
  })
  // PATCH /admin/users/:id/documents/:docId/status — одобрить или отклонить документ
  .patch('/:id/documents/:docId/status', async ({ params, body, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    const [doc] = await db.select().from(driverDocuments).where(and(
      eq(driverDocuments.id, params.docId),
      eq(driverDocuments.carrierId, profile.id),
    )).limit(1);
    if (!doc) return error(404, 'Document not found');
    const b = body as any;
    const newStatus = b.status as 'active' | 'rejected';
    if (!['active', 'rejected'].includes(newStatus)) return error(400, 'Invalid status');
    await db.update(driverDocuments)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(driverDocuments.id, params.docId));
    return { success: true, id: params.docId, status: newStatus };
  }, {
    body: t.Object({ status: t.String() }),
  })

  .post('/:id/documents/upload', async ({ params, body, set, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    if (!safeProfileId(profile.id)) return error(400, 'Invalid profile');
    const file = body.file;
    if (!file || !file.size) { set.status = 400; return { error: 'Файл не загружен' }; }
    const ext = safeExt(file.name || '');
    if (!ext) { set.status = 400; return { error: 'Только PDF, JPG, PNG' }; }
    if (file.size > 10 * 1024 * 1024) { set.status = 400; return { error: 'Файл слишком большой (макс. 10 МБ)' }; }
    const docType = safeDocType((body as any).doc_type);
    const uploadDir = join(process.cwd(), 'storage', 'driver-docs', profile.id);
    await mkdir(uploadDir, { recursive: true });
    const filename = `${docType}_${randomUUID()}.${ext}`;
    const buf = await file.arrayBuffer();
    await writeFile(join(uploadDir, filename), Buffer.from(buf));
    const url = `/cabinet/driver/document-files/${profile.id}/${filename}`;
    return { url };
  }, {
    body: t.Object({
      file: t.File(),
      doc_type: t.Optional(t.String()),
    }),
  })
  .post('/:id/documents', async ({ params, body, error }) => {
    const [user] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    if (!user) return error(404, 'User not found');
    if (user.role !== 'driver') return error(400, 'User is not a driver');
    const [profile] = await db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, params.id)).limit(1);
    if (!profile) return error(404, 'Driver profile not found');
    const docType = (body as any).doc_type as string;
    if (!['passport', 'drivers_license', 'visa', 'medical_certificate', 'tachograph_card', 'technical_minimum_cert', 'adr_certificate'].includes(docType)) return error(400, 'Invalid doc_type');
    const b = body as any;
    const licenseCategories = docType === 'adr_certificate' && Array.isArray(b.allowed_classes)
      ? b.allowed_classes.filter(Boolean).join(',')
      : (b.license_categories || null);
    const [doc] = await db.insert(driverDocuments).values({
      carrierId: profile.id,
      docType: docType as any,
      country: b.country || null,
      series: b.series || null,
      number: b.number || null,
      issuedBy: b.issued_by || null,
      issuedAt: b.issued_at ? new Date(b.issued_at) : null,
      expiresAt: b.expires_at ? new Date(b.expires_at) : null,
      placeOfBirth: b.place_of_birth || null,
      residentialAddress: b.residential_address || null,
      licenseCategories,
      scanUrl: b.scan_url || null,
      status: 'active',
    }).returning();
    const d = (x: Date | null | undefined) => (x ? new Date(x).toISOString().slice(0, 10) : null);
    return {
      id: doc!.id,
      doc_type: doc!.docType,
      country: doc!.country,
      series: doc!.series,
      number: doc!.number,
      issued_by: doc!.issuedBy,
      issued_at: d(doc!.issuedAt),
      expires_at: d(doc!.expiresAt),
      place_of_birth: doc!.placeOfBirth,
      residential_address: doc!.residentialAddress,
      license_categories: doc!.licenseCategories,
      scan_url: doc!.scanUrl,
    };
  }, {
    body: t.Object({
      doc_type: t.Union([t.Literal('passport'), t.Literal('drivers_license'), t.Literal('visa'), t.Literal('medical_certificate'), t.Literal('tachograph_card'), t.Literal('technical_minimum_cert'), t.Literal('adr_certificate')]),
      country: t.Optional(t.Nullable(t.String())),
      series: t.Optional(t.Nullable(t.String())),
      number: t.Optional(t.Nullable(t.String())),
      issued_by: t.Optional(t.Nullable(t.String())),
      issued_at: t.Optional(t.Nullable(t.String())),
      expires_at: t.Optional(t.Nullable(t.String())),
      place_of_birth: t.Optional(t.Nullable(t.String())),
      residential_address: t.Optional(t.Nullable(t.String())),
      license_categories: t.Optional(t.Nullable(t.String())),
      allowed_classes: t.Optional(t.Array(t.String())),
      scan_url: t.Optional(t.Nullable(t.String())),
    }),
  });
