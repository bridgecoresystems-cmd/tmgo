/**
 * Прокси аватаров — загрузка с того же origin (best practice из документации).
 * Документация: https://nitro.build/guide/routing, Nuxt server routes
 */
export default defineEventHandler(async (event) => {
  const path = event.context.params?.path
  const pathStr = Array.isArray(path) ? path.join('/') : (path ?? '')
  const filename = pathStr || (() => {
    const url = getRequestURL(event)
    const m = url.pathname.match(/\/api\/avatar\/(.+)$/)
    return m ? decodeURIComponent(m[1]) : ''
  })()
  if (!filename) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('[avatar proxy] fetching:', filename)
  }
  const config = useRuntimeConfig()
  const apiBase = (config.public.apiBase as string) || 'http://localhost:8000'
  const url = `${apiBase}/api/auth/avatars/${filename}`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw createError({ statusCode: response.status, statusMessage: 'Image not found' })
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=86400')
    const buf = await response.arrayBuffer()
    return Buffer.from(buf)
  } catch (e: any) {
    if (e.statusCode) throw e
    throw createError({ statusCode: 500, statusMessage: 'Proxy error' })
  }
})
