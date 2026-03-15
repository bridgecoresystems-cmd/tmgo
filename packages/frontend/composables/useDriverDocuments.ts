export function useDriverDocuments() {
  const { apiBase } = useApiBase()
  const docs = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetch(showHistory = false) {
    loading.value = true
    error.value = null
    try {
      const url = `${apiBase}/cabinet/driver/documents${showHistory ? '?show_history=true' : ''}`
      docs.value = await $fetch(url, { credentials: 'include' })
      docs.value = Array.isArray(docs.value) ? docs.value : []
    } catch (e: any) {
      error.value = e?.data?.error || 'Ошибка загрузки'
      docs.value = []
    } finally {
      loading.value = false
    }
  }

  async function upload(file: File, docType = 'document') {
    const fd = new FormData()
    fd.append('file', file, file.name)
    fd.append('doc_type', docType)
    const res = await $fetch<{ url: string }>(`${apiBase}/cabinet/driver/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    return res.url
  }

  function scanFullUrl(path: string) {
    if (!path) return ''
    return path.startsWith('http') ? path : `${apiBase}${path}`
  }

  async function create(body: {
    doc_type: string
    country?: string | null
    series?: string | null
    number?: string | null
    issued_by?: string | null
    issued_at?: string | null
    expires_at?: string | null
    place_of_birth?: string | null
    residential_address?: string | null
    license_categories?: string | null
    permission_zone?: string | null
    notes?: string | null
    scan_url?: string | null
  }) {
    const res = await $fetch(`${apiBase}/cabinet/driver/documents`, {
      method: 'POST',
      credentials: 'include',
      body,
    })
    await fetch()
    return res
  }

  async function update(
    id: string,
    body: {
      country?: string | null
      series?: string | null
      number?: string | null
      issued_by?: string | null
      issued_at?: string | null
      expires_at?: string | null
      place_of_birth?: string | null
      residential_address?: string | null
      license_categories?: string | null
      permission_zone?: string | null
      notes?: string | null
      scan_url?: string | null
    }
  ) {
    const res = await $fetch(`${apiBase}/cabinet/driver/documents/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      body,
    })
    await fetch()
    return res
  }

  async function renew(
    id: string,
    body?: {
      country?: string | null
      series?: string | null
      number?: string | null
      issued_by?: string | null
      issued_at?: string | null
      expires_at?: string | null
      place_of_birth?: string | null
      residential_address?: string | null
      license_categories?: string | null
      permission_zone?: string | null
      notes?: string | null
      scan_url?: string | null
    }
  ) {
    const res = await $fetch(`${apiBase}/cabinet/driver/documents/${id}/renew`, {
      method: 'POST',
      credentials: 'include',
      body: body ?? {},
    })
    await fetch()
    return res
  }

  async function remove(id: string) {
    await $fetch(`${apiBase}/cabinet/driver/documents/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    await fetch()
  }

  return { docs, loading, error, fetch, upload, create, update, renew, remove, scanFullUrl }
}
