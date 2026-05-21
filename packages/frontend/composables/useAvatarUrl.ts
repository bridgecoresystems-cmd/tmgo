/**
 * URL аватара для отображения.
 *
 * В БД хранится `/api/auth/avatars/<file>`, но реальный бэк-роут — `/auth/avatars/<file>`
 * (без /api). Чтобы не зависеть от этого рассинхрона И грузить аватар с того же origin,
 * что и страница (важно для www vs apex и Cloudflare), ходим через Nuxt server-прокси
 * `/api/avatar/<file>` — он сам тянет файл с бэка по корректному пути `/auth/avatars/<file>`.
 *
 * Работает одинаково в dev (Nuxt :3000) и проде (Bun-сервер за nginx) — путь относительный.
 */
export function useAvatarUrl(image: string | null | undefined) {
  if (!image) return ''
  if (image.startsWith('http')) return image

  // имя файла — последний сегмент пути (подходит и для /api/auth/avatars/.., и для голого имени)
  const filename = image.split('/').filter(Boolean).pop()
  if (!filename) return ''

  return `/api/avatar/${encodeURIComponent(filename)}`
}
