export function useNominatim() {
  async function fetchSuggestions(
    query: string,
    featureType: 'country' | 'state' | 'city',
    countryCode?: string | null,
    stateName?: string | null,
  ): Promise<any[]> {
    if (!query || query.trim().length < 2) return []

    const params = new URLSearchParams({
      format: 'json',
      limit: '8',
      'accept-language': 'ru',
      featuretype: featureType,
    })
    
    if (featureType === 'country') {
      params.set('country', query.trim())
    } else if (featureType === 'state') {
      params.set('state', query.trim())
      if (countryCode) params.set('country', countryCode) // nominatim prefers country name, but sometimes accepts code
    } else {
      params.set('city', query.trim())
      if (stateName) params.set('state', stateName)
      if (countryCode) params.set('country', countryCode)
    }

      params.set('addressdetails', '1')

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { 'User-Agent': 'TMGO-logistics/1.0' } },
      )
      const items: any[] = await res.json()
      
      if (featureType === 'country') {
        const unique = new Map<string, { label: string, value: string }>()
        for (const item of items) {
          const code = item.address?.country_code?.toUpperCase()
          if (code && !unique.has(code)) {
            unique.set(code, { label: item.display_name.split(',')[0].trim(), value: code })
          }
        }
        return Array.from(unique.values()) as any
      }

      // Для регионов и городов возвращаем просто строки
      return [...new Set(items.map(r => r.display_name.split(',')[0].trim()))] as any
    } catch {
      return []
    }
  }

  function fetchCountrySuggestions(query: string) {
    return fetchSuggestions(query, 'country')
  }

  function fetchRegionSuggestions(query: string, country?: string | null) {
    return fetchSuggestions(query, 'state', country)
  }

  function fetchCitySuggestions(query: string, country?: string | null, region?: string | null) {
    return fetchSuggestions(query, 'city', country, region)
  }

  return { fetchCountrySuggestions, fetchRegionSuggestions, fetchCitySuggestions }
}
