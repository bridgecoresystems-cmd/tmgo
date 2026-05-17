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

  return { fetchCountrySuggestions, fetchRegionSuggestions, fetchCitySuggestions }
}
