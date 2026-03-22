/**
 * URL аватара для отображения. Пути `/api/auth/avatars/...` ведём на backend (NUXT_PUBLIC_API_BASE).
 * На статическом хостинге (Hostinger) нет Nitro-прокси `/api/avatar/` — только прямой URL API.
 */
export function useAvatarUrl(image: string | null | undefined) {
  const { apiBase } = useApiBase()
  const result = (() => {
    if (!image) return ''
    if (image.startsWith('http')) return image
    if (image.startsWith('/')) return `${apiBase}${image}`
    return `${apiBase}/${image}`
  })()
  if (import.meta.dev) {
    console.log('[useAvatarUrl]', { image, result, apiBase })
  }
  return result
}
