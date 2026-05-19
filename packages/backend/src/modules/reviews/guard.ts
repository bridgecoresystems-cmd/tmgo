// Охранник модуля: проверяет сессию. Логика доступа живёт здесь,
// routes.ts только вызывает requireUser в .derive.
import { getUserFromRequest } from '../../lib/auth';
import { Unauthorized } from '../../lib/errors';

export async function requireUser(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) throw new Unauthorized();
  return user;
}
