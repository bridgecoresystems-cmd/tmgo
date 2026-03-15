/// <reference types="bun-types" />
/**
 * Миграция данных из legacy полей carrier_profiles в новые таблицы:
 * driver_documents, driver_citizenships, driver_contacts
 *
 * Запуск: bun run scripts/migrate-profiles.ts
 *
 * Старые поля НЕ удаляются — остаются для проверки и отката.
 */

import { db } from '../src/db';
import {
  carrierProfiles,
  driverDocuments,
  driverCitizenships,
  driverContacts,
} from '../src/db/schema';
import { eq } from 'drizzle-orm';

function parseList(s: string | null | undefined): string[] {
  if (!s || typeof s !== 'string') return [];
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

async function migrateProfiles() {
  console.log('Starting profile migration...');
  const profiles = await db.select().from(carrierProfiles);
  console.log(`Found ${profiles.length} carrier profiles`);

  let docsCreated = 0;
  let citizenshipsCreated = 0;
  let contactsCreated = 0;

  for (const p of profiles) {
    // 1. Паспорт (основной)
    if (p.passportSeries || p.passportNumber) {
      const allDocsForPassport = await db
        .select()
        .from(driverDocuments)
        .where(eq(driverDocuments.carrierId, p.id));
      const hasPassport = allDocsForPassport.some((d) => d.docType === 'passport');
      if (!hasPassport) {
        await db.insert(driverDocuments).values({
          carrierId: p.id,
          docType: 'passport',
          series: p.passportSeries ?? null,
          number: p.passportNumber ?? null,
          issuedBy: p.passportIssuedBy ?? null,
          issuedAt: p.passportIssueDate ?? null,
          expiresAt: p.passportExpiryDate ?? null,
          placeOfBirth: p.placeOfBirth ?? null,
          residentialAddress: p.residentialAddress ?? null,
          scanUrl: p.passportScanUrl ?? null,
          status: 'active',
        });
        docsCreated++;
      }
    }

    // 2. Дополнительные паспорта (extra_passports)
    const extra = (p.extraPassports as any[]) ?? [];
    for (const ep of extra) {
      if (ep.passport_series || ep.passport_number) {
        await db.insert(driverDocuments).values({
          carrierId: p.id,
          docType: 'passport',
          series: ep.passport_series ?? null,
          number: ep.passport_number ?? null,
          issuedBy: ep.passport_issued_by ?? null,
          issuedAt: ep.passport_issue_date ? new Date(ep.passport_issue_date) : null,
          expiresAt: ep.passport_expiry_date ? new Date(ep.passport_expiry_date) : null,
          placeOfBirth: ep.place_of_birth ?? null,
          residentialAddress: ep.residential_address ?? null,
          scanUrl: ep.passport_scan_url ?? null,
          status: 'active',
        });
        docsCreated++;
      }
    }

    // 3. Гражданства
    const citizenshipList = parseList(p.citizenship ?? '');
    const existingCitizenships = await db
      .select()
      .from(driverCitizenships)
      .where(eq(driverCitizenships.carrierId, p.id));
    for (const country of citizenshipList) {
      const alreadyHas = existingCitizenships.some((c) => c.country === country);
      if (!alreadyHas) {
        await db.insert(driverCitizenships).values({
          carrierId: p.id,
          country,
          status: 'active',
        });
        citizenshipsCreated++;
      }
    }

    // 4. Водительское удостоверение
    if (p.licenseNumber) {
      const allDocsForLicense = await db
        .select()
        .from(driverDocuments)
        .where(eq(driverDocuments.carrierId, p.id));
      const hasLicense = allDocsForLicense.some((d) => d.docType === 'drivers_license');
      if (!hasLicense) {
        await db.insert(driverDocuments).values({
          carrierId: p.id,
          docType: 'drivers_license',
          number: p.licenseNumber,
          issuedBy: p.licenseIssuedBy ?? null,
          issuedAt: p.licenseIssueDate ?? null,
          expiresAt: p.licenseExpiry ?? null,
          licenseCategories: p.licenseCategories ?? null,
          scanUrl: p.licenseScanUrl ?? null,
          status: 'active',
        });
        docsCreated++;
      }
    }

    // 5. Медсправка
    if (p.medicalCertificate || p.medicalCertificateScanUrl) {
      const allDocsForMed = await db
        .select()
        .from(driverDocuments)
        .where(eq(driverDocuments.carrierId, p.id));
      const hasMedical = allDocsForMed.some((d) => d.docType === 'medical_certificate');
      if (!hasMedical) {
        await db.insert(driverDocuments).values({
          carrierId: p.id,
          docType: 'medical_certificate',
          notes: p.medicalCertificate ?? null,
          scanUrl: p.medicalCertificateScanUrl ?? null,
          status: 'active',
        });
        docsCreated++;
      }
    }

    // 6. Телефоны (дополнительные — primary в Better Auth)
    const phones = [...new Set(parseList(p.phone ?? ''))];
    const existingContacts = await db
      .select()
      .from(driverContacts)
      .where(eq(driverContacts.carrierId, p.id));
    for (const value of phones) {
      const hasPhone = existingContacts.some((c) => c.contactType === 'phone' && c.value === value);
      if (!hasPhone) {
        await db.insert(driverContacts).values({
          carrierId: p.id,
          contactType: 'phone',
          value,
          isActive: true,
        });
        contactsCreated++;
      }
    }

    // 7. Доп. emails
    const emails = [...new Set(parseList(p.additionalEmails ?? ''))];
    for (const value of emails) {
      const hasEmail = existingContacts.some((c) => c.contactType === 'email' && c.value === value);
      if (!hasEmail) {
        await db.insert(driverContacts).values({
          carrierId: p.id,
          contactType: 'email',
          value,
          isActive: true,
        });
        contactsCreated++;
      }
    }
  }

  console.log(`Migration complete. Created:`);
  console.log(`  - ${docsCreated} documents`);
  console.log(`  - ${citizenshipsCreated} citizenships`);
  console.log(`  - ${contactsCreated} contacts`);
  process.exit(0);
}

migrateProfiles().catch((err) => {
  console.error(err);
  process.exit(1);
});
