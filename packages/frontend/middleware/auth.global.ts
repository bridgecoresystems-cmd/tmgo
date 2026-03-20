export default defineNuxtRouteMiddleware(async (to) => {
  // Публичные маршруты — пропускаем без проверки
  if (
    !to.path.startsWith('/admin') &&
    !to.path.startsWith('/cabinet')
  ) return

  const { session, loading } = useAuth()

  // Ждём загрузки сессии (иначе при F5 редирект раньше времени)
  if (loading.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(loading, (val) => {
        if (!val) { stop(); resolve() }
      })
      if (!loading.value) { stop(); resolve() }
    })
  }

  const user = session.value?.user as any

  // Не авторизован — на страницу входа
  if (!user) {
    return navigateTo('/auth')
  }

  const role = user.role
  const path = to.path

  // ── Admin ──────────────────────────────────────────────────────
  if (path.startsWith('/admin')) {
    if (role !== 'admin') return navigateTo('/')
    return // ok
  }

  // ── Cabinet ────────────────────────────────────────────────────
  if (path === '/cabinet' || path === '/cabinet/') {
    return navigateTo(role === 'driver' ? '/cabinet/driver' : '/cabinet/client')
  }

  if (path.startsWith('/cabinet/driver') && role === 'client') {
    return navigateTo('/cabinet/client')
  }

  if (path.startsWith('/cabinet/client') && role === 'driver') {
    return navigateTo('/cabinet/driver')
  }
})
