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
    return navigateTo('/auth', { replace: true })
  }

  const role = user.role
  const path = to.path

  // ── Admin ──────────────────────────────────────────────────────
  if (path.startsWith('/admin')) {
    if (role !== 'admin') {
      // Если не админ, отправляем в его кабинет
      const fallback = role === 'driver' ? '/cabinet/driver' : '/cabinet/client'
      return navigateTo(fallback, { replace: true })
    }
    return // ok
  }

  // ── Cabinet ────────────────────────────────────────────────────
  if (path.startsWith('/cabinet')) {
    // Админам нечего делать в кабинете (если они не impersonate, но тогда role будет driver/client)
    if (role === 'admin') {
      return navigateTo('/admin', { replace: true })
    }

    // Редирект с корня кабинета
    if (path === '/cabinet' || path === '/cabinet/') {
      return navigateTo(role === 'driver' ? '/cabinet/driver' : '/cabinet/client', { replace: true })
    }

    // Чужой кабинет
    if (path.startsWith('/cabinet/driver') && role !== 'driver') {
      return navigateTo('/cabinet/client', { replace: true })
    }

    if (path.startsWith('/cabinet/client') && role !== 'client') {
      return navigateTo('/cabinet/driver', { replace: true })
    }
  }
})
