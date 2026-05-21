// Абстракция файлового хранилища. Один интерфейс — две реализации:
//   STORAGE_DRIVER=local (по умолчанию) → диск VPS, <cwd>/storage/<key>
//   STORAGE_DRIVER=r2               → Cloudflare R2 через встроенный Bun.S3Client
//
// key — путь относительно storage/ (напр. 'driver-docs/<carrierId>/<file>',
// 'chat/<file>', 'avatars/<file>'). Формат key одинаков для обоих драйверов,
// поэтому URL в БД и контракт API не зависят от того, где лежит файл.
//
// Фаза 1: отдача — прокси через бэк (handlers читают storage.get и стримят).
// R2 включается только когда STORAGE_DRIVER=r2 — иначе R2-клиент даже не
// конструируется, и креды R2 не требуются (прод на local не меняется).

import { mkdir, writeFile, readFile, unlink } from 'fs/promises';
import { join, dirname, extname } from 'path';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

export function mimeForKey(key: string): string {
  return MIME[extname(key).toLowerCase()] || 'application/octet-stream';
}

type PutData = Buffer | ArrayBuffer | Uint8Array;

function toBuffer(data: PutData): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
}

export interface StorageDriver {
  put(key: string, data: PutData, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

class LocalStorage implements StorageDriver {
  private base = join(process.cwd(), 'storage');

  async put(key: string, data: PutData): Promise<void> {
    const filepath = join(this.base, key);
    await mkdir(dirname(filepath), { recursive: true });
    await writeFile(filepath, toBuffer(data));
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(join(this.base, key));
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.base, key));
    } catch {
      // нет файла — считаем удалённым
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when STORAGE_DRIVER=r2`);
  return value;
}

class R2Storage implements StorageDriver {
  private bucket;

  constructor() {
    const accountId = requireEnv('R2_ACCOUNT_ID');
    this.bucket = new Bun.S3Client({
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
      bucket: requireEnv('R2_BUCKET'),
      endpoint: process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
      // R2 игнорирует регион, но SigV4-подпись его включает — 'auto' принимается всегда.
      region: process.env.R2_REGION || 'auto',
    });
  }

  async put(key: string, data: PutData, contentType?: string): Promise<void> {
    await this.bucket.write(key, toBuffer(data), { type: contentType || mimeForKey(key) });
  }

  async get(key: string): Promise<Buffer | null> {
    const file = this.bucket.file(key);
    if (!(await file.exists())) return null;
    return Buffer.from(await file.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    // Bun 1.3.9 + R2: на DELETE R2 отвечает 204 No Content, и промис delete()
    // не резолвится, ХОТЯ объект реально удаляется. Не блокируем вызывающего —
    // запускаем удаление и ограничиваем ожидание таймаутом.
    try {
      await Promise.race([
        this.bucket.delete(key),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch {
      // объекта нет / ошибка — считаем удалённым
    }
  }
}

export const storage: StorageDriver =
  process.env.STORAGE_DRIVER === 'r2' ? new R2Storage() : new LocalStorage();
