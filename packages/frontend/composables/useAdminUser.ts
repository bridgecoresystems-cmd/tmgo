import { useMessage, useDialog } from 'naive-ui'

/**
 * Composable для загрузки и действий с пользователем в админке
 */
export function useAdminUser() {
  const { t } = useI18n()
  const { apiBase } = useApiBase()
  const route = useRoute()
  const message = useMessage()
  const { impersonate } = useImpersonate()
  const dialog = useDialog()

  const loading = ref(true)
  const loadError = ref<string | null>(null)
  const user = ref<any>(null)
  const profile = ref<any>(null)
  const formRef = ref<{ loadProfile: () => Promise<void>; handleSave: () => Promise<void> } | null>(null)

  const verifying = ref(false)
  const rejecting = ref(false)
  const suspending = ref(false)
  const restoring = ref(false)
  const activating = ref(false)
  const deleting = ref(false)
  const rejectModal = ref(false)
  const suspendModal = ref(false)
  const actionComment = ref('')

  const loadUrl = computed(() => `${apiBase}/admin/users/${route.params.id}/driver-profile`)
  const saveUrl = computed(() => `${apiBase}/admin/users/${route.params.id}/driver-profile`)

  const canVerify = computed(() => {
    const s = profile.value?.verification_status
    return s === 'submitted' || s === 'waiting_verification'
  })
  const canReject = computed(() => canVerify.value)
  const canSuspend = computed(() => profile.value?.verification_status === 'verified')
  const canRestore = computed(() => profile.value?.verification_status === 'suspended')

  const roleTagType = computed(() => {
    const r = user.value?.role
    if (r === 'admin') return 'error'
    if (r === 'driver') return 'info'
    if (r === 'dispatcher') return 'warning'
    return 'default'
  })

  async function load() {
    loading.value = true
    loadError.value = null
    try {
      const u = await $fetch<any>(`${apiBase}/admin/users/${route.params.id}`, { credentials: 'include' })
      user.value = u
      if (u?.role === 'driver') {
        const p = await $fetch<any>(`${apiBase}/admin/users/${route.params.id}/driver-profile`, { credentials: 'include' })
        profile.value = p
      } else {
        profile.value = null
      }
    } catch (e: any) {
      loadError.value = e?.data?.message || e?.message || t('admin.user.loadError')
    } finally {
      loading.value = false
    }
  }

  function onFormSaved() {
    if (user.value?.role === 'driver') {
      $fetch<any>(`${apiBase}/admin/users/${route.params.id}/driver-profile`, { credentials: 'include' })
        .then((p) => { profile.value = p })
        .catch(() => {})
    }
  }

  async function handleActivate() {
    activating.value = true
    try {
      await $fetch(`${apiBase}/admin/users/${route.params.id}/activate`, {
        method: 'POST',
        credentials: 'include',
      })
      user.value = { ...user.value, isActive: true }
      message.success(t('admin.user.userRestored'))
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || t('admin.changeRequests.error'))
    } finally {
      activating.value = false
    }
  }

  async function handleDeletePermanent() {
    if (!user.value?.id) return
    deleting.value = true
    try {
      await $fetch(`${apiBase}/admin/users/${user.value.id}`, { method: 'DELETE', credentials: 'include' })
      message.success(t('admin.user.userDeleted'))
      navigateTo('/admin/settings/deactivated-users')
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || t('admin.user.deleteError'))
    } finally {
      deleting.value = false
    }
  }

  function handleImpersonate() {
    if (!user.value?.id) return
    const name = user.value?.name || user.value?.email || '—'
    dialog.warning({
      title: t('admin.usersIndex.impersonateTitle'),
      content: t('admin.usersIndex.impersonateContent', { name, role: user.value?.role || '' }),
      positiveText: t('admin.usersIndex.impersonateConfirm'),
      negativeText: t('admin.usersIndex.cancel'),
      onPositiveClick: async () => {
        try {
          await impersonate(user.value!.id)
          message.success(t('admin.usersIndex.impersonateSuccess', { name }))
        } catch (e: any) {
          message.error(e?.message || e?.data?.error || t('admin.usersIndex.impersonateError'))
        }
      },
    })
  }

  async function handleVerify() {
    verifying.value = true
    try {
      await $fetch(`${apiBase}/admin/drivers/${route.params.id}/verify`, {
        method: 'POST',
        credentials: 'include',
        body: {},
      })
      profile.value = { ...profile.value, is_verified: true, verification_status: 'verified' }
      message.success(t('admin.user.driverVerified'))
    } catch (e: any) {
      message.error(e?.data?.error || e?.data?.message || e?.message || t('admin.user.verificationError'))
    } finally {
      verifying.value = false
    }
  }

  function handleReject() {
    actionComment.value = ''
    rejectModal.value = true
  }

  async function submitReject() {
    if (!actionComment.value?.trim()) {
      message.error(t('admin.user.specifyRejectReason'))
      return
    }
    rejecting.value = true
    try {
      await $fetch(`${apiBase}/admin/drivers/${route.params.id}/reject`, {
        method: 'POST',
        credentials: 'include',
        body: { comment: actionComment.value.trim() },
      })
      profile.value = { ...profile.value, verification_status: 'rejected' }
      message.success(t('admin.user.verificationRejected'))
      rejectModal.value = false
    } catch (e: any) {
      message.error(e?.data?.error || e?.data?.message || e?.message || t('admin.changeRequests.error'))
    } finally {
      rejecting.value = false
    }
  }

  function handleSuspend() {
    actionComment.value = ''
    suspendModal.value = true
  }

  async function submitSuspend() {
    if (!actionComment.value?.trim()) {
      message.error(t('admin.user.specifySuspendReason'))
      return
    }
    suspending.value = true
    try {
      await $fetch(`${apiBase}/admin/drivers/${route.params.id}/suspend`, {
        method: 'POST',
        credentials: 'include',
        body: { comment: actionComment.value.trim() },
      })
      profile.value = { ...profile.value, verification_status: 'suspended' }
      message.success(t('admin.user.driverSuspended'))
      suspendModal.value = false
    } catch (e: any) {
      message.error(e?.data?.error || e?.data?.message || e?.message || t('admin.changeRequests.error'))
    } finally {
      suspending.value = false
    }
  }

  async function handleRestore() {
    restoring.value = true
    try {
      await $fetch(`${apiBase}/admin/drivers/${route.params.id}/restore`, {
        method: 'POST',
        credentials: 'include',
        body: {},
      })
      profile.value = { ...profile.value, verification_status: 'verified' }
      message.success(t('admin.user.driverRestored'))
    } catch (e: any) {
      message.error(e?.data?.error || e?.data?.message || e?.message || t('admin.changeRequests.error'))
    } finally {
      restoring.value = false
    }
  }

  return {
    loading,
    loadError,
    user,
    profile,
    formRef,
    loadUrl,
    saveUrl,
    canVerify,
    canReject,
    canSuspend,
    canRestore,
    roleTagType,
    verifying,
    rejecting,
    suspending,
    restoring,
    activating,
    deleting,
    rejectModal,
    suspendModal,
    actionComment,
    load,
    onFormSaved,
    handleActivate,
    handleDeletePermanent,
    handleImpersonate,
    handleVerify,
    handleReject,
    submitReject,
    handleSuspend,
    submitSuspend,
    handleRestore,
  }
}
