/// <reference types="bun-types" />
import { db } from '../src/db';
import { users, accounts } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const ADMIN_EMAIL = 'batyr@tmgo.com';
const ADMIN_PASSWORD = 'Kepler03lim@';
const ADMIN_NAME = 'Batyr (Admin)';

function generateId(length = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function seedAdmin() {
  console.log('Checking if admin already exists...');

  const existing = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL));
  if (existing.length > 0) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    process.exit(0);
  }

  console.log('Creating admin user...');

  const hashedPassword = await Bun.password.hash(ADMIN_PASSWORD, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  const userId = generateId();

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

  console.log(`Admin created: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
