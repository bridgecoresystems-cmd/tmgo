const BASE = import.meta.env.VITE_API_URL ?? '/api'

export interface Order {
  id: string
  orderType: string
  status: string
  title: string
  fromCountry: string
  fromRegion: string | null
  fromCity: string
  toCountry: string
  toRegion: string | null
  toCity: string
  readyDate: string
  deadlineDate: string | null
  publishedAt: string | null
  cargoType: string | null
  weightKg: string | null
  volumeM3: string | null
  packaging: string | null
}

export interface SearchParams {
  fromCity?: string
  toCity?: string
  fromCountry?: string
  toCountry?: string
  cargoType?: string
  weightMin?: number
  weightMax?: number
  volumeMin?: number
  volumeMax?: number
  packaging?: string
  readyFrom?: string
  page?: number
  limit?: number
}

export interface SearchResult {
  orders: Order[]
  total: number
  page: number
  limit: number
}

export async function searchOrders(params: SearchParams): Promise<SearchResult> {
  const q = new URLSearchParams()
  if (params.fromCity) q.set('fromCity', params.fromCity)
  if (params.toCity) q.set('toCity', params.toCity)
  if (params.fromCountry) q.set('fromCountry', params.fromCountry)
  if (params.toCountry) q.set('toCountry', params.toCountry)
  if (params.cargoType) q.set('cargoType', params.cargoType)
  if (params.weightMin != null) q.set('weightMin', String(params.weightMin))
  if (params.weightMax != null) q.set('weightMax', String(params.weightMax))
  if (params.volumeMin != null) q.set('volumeMin', String(params.volumeMin))
  if (params.volumeMax != null) q.set('volumeMax', String(params.volumeMax))
  if (params.packaging) q.set('packaging', params.packaging)
  if (params.readyFrom) q.set('readyFrom', params.readyFrom)
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))

  const res = await fetch(`${BASE}/public/orders?${q}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}
