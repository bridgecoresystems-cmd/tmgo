/**
 * API и WebSocket URLs.
 * Прямые запросы на backend :8000 (без proxy).
 */
export function useApiBase() {
  const config = useRuntimeConfig()
  if (import.meta.client) {
    const host = window.location.hostname
    return {
      apiBase: (config.public.apiBase as string) || `http://${host}:8000`,
      wsUrl: (config.public.wsUrl as string) || `ws://${host}:8000`,
    }
  }
  return {
    apiBase: (config.public.apiBase as string) || 'http://localhost:8000',
    wsUrl: (config.public.wsUrl as string) || 'ws://localhost:8000',
  }
}
