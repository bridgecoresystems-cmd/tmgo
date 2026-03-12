import { getRequestURL, proxyRequest } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const backend = config.apiUrl || 'http://127.0.0.1:8000'
  const url = getRequestURL(event)
  const path = url.pathname + (url.search || '')
  return proxyRequest(event, backend + path, {
    cookieDomainRewrite: { '*': '' },
    cookiePathRewrite: { '*': '/' },
  })
})
