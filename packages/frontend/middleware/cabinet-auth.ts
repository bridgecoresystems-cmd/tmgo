export default defineNuxtRouteMiddleware(async (to) => {
  const { session, loading } = useAuth()

  // Ждём завершения загрузки сессии (иначе при F5 редирект на landing)
  if (loading.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(loading, (val) => {
        if (!val) {
          stop()
          resolve()
        }
      })
      if (!loading.value) {
        stop()
        resolve()
      }
    })
  }

  if (!session.value?.user) {
    return navigateTo('/auth')
  }

  const role = (session.value.user as any).role
  const path = to.path

  // /cabinet — редирект по роли
  if (path === '/cabinet' || path === '/cabinet/') {
    if (role === 'driver') return navigateTo('/cabinet/driver')
    return navigateTo('/cabinet/client')
  }

  // Заказчик не должен заходить в /cabinet/driver/*
  if (path.startsWith('/cabinet/driver') && role === 'client') {
    return navigateTo('/cabinet/client')
  }

  // Перевозчик не должен заходить в /cabinet/client/*
  if (path.startsWith('/cabinet/client') && role === 'driver') {
    return navigateTo('/cabinet/driver')
  }
})
