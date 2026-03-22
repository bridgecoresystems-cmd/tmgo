/**
 * URL аватара для отображения. В БД хранится `/api/auth/avatars/...`.
 *
 * Продакшен (один домен за nginx): относительный путь — тот же origin, что и страница
 * (важно для www vs apex и Cloudflare; иначе img с apiBase на apex при открытии с www).
 *
 * Dev (Nuxt :3000, API :8000): полный apiBase, иначе браузер стучится в :3000.
 */
export function useAvatarUrl(image: string | null | undefined) {
  const { apiBase } = useApiBase()
  if (!image) return ''
  if (image.startsWith('http')) return image

  const path = image.startsWith('/') ? image : `/${image}`

  if (path.startsWith('/api/')) {
    if (import.meta.client) {
      const nuxtDev = import.meta.dev && window.location.port === '3000'
      if (nuxtDev) return `${apiBase}${path}`
      return path
    }
    return `${apiBase}${path}`
  }

  return `${apiBase}${path}`
}
