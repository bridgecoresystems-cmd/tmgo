import { useMessage } from 'naive-ui'

/**
 * Composable для работы с запросами на изменение в админке
 */
const CHANGE_REQUEST_FIELD_LABELS: Record<string, string> = {
  'passport:add': 'Добавить паспорт',
  'passport:renew': 'Обновить паспорт',
  'citizenship:add': 'Добавить гражданство',
  'citizenship:revoke': 'Отказ от гражданства',
  'drivers_license:renew': 'Обновить ВУ',
  'medical_certificate:renew': 'Обновить медсправку',
  'visa:add': 'Добавить визу',
  'insurance:add': 'Добавить страховку',
  'entry_permit:add': 'Добавить разрешение на въезд',
  surname: 'Фамилия',
  given_name: 'Имя',
  identity_correction: 'Исправление данных',
}

export function useAdminChangeRequests(onRefresh: () => void) {
  const { apiBase } = useApiBase()
  const route = useRoute()
  const message = useMessage()

  const changeRequestsFilter = ref('pending')
  const changeRequests = ref<any[]>([])
  const changeRequestsLoading = ref(false)
  const approvingRequestId = ref<string | null>(null)
  const rejectingRequestId = ref<string | null>(null)
  const approveRequestModal = ref(false)
  const rejectRequestModal = ref(false)
  const approveRequestComment = ref('')
  const approveRequestUnlockDays = ref(7)
  const rejectRequestComment = ref('')
  const selectedChangeRequest = ref<any>(null)

  function fieldLabel(key: string) {
    return CHANGE_REQUEST_FIELD_LABELS[key] || key
  }

  function statusLabel(s: string) {
    const m: Record<string, string> = {
      pending: 'Ожидает',
      approved: 'Одобрен',
      rejected: 'Отклонён',
      cancelled: 'Отозван',
    }
    return m[s] || s
  }

  function statusTagType(s: string) {
    if (s === 'approved') return 'success'
    if (s === 'rejected') return 'error'
    if (s === 'pending') return 'warning'
    return 'default'
  }

  async function fetchChangeRequests() {
    changeRequestsLoading.value = true
    try {
      const data = await $fetch(`${apiBase}/admin/users/${route.params.id}/change-requests`, {
        credentials: 'include',
        query: { status: changeRequestsFilter.value },
      })
      changeRequests.value = Array.isArray(data) ? data : []
    } catch (e: any) {
      message.error(e?.data?.error || 'Ошибка загрузки')
      changeRequests.value = []
    } finally {
      changeRequestsLoading.value = false
    }
  }

  function openApproveModal(r: any) {
    selectedChangeRequest.value = r
    approveRequestComment.value = ''
    approveRequestUnlockDays.value = 7
    approveRequestModal.value = true
  }

  async function submitApproveRequest() {
    if (!selectedChangeRequest.value?.id) return
    approvingRequestId.value = selectedChangeRequest.value.id
    try {
      await $fetch(`${apiBase}/admin/change-requests/${selectedChangeRequest.value.id}/approve`, {
        method: 'POST',
        credentials: 'include',
        body: { comment: approveRequestComment.value || null, unlock_days: approveRequestUnlockDays.value },
      })
      message.success('Запрос одобрен')
      approveRequestModal.value = false
      selectedChangeRequest.value = null
      await fetchChangeRequests()
      onRefresh()
    } catch (e: any) {
      message.error(e?.data?.error || 'Ошибка')
    } finally {
      approvingRequestId.value = null
    }
  }

  function openRejectModal(r: any) {
    selectedChangeRequest.value = r
    rejectRequestComment.value = ''
    rejectRequestModal.value = true
  }

  async function submitRejectRequest() {
    if (!selectedChangeRequest.value?.id || !rejectRequestComment.value?.trim()) {
      message.error('Укажите причину отклонения')
      return
    }
    rejectingRequestId.value = selectedChangeRequest.value.id
    try {
      await $fetch(`${apiBase}/admin/change-requests/${selectedChangeRequest.value.id}/reject`, {
        method: 'POST',
        credentials: 'include',
        body: { comment: rejectRequestComment.value.trim() },
      })
      message.success('Запрос отклонён')
      rejectRequestModal.value = false
      selectedChangeRequest.value = null
      await fetchChangeRequests()
      onRefresh()
    } catch (e: any) {
      message.error(e?.data?.error || 'Ошибка')
    } finally {
      rejectingRequestId.value = null
    }
  }

  return {
    changeRequestsFilter,
    changeRequests,
    changeRequestsLoading,
    approvingRequestId,
    rejectingRequestId,
    approveRequestModal,
    rejectRequestModal,
    approveRequestComment,
    approveRequestUnlockDays,
    rejectRequestComment,
    selectedChangeRequest,
    fieldLabel,
    statusLabel,
    statusTagType,
    fetchChangeRequests,
    openApproveModal,
    submitApproveRequest,
    openRejectModal,
    submitRejectRequest,
  }
}
