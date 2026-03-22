/**
 * Создаёт или обновляет учётную запись администратора (email + пароль + account credential).
 * Использование: из packages/backend с загруженным .env:
 *   bun run scripts/ensure-admin.ts
 * Переменные: ADMIN_EMAIL, ADMIN_PASSWORD, опционально ADMIN_NAME
 */
/// <reference types="bun-types" />
import { db } from '../src/db';
import { users, accounts } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

function generateId(length = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Задайте ADMIN_EMAIL и ADMIN_PASSWORD в .env или в окружении.');
    process.exit(1);
  }

  const hashedPassword = await Bun.password.hash(ADMIN_PASSWORD, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  const [byEmail] = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
  if (byEmail) {
    if (byEmail.role !== 'admin') {
      // Один админ на проде — повышаем роль, если email уже занят вашим аккаунтом
      await db
        .update(users)
        .set({ role: 'admin', name: ADMIN_NAME, emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, byEmail.id));
    } else {
      await db
        .update(users)
        .set({ name: ADMIN_NAME, emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, byEmail.id));
    }
    await db
      .update(accounts)
      .set({
        password: hashedPassword,
        accountId: ADMIN_EMAIL,
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.userId, byEmail.id), eq(accounts.providerId, 'credential')));
    console.log('Пароль и данные администратора обновлены:', ADMIN_EMAIL);
    process.exit(0);
  }

  const [existingAdmin] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  if (existingAdmin) {
    await db
      .update(users)
      .set({
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingAdmin.id));
    await db
      .update(accounts)
      .set({
        password: hashedPassword,
        accountId: ADMIN_EMAIL,
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.userId, existingAdmin.id), eq(accounts.providerId, 'credential')));
    console.log('Админ перенесён на:', ADMIN_EMAIL, '(был:', existingAdmin.email + ')');
    process.exit(0);
  }

  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    emailVerified: true,
    role: 'admin',
  });
  await db.insert(accounts).values({
    id: generateId(),
    accountId: ADMIN_EMAIL,
    providerId: 'credential',
    userId,
    password: hashedPassword,
  });
  console.log('Создан администратор:', ADMIN_EMAIL);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
