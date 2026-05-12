export function useNominatimCities() {
  async function fetchCitySuggestions(
    query: string,
    countryCode?: string | null,
  ): Promise<string[]> {
    if (!query || query.trim().length < 2) return []

    const params = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      limit: '8',
      'accept-language': 'ru',
      featuretype: 'city',
    })
    if (countryCode) params.set('countrycodes', countryCode.toLowerCase())

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { 'User-Agent': 'TMGO-logistics/1.0' } },
      )
      const items: any[] = await res.json()
      // Берём первую часть display_name до первой запятой — это название города
      return [...new Set(items.map(r => r.display_name.split(',')[0].trim()))]
    } catch {
      return []
    }
  }

  return { fetchCitySuggestions }
}
