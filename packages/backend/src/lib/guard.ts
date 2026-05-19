// Общий инструмент авторизации. Модульные guard.ts строят политику доступа
// поверх этих примитивов, не дублируя извлечение сессии.
import { getUserFromRequest } from './auth';
import { Unauthorized } from './errors';
import { db } from '../db';
import { carrierProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ROLES, type Role } from '../constants/roles';

export async function requireUser(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) throw new Unauthorized();
  return user;
}

// Историческое поведение проекта: при неверной роли отдаём 401 (а не 403).
// Сохраняем контракт — фронт это так и обрабатывает.
export async function requireRole(request: Request, ...roles: Role[]) {
  const user = await requireUser(request);
  if (!roles.includes(user.role as Role)) throw new Unauthorized();
  return user;
}

// Только driver. Дополнительно резолвит (создаёт при отсутствии) carrier_profile.
// Общий для driver-модулей (contacts/citizenships/change-requests/services).
export async function requireDriverWithProfile(request: Request) {
  const user = await requireRole(request, ROLES.DRIVER);
  let [profile] = await db.select().from(carrierProfiles)
    .where(eq(carrierProfiles.userId, user.id)).limit(1);
  if (!profile) {
    const [created] = await db.insert(carrierProfiles).values({ userId: user.id }).returning();
    profile = created!;
  }
  return { user, carrierProfile: profile };
}
