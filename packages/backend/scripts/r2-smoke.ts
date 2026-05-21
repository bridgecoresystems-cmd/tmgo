// Смоук-тест R2/хранилища: put → get → проверка содержимого → delete → проверка отсутствия.
// Запуск (из packages/backend): STORAGE_DRIVER=r2 bun run scripts/r2-smoke.ts
// .env подхватывается Bun автоматически. Проверяет креды R2 end-to-end по HTTPS.

import { storage } from '../src/lib/storage';

const driver = process.env.STORAGE_DRIVER ?? 'local';
const key = `_smoke/test-${Date.now()}.txt`;
const payload = Buffer.from(`tmgo r2 smoke ${new Date().toISOString()}`);

console.log(`driver = ${driver}, bucket = ${process.env.R2_BUCKET ?? '(n/a)'}`);
console.log(`key    = ${key}`);

await storage.put(key, payload, 'text/plain');
console.log('✓ put');

const got = await storage.get(key);
const match = got?.toString() === payload.toString();
console.log(`✓ get  → "${got?.toString()}"  match=${match}`);

await storage.delete(key);
const after = await storage.get(key);
console.log(`✓ delete → after get = ${after === null ? 'null (ок)' : 'ВСЁ ЕЩЁ ЕСТЬ (!)'}`);

if (!match || after !== null) {
  console.error('❌ smoke test FAILED');
  process.exit(1);
}
console.log('✅ R2 smoke test passed');
// Висящий промис delete (R2 204 quirk) держит event loop — выходим явно.
process.exit(0);
