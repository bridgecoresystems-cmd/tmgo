export function useDriverContacts() {
  const { apiBase } = useApiBase()
  const list = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetch() {
    loading.value = true
    error.value = null
    try {
      list.value = await $fetch(`${apiBase}/cabinet/driver/contacts`, { credentials: 'include' })
      list.value = Array.isArray(list.value) ? list.value : []
    } catch (e: any) {
      error.value = e?.data?.error || 'Ошибка загрузки'
      list.value = []
    } finally {
      loading.value = false
    }
  }

  async function add(body: { contact_type: 'phone' | 'email'; value: string; label?: string }) {
    const res = await $fetch(`${apiBase}/cabinet/driver/contacts`, {
      method: 'POST',
      credentials: 'include',
      body,
    })
    await fetch()
    return res
  }

  async function update(id: string, body: { value?: string; label?: string; is_active?: boolean }) {
    const res = await $fetch(`${apiBase}/cabinet/driver/contacts/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      body,
    })
    await fetch()
    return res
  }

  async function remove(id: string) {
    await $fetch(`${apiBase}/cabinet/driver/contacts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    await fetch()
  }

  return { list, loading, error, fetch, add, update, remove }
}
