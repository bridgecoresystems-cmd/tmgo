import { createHmac } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';

const SIGN_SECRET =
  process.env.CHAT_ATTACHMENT_SECRET ??
  (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('CHAT_ATTACHMENT_SECRET is required in production'); })()
    : 'tmgo-chat-attachment-secret-change-in-prod');
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function signAttachmentToken(filename: string): string {
  const expiry = Date.now() + TOKEN_TTL_MS;
  const payload = `${filename}|${expiry}`;
  const sig = createHmac('sha256', SIGN_SECRET).update(payload).digest('base64url');
  return `${sig}.${expiry}`;
}

export function verifyAttachmentToken(filename: string, token: string): boolean {
  try {
    const [sig, expiryStr] = token.split('.');
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || Date.now() > expiry) return false;
    const payload = `${filename}|${expiry}`;
    const expected = createHmac('sha256', SIGN_SECRET).update(payload).digest('base64url');
    return sig === expected;
  } catch {
    return false;
  }
}

export function signAttachmentUrls(urls: string[]): string[] {
  return urls.map((u) => {
    const m = u.match(/\/([^/]+\.(?:jpg|jpeg|png|gif|webp))$/i);
    const filename = m ? m[1] : u.split('/').pop() || '';
    if (!filename) return u;
    const token = signAttachmentToken(filename);
    return `/cabinet/chat/attachments/${filename}?token=${token}`;
  });
}

export async function serveAttachment(filename: string): Promise<{ buf: Buffer; contentType: string } | null> {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  const ext = filename.split('.').pop()?.toLowerCase();
  const contentType = types[ext || ''] || 'application/octet-stream';
  const safeFilename = filename.replace(/[^a-z0-9_.-]/gi, '');

  for (const dir of ['storage/chat', 'public/uploads/chat']) {
    try {
      const filepath = join(process.cwd(), dir, safeFilename);
      const buf = await readFile(filepath);
      return { buf, contentType };
    } catch {
      continue;
    }
  }
  return null;
}
