export default defineNuxtRouteMiddleware(async () => {
  const { session } = useAuth()

  // Ждём пока сессия загрузится
  if (session.value === undefined) {
    await new Promise<void>((resolve) => {
      const stop = watch(session, (val) => {
        if (val !== undefined) {
          stop()
          resolve()
        }
      })
    })
  }

  if (!session.value?.user) {
    return navigateTo('/auth')
  }

  if ((session.value.user as any).role !== 'admin') {
    return navigateTo('/')
  }
})
