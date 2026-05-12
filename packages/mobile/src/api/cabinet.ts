const BASE = import.meta.env.VITE_API_URL ?? '/api'

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? data?.error ?? 'Ошибка запроса')
  return data as T
}

export interface MyOrder {
  id: string
  title: string
  status: string
  fromCountry: string
  fromCity: string
  toCountry: string
  toCity: string
  readyDate: string
  deadlineDate: string | null
  price: string | null
  currency: string
  createdAt: string
  cargoType?: string | null
  weightKg?: string | null
}

function normalizeOrder(row: any): MyOrder {
  const o = row.orders ?? row
  const c = row.order_cargo ?? null
  return {
    id: o.id,
    title: o.title,
    status: o.status,
    fromCountry: o.fromCountry,
    fromCity: o.fromCity,
    toCountry: o.toCountry,
    toCity: o.toCity,
    readyDate: o.readyDate,
    deadlineDate: o.deadlineDate ?? null,
    price: o.price ?? null,
    currency: o.currency ?? 'USD',
    createdAt: o.createdAt,
    cargoType: c?.cargoType ?? null,
    weightKg: c?.weightKg ?? null,
  }
}

export async function getMyOrders(status?: string): Promise<MyOrder[]> {
  const q = status ? `?status=${status}` : ''
  const data = await api<{ orders: any[] }>(`/cabinet/orders/my${q}`)
  return (data.orders ?? []).map(normalizeOrder)
}

export async function getOrderById(id: string): Promise<any> {
  return api<any>(`/cabinet/orders/${id}`)
}

export async function createOrder(body: any): Promise<{ order: any }> {
  return api<any>('/cabinet/orders', { method: 'POST', body: JSON.stringify(body) })
}

export async function publishOrder(id: string): Promise<any> {
  return api<any>(`/cabinet/orders/${id}/publish`, { method: 'POST' })
}

export async function getClientProfile(): Promise<any> {
  return api<any>('/cabinet/client/profile')
}

export const STATUS_LABEL: Record<string, string> = {
  draft:      'Черновик',
  published:  'Опубликован',
  negotiating:'Переговоры',
  confirmed:  'Подтверждён',
  pickup:     'Ожидает погрузки',
  in_transit: 'В пути',
  delivering: 'Доставляется',
  completed:  'Завершён',
  cancelled:  'Отменён',
}

// ── Driver API ────────────────────────────────────────────────────────────────

export async function getDriverAvailableOrders(params?: { fromCountry?: string; toCountry?: string }): Promise<any[]> {
  const q = new URLSearchParams()
  if (params?.fromCountry) q.set('fromCountry', params.fromCountry)
  if (params?.toCountry)   q.set('toCountry',   params.toCountry)
  const qs = q.toString() ? `?${q}` : ''
  const data = await api<{ orders: any[] }>(`/cabinet/driver/orders/available${qs}`)
  return data.orders ?? []
}

export async function getDriverMyBids(): Promise<any[]> {
  const data = await api<{ orders: any[] }>('/cabinet/driver/orders')
  return data.orders ?? []
}

export async function getDriverOrderById(id: string): Promise<any> {
  return api<any>(`/cabinet/driver/orders/${id}`)
}

export async function placeBid(orderId: string, amount: number, currency: string, comment?: string): Promise<any> {
  return api<any>(`/cabinet/orders/${orderId}/bids`, {
    method: 'POST',
    body: JSON.stringify({ amount, currency, comment }),
  })
}

export const BID_STATUS_LABEL: Record<string, string> = {
  pending:  'Ожидает',
  accepted: 'Принята',
  rejected: 'Отклонена',
  withdrawn:'Отозвана',
}

export const BID_STATUS_COLOR: Record<string, string> = {
  pending:  '#f0a020',
  accepted: '#18a058',
  rejected: '#e53935',
  withdrawn:'#999',
}

export const STATUS_COLOR: Record<string, string> = {
  draft:      '#999',
  published:  '#1a5bc4',
  negotiating:'#f0a020',
  confirmed:  '#18a058',
  pickup:     '#7c3aed',
  in_transit: '#0891b2',
  delivering: '#0891b2',
  completed:  '#18a058',
  cancelled:  '#e53935',
}
