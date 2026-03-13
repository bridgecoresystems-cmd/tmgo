export default defineNuxtRouteMiddleware(async () => {
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

  if ((session.value.user as any).role !== 'admin') {
    return navigateTo('/')
  }
})
