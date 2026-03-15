export function useDriverChangeRequests() {
  const { apiBase } = useApiBase()
  const list = ref<any[]>([])
  const unlocked = ref<{ unlocked_keys: string[]; expires_at: Record<string, string> }>({ unlocked_keys: [], expires_at: {} })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetch() {
    loading.value = true
    error.value = null
    try {
      list.value = await $fetch(`${apiBase}/cabinet/driver/change-requests`, { credentials: 'include' })
      list.value = Array.isArray(list.value) ? list.value : []
    } catch (e: any) {
      error.value = e?.data?.error || 'Ошибка загрузки'
      list.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchUnlocked() {
    try {
      unlocked.value = await $fetch(`${apiBase}/cabinet/driver/change-requests/unlocked`, { credentials: 'include' })
    } catch {
      unlocked.value = { unlocked_keys: [], expires_at: {} }
    }
  }

  async function create(body: { field_key: string; reason: string; requested_value?: string }) {
    const res = await $fetch(`${apiBase}/cabinet/driver/change-requests`, {
      method: 'POST',
      credentials: 'include',
      body,
    })
    await fetch()
    await fetchUnlocked()
    return res
  }

  async function cancel(id: string) {
    await $fetch(`${apiBase}/cabinet/driver/change-requests/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    await fetch()
    await fetchUnlocked()
  }

  return { list, unlocked, loading, error, fetch, fetchUnlocked, create, cancel }
}
