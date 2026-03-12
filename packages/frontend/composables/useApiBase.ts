/**
 * API и WebSocket URLs.
 * API идёт через Nuxt proxy (тот же origin) — без CORS, работает с телефона.
 * WebSocket — напрямую на backend (нужен доступ к порту 8000).
 */
export function useApiBase() {
  const config = useRuntimeConfig()
  if (import.meta.client) {
    const host = window.location.hostname
    return {
      apiBase: '', // Пустая строка = тот же origin, запросы идут через Nuxt proxy
      wsUrl: (config.public.wsUrl as string) || `ws://${host}:8000`,
    }
  }
  const backend = config.apiUrl || 'http://127.0.0.1:8000'
  return {
    apiBase: backend,
    wsUrl: (config.public.wsUrl as string) || 'ws://localhost:8000',
  }
}
