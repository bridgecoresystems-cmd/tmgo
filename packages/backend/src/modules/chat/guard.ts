import { getUserFromRequest } from '../../lib/auth';

export type ChatUser = NonNullable<Awaited<ReturnType<typeof getUserFromRequest>>>;

// Чат доступен только client/driver. Иначе 401 — поведение 1:1 с прежним derive
// (плейн-throw + set.status, дефолтный обработчик Elysia формирует тело).
export async function requireChatUser(
  request: Request,
  set: { status?: number | string },
): Promise<ChatUser> {
  const user = await getUserFromRequest(request);
  if (!user || (user.role !== 'client' && user.role !== 'driver')) {
    set.status = 401;
    throw new Error('Unauthorized');
  }
  return user;
}
