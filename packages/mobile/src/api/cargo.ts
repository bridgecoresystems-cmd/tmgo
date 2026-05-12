const BASE = import.meta.env.VITE_API_URL ?? '/api'

export interface CargoOrder {
  id: string
  orderType: 'cargo'
  status: string
  title: string
  fromCountry: string
  fromCity: string
  toCountry: string
  toCity: string
  readyDate: string
  cargoType: string
  weightKg: string | number
  volumeM3: string | number
  packaging?: string
  publishedAt: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? 'Ошибка запроса')
  return data as T
}

export async function apiSearchCargo(params: Record<string, any>): Promise<CargoOrder[]> {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val) query.append(key, val.toString())
  })
  
  // According to Claude Code report, the endpoint is /public/orders
  const data = await request<{ orders: CargoOrder[] }>(`/public/orders?${query.toString()}`)
  return data.orders ?? []
}
