/// <reference types="bun-types" />
/**
 * Проверка документов, истекающих через 30, 14, 7, 1 день.
 * Запуск вручную или через cron: bun run scripts/document-expiry-check.ts
 *
 * Логика вынесена в lib/document-expiry.ts, используется и BullMQ worker'ом.
 */

import { checkExpiringDocuments } from '../src/lib/document-expiry';

checkExpiringDocuments()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
