import { db } from '../../db';
import { orders, clientProfiles, carrierProfiles, orderBids, orderCargo } from '../../db/schema';
import { desc, eq } from 'drizzle-orm';

export async function listOrders(query: { search?: string; status?: string }) {
  const { search, status } = query;

  const allOrders = await db.select({
    id: orders.id,
    seqNo: orders.seqNo,
    title: orders.title,
    status: orders.status,
    price: orders.price,
    currency: orders.currency,
    fromCity: orders.fromCity,
    toCity: orders.toCity,
    createdAt: orders.createdAt,
    clientName: clientProfiles.displayName,
    carrierName: carrierProfiles.givenName,
    carrierSurname: carrierProfiles.surname,
    cargoType: orderCargo.cargoType,
    weight: orderCargo.weightKg,
  })
    .from(orders)
    .leftJoin(clientProfiles, eq(orders.clientProfileId, clientProfiles.id))
    .leftJoin(orderBids, eq(orders.acceptedBidId, orderBids.id))
    .leftJoin(carrierProfiles, eq(orderBids.carrierProfileId, carrierProfiles.id))
    .leftJoin(orderCargo, eq(orders.id, orderCargo.orderId))
    .orderBy(desc(orders.createdAt));

  let filtered = allOrders;
  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((o) =>
      (o.seqNo && o.seqNo.toString().includes(s)) ||
      o.title.toLowerCase().includes(s) ||
      o.clientName?.toLowerCase().includes(s) ||
      o.fromCity.toLowerCase().includes(s) ||
      o.toCity.toLowerCase().includes(s),
    );
  }

  return filtered.map((o) => ({
    id: o.id,
    shortId: `ORD${o.seqNo}`,
    client: o.clientName || '---',
    carrier: o.carrierName ? `${o.carrierName} ${o.carrierSurname || ''}`.trim() : null,
    route: `${o.fromCity} → ${o.toCity}`,
    status: o.status,
    price: parseFloat(o.price || '0').toLocaleString('ru-RU'),
    date: new Date(o.createdAt).toLocaleDateString('ru-RU'),
    cargoType: o.cargoType || '---',
    weight: o.weight || '0',
    title: o.title,
  }));
}

export async function deleteOrder(id: string) {
  await db.delete(orders).where(eq(orders.id, id));
  return { success: true };
}
