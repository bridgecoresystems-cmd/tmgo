// Одноразовая миграция файлов с локального диска (storage/) в Cloudflare R2.
// Ключ в R2 = путь относительно storage/ (driver-docs/<id>/<file>, chat/<file>, avatars/<file>) —
// тот же формат, что использует приложение, поэтому URL в БД менять НЕ нужно.
//
// Запуск (из packages/backend), R2_* должны быть в .env:
//   bun run scripts/migrate-storage-to-r2.ts --dry-run     # показать что зальётся, без записи
//   bun run scripts/migrate-storage-to-r2.ts               # реальная заливка
//   bun run scripts/migrate-storage-to-r2.ts /path/storage # явный путь к storage/
//
// Идемпотентно: уже существующие в R2 объекты пропускаются (exists). Повторный запуск безопасен.

import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, sep } from 'path';
import { makeR2Storage, mimeForKey } from '../src/lib/storage';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const baseArg = args.find((a) => !a.startsWith('--'));
const base = baseArg || join(process.cwd(), 'storage');

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // нет директории — нечего мигрировать
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

const r2 = dryRun ? null : makeR2Storage();

console.log(`Источник: ${base}`);
console.log(`Бакет:    ${process.env.R2_BUCKET ?? '(R2_BUCKET не задан!)'}`);
console.log(`Режим:    ${dryRun ? 'DRY-RUN (без записи)' : 'ЗАЛИВКА'}`);
console.log('');

let uploaded = 0;
let skipped = 0;
let failed = 0;
let bytes = 0;

for await (const filepath of walk(base)) {
  // POSIX-ключ (на Windows sep заменяем на /)
  const key = relative(base, filepath).split(sep).join('/');
  try {
    const size = (await stat(filepath)).size;

    if (r2 && (await r2.exists(key))) {
      skipped++;
      console.log(`skip   ${key} (уже в R2)`);
      continue;
    }

    if (dryRun) {
      uploaded++;
      bytes += size;
      console.log(`would  ${key} (${size} B)`);
      continue;
    }

    await r2!.put(key, await readFile(filepath), mimeForKey(key));
    uploaded++;
    bytes += size;
    console.log(`put    ${key} (${size} B)`);
  } catch (e) {
    failed++;
    console.error(`FAIL   ${key}: ${(e as Error).message}`);
  }
}

console.log('');
console.log(`Итого: ${dryRun ? 'к заливке' : 'залито'} ${uploaded}, пропущено ${skipped}, ошибок ${failed}, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
process.exit(failed > 0 ? 1 : 0);
