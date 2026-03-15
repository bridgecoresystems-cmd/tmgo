export function useDriverCitizenships() {
  const { apiBase } = useApiBase()
  const list = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetch() {
    loading.value = true
    error.value = null
    try {
      list.value = await $fetch(`${apiBase}/cabinet/driver/citizenships`, { credentials: 'include' })
      list.value = Array.isArray(list.value) ? list.value : []
    } catch (e: any) {
      error.value = e?.data?.error || 'Ошибка загрузки'
      list.value = []
    } finally {
      loading.value = false
    }
  }

  async function add(body: { country: string; acquired_at?: string; scan_url?: string }) {
    const res = await $fetch(`${apiBase}/cabinet/driver/citizenships`, {
      method: 'POST',
      credentials: 'include',
      body,
    })
    await fetch()
    return res
  }

  async function revoke(id: string) {
    await $fetch(`${apiBase}/cabinet/driver/citizenships/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    await fetch()
  }

  return { list, loading, error, fetch, add, revoke }
}
