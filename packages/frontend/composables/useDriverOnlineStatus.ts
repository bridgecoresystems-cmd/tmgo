export function useDriverOnlineStatus() {
  const { apiBase } = useApiBase()
  const { session } = useAuth()
  const isOnline = useState<boolean | null>('driver-online-status', () => null)

  async function fetchStatus() {
    if (session.value?.user?.role !== 'driver') {
      isOnline.value = null
      return
    }
    try {
      const data = await $fetch<{ is_online?: boolean }>(`${apiBase}/cabinet/driver/profile`, {
        credentials: 'include',
      })
      isOnline.value = data?.is_online ?? false
    } catch {
      isOnline.value = false
    }
  }

  async function setOnline(value: boolean) {
    if (session.value?.user?.role !== 'driver') return
    try {
      await $fetch(`${apiBase}/cabinet/driver/profile/online-status`, {
        method: 'PATCH',
        credentials: 'include',
        body: { is_online: value },
      })
      isOnline.value = value
    } catch (e: any) {
      throw new Error(e?.data?.error || 'Ошибка обновления статуса')
    }
  }

  onMounted(fetchStatus)
  watch(() => session.value?.user?.id, fetchStatus)

  return { isOnline, setOnline, fetchStatus }
}
