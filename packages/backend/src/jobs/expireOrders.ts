import { db } from '../db';
import { orders, orderStatusLog } from '../db/schema';
import { and, inArray, lt, isNotNull } from 'drizzle-orm';

export async function expireOrders() {
  const now = new Date();

  const expired = await db.select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(and(
      inArray(orders.status, ['published', 'negotiating']),
      isNotNull(orders.expiresAt),
      lt(orders.expiresAt, now),
    ));

  if (expired.length === 0) {
    console.log('[expireOrders] No expired orders found');
    return;
  }

  const ids = expired.map(o => o.id);

  await db.update(orders)
    .set({ status: 'expired', updatedAt: now })
    .where(inArray(orders.id, ids));

  for (const order of expired) {
    await db.insert(orderStatusLog).values({
      orderId: order.id,
      changedBy: null,
      oldStatus: order.status,
      newStatus: 'expired',
      comment: 'Auto-expired by system',
    });
  }

  console.log(`[expireOrders] Expired ${expired.length} orders`);
}
