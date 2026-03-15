/**
 * Проверка доступа к полям после верификации.
 * Использует profile_change_requests (approved, unlocked_until > now).
 */

import { db } from '../db';
import { profileChangeRequests } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Проверить, разблокировано ли поле для редактирования через одобренный change_request.
 */
export async function isFieldUnlocked(carrierId: string, fieldKey: string): Promise<boolean> {
  const [req] = await db
    .select()
    .from(profileChangeRequests)
    .where(and(
      eq(profileChangeRequests.carrierId, carrierId),
      eq(profileChangeRequests.fieldKey, fieldKey),
      eq(profileChangeRequests.status, 'approved'),
      gt(profileChangeRequests.unlockedUntil, new Date()),
    ))
    .limit(1);
  return !!req;
}

/**
 * Получить все разблокированные ключи для carrier.
 */
export async function getUnlockedKeys(carrierId: string): Promise<Set<string>> {
  const list = await db
    .select({ fieldKey: profileChangeRequests.fieldKey })
    .from(profileChangeRequests)
    .where(and(
      eq(profileChangeRequests.carrierId, carrierId),
      eq(profileChangeRequests.status, 'approved'),
      gt(profileChangeRequests.unlockedUntil, new Date()),
    ));
  return new Set(list.map((r) => r.fieldKey));
}
