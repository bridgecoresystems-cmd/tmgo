/**
 * Преобразует путь аватара в URL для отображения.
 * Использует прокси /api/avatar/ для загрузки с того же origin.
 */
export function useAvatarUrl(image: string | null | undefined) {
  const { apiBase } = useApiBase()
  const result = (() => {
    if (!image) return ''
    if (image.startsWith('http')) return image
    const m = image.match(/\/api\/auth\/avatars\/(.+)$/)
    if (!m) return `${apiBase}${image}`
    const path = m[1]
    if (import.meta.client) {
      return `${window.location.origin}/api/avatar/${path}`
    }
    return `/api/avatar/${path}`
  })()
  if (import.meta.dev) {
    console.log('[useAvatarUrl]', { image, result, apiBase })
  }
  return result
}
