/// <reference types="bun-types" />
/**
 * Проверка документов, истекающих через 30, 14, 7, 1 день.
 * Запуск вручную или через cron: bun run scripts/document-expiry-check.ts
 *
 * Без BullMQ — только логирует. При наличии push-сервиса — добавить sendPushNotification.
 *
 * Для паспортов и ВУ: не уведомляем, если у водителя есть более новый активный документ
 * того же типа (добавлен после — значит старый заменён).
 */

import { db } from '../src/db';
import { driverDocuments } from '../src/db/schema';
import { eq, and, lte, gte, gt } from 'drizzle-orm';

const EXPIRY_WARNINGS = [30, 14, 7, 1]; // дней — уведомлять за N дней до истечения

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: 'Паспорт',
  drivers_license: 'Водительское удостоверение',
  medical_certificate: 'Медицинская справка',
  insurance: 'Страховка',
  visa: 'Виза',
  entry_permit: 'Разрешение на въезд',
  tachograph_card: 'Карта тахографа',
  other: 'Документ',
};

const REPLACEABLE_TYPES = ['passport', 'drivers_license'];

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

/** Есть ли у carrier более новый активный документ того же типа? */
async function hasNewerActiveDoc(carrierId: string, docType: string, olderThan: Date): Promise<boolean> {
  const [newer] = await db
    .select({ id: driverDocuments.id })
    .from(driverDocuments)
    .where(and(
      eq(driverDocuments.carrierId, carrierId),
      eq(driverDocuments.docType, docType),
      eq(driverDocuments.status, 'active'),
      gt(driverDocuments.createdAt, olderThan),
    ))
    .limit(1);
  return !!newer;
}

async function checkExpiringDocuments() {
  const now = new Date();
  console.log(`[${now.toISOString()}] Checking expiring documents...`);

  for (const daysLeft of EXPIRY_WARNINGS) {
    const windowStart = addDays(now, daysLeft - 1);
    const windowEnd = addDays(now, daysLeft + 1);
    const expiring = await db
      .select({
        id: driverDocuments.id,
        carrierId: driverDocuments.carrierId,
        docType: driverDocuments.docType,
        number: driverDocuments.number,
        expiresAt: driverDocuments.expiresAt,
        createdAt: driverDocuments.createdAt,
      })
      .from(driverDocuments)
      .where(and(
        eq(driverDocuments.status, 'active'),
        gte(driverDocuments.expiresAt, windowStart),
        lte(driverDocuments.expiresAt, windowEnd),
      ));

    for (const doc of expiring) {
      if (REPLACEABLE_TYPES.includes(doc.docType)) {
        const hasNewer = await hasNewerActiveDoc(doc.carrierId, doc.docType, doc.createdAt ?? doc.expiresAt ?? now);
        if (hasNewer) {
          console.log(`  [${daysLeft}d] SKIP ${doc.docType} №${doc.number ?? '—'} — есть более новый документ (carrier: ${doc.carrierId})`);
          continue;
        }
      }
      const label = DOC_TYPE_LABELS[doc.docType] ?? doc.docType;
      const msg = `${label} №${doc.number ?? '—'} истекает через ${daysLeft} дн. (carrier: ${doc.carrierId})`;
      console.log(`  [${daysLeft}d] ${msg}`);
      // TODO: sendPushNotification(doc.carrierId, { title: 'Документ истекает', body: msg })
    }
  }

  console.log('Done.');
  process.exit(0);
}

checkExpiringDocuments().catch((err) => {
  console.error(err);
  process.exit(1);
});
