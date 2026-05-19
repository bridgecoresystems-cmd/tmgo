// Общий инструмент авторизации. Модульные guard.ts строят политику доступа
// поверх этих примитивов, не дублируя извлечение сессии.
import { getUserFromRequest } from './auth';
import { Unauthorized } from './errors';
import type { Role } from '../constants/roles';

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
