/**
 * Impersonation composable.
 *
 * Flow:
 * 1. Admin clicks "Войти под пользователем" → impersonate(userId)
 *    - POST /admin/impersonate/:userId — backend sets impersonate_token cookie
 *    - Redirect to cabinet (driver or client)
 *
 * 2. User in cabinet sees banner → stopImpersonating()
 *    - POST /admin/impersonate/stop — backend clears impersonate_token cookie
 *    - fetchSession + redirect to /admin/users
 */

export const useImpersonate = () => {
  const { apiBase } = useApiBase()
  const { session, isImpersonating, fetchSession } = useAuth()

  async function impersonate(userId: string) {
    const res = await $fetch<{ error?: string; targetUser?: { role: string } }>(`${apiBase}/admin/impersonate/${userId}`, {
      method: 'POST',
      credentials: 'include',
    })
    if (res?.error) throw new Error(res.error)
    await fetchSession()
    const role = res?.targetUser?.role
    if (role === 'driver') await navigateTo('/cabinet/driver')
    else if (role === 'client') await navigateTo('/cabinet/client')
    else await navigateTo('/admin/users')
  }

  async function stopImpersonating() {
    await $fetch(`${apiBase}/admin/impersonate/stop`, {
      method: 'POST',
      credentials: 'include',
    })
    await fetchSession()
    await navigateTo('/admin/users')
  }

  return { isImpersonating, impersonate, stopImpersonating }
}
