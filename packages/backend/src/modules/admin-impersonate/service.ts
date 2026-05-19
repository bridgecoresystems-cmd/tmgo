// Авторизация намеренно внутри сервиса: исходный contract нестандартный —
// не-админ получает 403 {error:'Forbidden'} (а не обычный 401), а /stop —
// 401 {error:'Unauthorized'}. Сохраняем 1:1.
import { db } from '../../db';
import { users, sessions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest, getImpersonateToken } from '../../lib/auth';
import { Unauthorized, Forbidden, BadRequest, NotFound } from '../../lib/errors';

function generateToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

export async function stopImpersonation(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) throw new Unauthorized('Unauthorized');
}

export async function startImpersonation(request: Request, targetUserId: string) {
  const admin = await getUserFromRequest(request);
  if (!admin || admin.role !== 'admin') throw new Forbidden('Forbidden');

  if (admin.id === targetUserId) {
    throw new BadRequest('Нельзя войти под собственной учётной записью');
  }

  if (getImpersonateToken(request)) {
    throw new BadRequest('Сначала выйдите из режима просмотра');
  }

  const [target] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target) throw new NotFound('Пользователь не найден');
  if (target.role === 'admin') throw new Forbidden('Нельзя войти под другим администратором');

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 4); // 4 часа

  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    userId: target.id,
    token,
    expiresAt,
    ipAddress: request.headers.get('X-Forwarded-For') ?? null,
    userAgent: request.headers.get('User-Agent') ?? null,
  });

  return {
    token,
    targetUser: { id: target.id, name: target.name, email: target.email, role: target.role },
  };
}
