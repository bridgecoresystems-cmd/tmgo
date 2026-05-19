import { db } from '../../db';
import { orders, users } from '../../db/schema';
import { count, sum, desc, eq, or, and, gte } from 'drizzle-orm';

export async function getDashboardStats() {
  const [totalOrdersRes] = await db.select({ val: count() }).from(orders);

  const [activeTripsRes] = await db.select({ val: count() })
    .from(orders)
    .where(or(
      eq(orders.status, 'confirmed'),
      eq(orders.status, 'pickup'),
      eq(orders.status, 'in_transit'),
      eq(orders.status, 'delivering'),
    ));

  const [revenueRes] = await db.select({ val: sum(orders.price) })
    .from(orders)
    .where(eq(orders.status, 'completed'));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [newClientsRes] = await db.select({ val: count() })
    .from(users)
    .where(and(eq(users.role, 'client'), gte(users.createdAt, thirtyDaysAgo)));

  const recentOrdersList = await db.select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const recentUsersList = await db.select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(5);

  return {
    stats: {
      totalOrders: totalOrdersRes?.val || 0,
      activeTrips: activeTripsRes?.val || 0,
      revenue: parseFloat(revenueRes?.val || '0').toLocaleString('ru-RU'),
      newClients: newClientsRes?.val || 0,
      trends: {
        totalOrders: 12,
        activeTrips: 5,
        revenue: 8,
        newClients: -2,
      },
    },
    recentOrders: recentOrdersList.map((o) => ({
      id: o.id,
      seqNo: o.seqNo,
      route: `${o.fromCity} → ${o.toCity}`,
      status: o.status,
      price: parseFloat(o.price || '0').toLocaleString('ru-RU'),
    })),
    recentUsers: recentUsersList.map((u) => ({
      name: u.name,
      email: u.email,
      role: u.role === 'client' ? 'Заказчик' : (u.role === 'driver' ? 'Перевозчик' : u.role),
    })),
  };
}
