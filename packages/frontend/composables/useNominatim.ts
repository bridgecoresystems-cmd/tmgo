export function useNominatim() {
  const config = useRuntimeConfig()
  const suggestKey = config.public.yandexSuggestKey as string
  const { COUNTRY_LIST } = useCountryConfig()

  async function fetchCountrySuggestions(query: string): Promise<{ label: string; value: string }[]> {
    if (!query || query.trim().length < 1) return []
    const q = query.trim().toLowerCase()
    return COUNTRY_LIST
      .filter(c => c.name.toLowerCase().includes(q))
      .map(c => ({ label: `${c.flag} ${c.name}`, value: c.code }))
      .slice(0, 8)
  }

  async function fetchRegionSuggestions(query: string, _country?: string | null): Promise<string[]> {
    if (!query || query.trim().length < 2) return []
    try {
      const params = new URLSearchParams({
        apikey: suggestKey,
        text: query.trim(),
        lang: 'ru_RU',
        print_address: '1',
        results: '10',
      })
      const res = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params}`)
      const data: any = await res.json()
      return [...new Set(
        (data.results ?? [])
          .filter((r: any) => r.tags?.includes('province') || r.tags?.includes('district'))
          .map((r: any) => r.title?.text ?? '')
          .filter(Boolean)
      )] as string[]
    } catch {
      return []
    }
  }

  async function fetchCitySuggestions(query: string, _country?: string | null, _region?: string | null): Promise<string[]> {
    if (!query || query.trim().length < 2) return []
    try {
      const params = new URLSearchParams({
        apikey: suggestKey,
        text: query.trim(),
        lang: 'ru_RU',
        print_address: '1',
        results: '10',
      })
      const res = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params}`)
      const data: any = await res.json()
      const EXCLUDE = ['street', 'house', 'metro', 'route', 'station', 'airport']
      return [...new Set(
        (data.results ?? [])
          .filter((r: any) => {
            const tags: string[] = r.tags ?? []
            if (tags.some(t => EXCLUDE.includes(t))) return false
            return tags.includes('locality') || tags.includes('geo')
          })
          .map((r: any) => r.title?.text ?? '')
          .filter(Boolean)
      )] as string[]
    } catch {
      return []
    }
  }

  // Геокодинг адреса в координаты через OSM Nominatim (бесплатно, без ключа).
  // Возвращает null если адрес не найден или запрос упал. Используется при
  // создании заказа: фронт строит "city, region, country" и шлёт {lat,lng} в
  // POST /cabinet/client/orders для записи в orders.from_geom/to_geom.
  //
  // Rate-limit OSM ~1 req/sec — один заказ делает 2 параллельных запроса (from/to),
  // это в пределах нормы. Если станет проблемой — переключим на Yandex Geocoder.
  async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
    const q = query.trim()
    if (!q) return null
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
      const res = await fetch(url, { headers: { 'Accept-Language': 'ru,en' } })
      const data: any[] = await res.json()
      const first = data?.[0]
      if (!first?.lat || !first?.lon) return null
      const lat = parseFloat(first.lat)
      const lng = parseFloat(first.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return { lat, lng }
    } catch {
      return null
    }
  }

  return { fetchCountrySuggestions, fetchRegionSuggestions, fetchCitySuggestions, geocodeAddress }
}
