import { useMessage } from 'naive-ui'

/**
 * Composable для работы с запросами на изменение в админке
 */
const CHANGE_REQUEST_FIELD_I18N_KEYS: Record<string, string> = {
  'passport:add': 'driver.changeRequests.fieldPassportAdd',
  'passport:renew': 'driver.changeRequests.fieldPassportRenew',
  'citizenship:add': 'driver.changeRequests.fieldCitizenshipAdd',
  'citizenship:revoke': 'driver.changeRequests.fieldCitizenshipRevoke',
  'drivers_license:renew': 'driver.changeRequests.fieldDriversLicenseRenew',
  'medical_certificate:renew': 'driver.changeRequests.fieldMedicalRenew',
  'visa:add': 'driver.changeRequests.fieldVisaAdd',
  'insurance:add': 'driver.changeRequests.fieldInsuranceAdd',
  'entry_permit:add': 'driver.changeRequests.fieldEntryPermitAdd',
  surname: 'driver.changeRequests.fieldSurname',
  given_name: 'driver.changeRequests.fieldGivenName',
  identity_correction: 'driver.changeRequests.fieldIdentityCorrection',
}

export function useAdminChangeRequests(onRefresh: () => void) {
  const { t } = useI18n()
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
    const i18nKey = CHANGE_REQUEST_FIELD_I18N_KEYS[key]
    return i18nKey ? t(i18nKey) : key
  }

  function statusLabel(s: string) {
    const m: Record<string, string> = {
      pending: t('driver.changeRequests.statusPending'),
      approved: t('driver.changeRequests.statusApproved'),
      rejected: t('driver.changeRequests.statusRejected'),
      cancelled: t('driver.changeRequests.statusCancelled'),
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
      message.error(e?.data?.error || t('admin.changeRequests.loadError'))
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
      message.success(t('admin.changeRequests.requestApproved'))
      approveRequestModal.value = false
      selectedChangeRequest.value = null
      await fetchChangeRequests()
      onRefresh()
    } catch (e: any) {
      message.error(e?.data?.error || t('admin.changeRequests.error'))
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
      message.error(t('admin.changeRequests.specifyRejectReason'))
      return
    }
    rejectingRequestId.value = selectedChangeRequest.value.id
    try {
      await $fetch(`${apiBase}/admin/change-requests/${selectedChangeRequest.value.id}/reject`, {
        method: 'POST',
        credentials: 'include',
        body: { comment: rejectRequestComment.value.trim() },
      })
      message.success(t('admin.changeRequests.requestRejected'))
      rejectRequestModal.value = false
      selectedChangeRequest.value = null
      await fetchChangeRequests()
      onRefresh()
    } catch (e: any) {
      message.error(e?.data?.error || t('admin.changeRequests.error'))
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
