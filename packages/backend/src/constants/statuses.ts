// Статусы заказа. Поток:
// draft → published → negotiating → confirmed → pickup → in_transit → delivering → delivered → completed
export const ORDER_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  NEGOTIATING: 'negotiating',
  CONFIRMED: 'confirmed',
  PICKUP: 'pickup',
  IN_TRANSIT: 'in_transit',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
