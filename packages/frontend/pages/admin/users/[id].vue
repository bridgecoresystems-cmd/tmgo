<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/admin/users')">← К списку пользователей</n-button>

    <n-spin v-if="loading" />
    <n-alert v-else-if="loadError" type="error" style="margin-bottom: 16px">
      {{ loadError }}
      <n-button size="small" style="margin-top: 8px" @click="load">Повторить</n-button>
    </n-alert>

    <template v-else>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <n-h3 style="margin: 0;">{{ user?.name || user?.email || 'Пользователь' }}</n-h3>
        <n-space>
          <n-button
            v-if="user?.role !== 'admin' && user?.isActive"
            type="info"
            quaternary
            @click="handleImpersonate"
          >
            👤 Войти под пользователем
          </n-button>
          <n-tag v-if="!user?.isActive" type="error">Деактивирован</n-tag>
          <n-tag v-else-if="user?.role" :type="roleTagType">{{ user.role }}</n-tag>
          <n-tag v-if="profile?.verification_status === 'verified'" type="success">Верифицирован</n-tag>
          <n-tag v-else-if="profile?.verification_status === 'submitted' || profile?.verification_status === 'waiting_verification'" type="warning">Ожидает проверки</n-tag>
          <n-tag v-else-if="profile?.verification_status === 'request'" type="info">Запрос</n-tag>
          <n-tag v-else-if="profile?.verification_status === 'rejected'" type="error">Отклонён</n-tag>
          <n-tag v-else-if="profile?.verification_status === 'suspended'" type="error">Приостановлен</n-tag>
          <n-tag v-else-if="profile?.verification_status === 'not_verified' || profile?.verification_status === 'not_submitted'" type="default">Не верифицирован</n-tag>
          <n-space v-if="user?.role === 'driver' && profile" :size="8">
            <n-button
              v-if="canVerify"
              type="primary"
              :loading="verifying"
              @click="handleVerify"
            >
              Верифицировать
            </n-button>
            <n-button
              v-if="canReject"
              type="error"
              quaternary
              :loading="rejecting"
              @click="handleReject"
            >
              Отклонить
            </n-button>
            <n-button
              v-if="canSuspend"
              type="warning"
              quaternary
              :loading="suspending"
              @click="handleSuspend"
            >
              Приостановить
            </n-button>
            <n-button
              v-if="canRestore"
              type="success"
              quaternary
              :loading="restoring"
              @click="handleRestore"
            >
              Восстановить
            </n-button>
          </n-space>
          <n-button
            v-if="!user?.isActive"
            type="success"
            :loading="activating"
            @click="handleActivate"
          >
            Восстановить
          </n-button>
          <n-popconfirm
            v-if="!user?.isActive"
            positive-text="Удалить"
            negative-text="Отмена"
            @positive-click="handleDeletePermanent"
          >
            <template #trigger>
              <n-button type="error" :loading="deleting" quaternary>
                Удалить навсегда
              </n-button>
            </template>
            Удалить пользователя навсегда? Все данные будут безвозвратно потеряны.
          </n-popconfirm>
        </n-space>
      </div>

      <n-card v-if="user?.role === 'driver' && profile">
        <DriverCardForm
          ref="formRef"
          :load-url="loadUrl"
          :save-url="saveUrl"
          save-method="PATCH"
          :api-base="apiBase"
          :initial-profile="profile"
          @saved="onFormSaved"
        />
      </n-card>

      <n-card v-if="user?.role === 'driver'" title="Запросы на изменение" style="margin-top: 20px;">
        <n-tabs v-model:value="changeRequestsFilter" type="line" @update:value="fetchChangeRequests">
          <n-tab-pane name="pending" tab="Ожидают" />
          <n-tab-pane name="approved" tab="Одобрены" />
          <n-tab-pane name="rejected" tab="Отклонены" />
          <n-tab-pane name="all" tab="Все" />
        </n-tabs>
        <n-spin :show="changeRequestsLoading">
          <n-empty v-if="!changeRequestsLoading && changeRequests.length === 0" description="Нет запросов" />
          <n-list v-else bordered>
            <n-list-item v-for="r in changeRequests" :key="r.id">
              <n-thing>
                <template #header>
                  <n-space align="center">
                    <span>{{ changeRequestFieldLabel(r.field_key) }}</span>
                    <n-tag :type="changeRequestStatusTagType(r.status)" size="small">{{ changeRequestStatusLabel(r.status) }}</n-tag>
                  </n-space>
                </template>
                <template #description>
                  <p v-if="r.reason" style="margin: 4px 0;">{{ r.reason }}</p>
                  <p v-if="r.requested_value" style="margin: 4px 0; font-size: 13px;">Желаемое значение: {{ r.requested_value }}</p>
                  <p v-if="r.admin_comment" style="margin: 4px 0; font-size: 12px; opacity: 0.9;">Ответ: {{ r.admin_comment }}</p>
                  <p style="margin: 4px 0; font-size: 12px; opacity: 0.7;">{{ r.requested_at }}</p>
                </template>
              </n-thing>
              <template #suffix>
                <n-space v-if="r.status === 'pending'">
                  <n-button type="success" size="small" :loading="approvingRequestId === r.id" @click="openApproveModal(r)">
                    Одобрить
                  </n-button>
                  <n-button type="error" quaternary size="small" :loading="rejectingRequestId === r.id" @click="openRejectModal(r)">
                    Отклонить
                  </n-button>
                </n-space>
              </template>
            </n-list-item>
          </n-list>
        </n-spin>
      </n-card>

      <n-card v-else>
        <n-descriptions :column="1" label-placement="left">
          <n-descriptions-item label="Имя">{{ user?.name || '—' }}</n-descriptions-item>
          <n-descriptions-item label="Email">{{ user?.email || '—' }}</n-descriptions-item>
          <n-descriptions-item label="Роль">{{ user?.role || '—' }}</n-descriptions-item>
          <n-descriptions-item label="Дата регистрации">{{ user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—' }}</n-descriptions-item>
        </n-descriptions>
        <n-text v-if="user?.role !== 'driver'" depth="3" style="display: block; margin-top: 16px;">
          Карточка водителя доступна только для пользователей с ролью «driver».
        </n-text>
      </n-card>
    </template>

    <n-modal v-model:show="rejectModal" preset="card" title="Отклонить верификацию" style="max-width: 450px">
      <n-form-item label="Причина отклонения (обязательно)">
        <n-input v-model:value="actionComment" type="textarea" placeholder="Укажите причину..." :rows="3" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="rejectModal = false">Отмена</n-button>
          <n-button type="error" :loading="rejecting" @click="submitReject">Отклонить</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="suspendModal" preset="card" title="Приостановить водителя" style="max-width: 450px">
      <n-form-item label="Причина приостановки (обязательно)">
        <n-input v-model:value="actionComment" type="textarea" placeholder="Укажите причину..." :rows="3" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="suspendModal = false">Отмена</n-button>
          <n-button type="warning" :loading="suspending" @click="submitSuspend">Приостановить</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="approveRequestModal" preset="card" title="Одобрить запрос" style="max-width: 400px">
      <n-form-item label="Комментарий (опционально)">
        <n-input v-model:value="approveRequestComment" type="textarea" placeholder="Комментарий для водителя" :rows="2" />
      </n-form-item>
      <n-form-item label="Срок разблокировки (дней)">
        <n-input-number v-model:value="approveRequestUnlockDays" :min="1" :max="90" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="approveRequestModal = false">Отмена</n-button>
          <n-button type="success" :loading="!!approvingRequestId" @click="submitApproveRequest">Одобрить</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="rejectRequestModal" preset="card" title="Отклонить запрос" style="max-width: 400px">
      <n-form-item label="Причина отклонения (обязательно)">
        <n-input v-model:value="rejectRequestComment" type="textarea" placeholder="Укажите причину..." :rows="3" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="rejectRequestModal = false">Отмена</n-button>
          <n-button type="error" :loading="!!rejectingRequestId" :disabled="!rejectRequestComment?.trim()" @click="submitRejectRequest">
            Отклонить
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { useMessage, useDialog } from 'naive-ui'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const { apiBase } = useApiBase()
const message = useMessage()
const { impersonate } = useImpersonate()
const dialog = useDialog()
const loading = ref(true)
const loadError = ref<string | null>(null)
const verifying = ref(false)
const rejecting = ref(false)
const suspending = ref(false)
const restoring = ref(false)
const activating = ref(false)
const deleting = ref(false)
const user = ref<any>(null)
const profile = ref<any>(null)
const formRef = ref<{ loadProfile: () => Promise<void>; handleSave: () => Promise<void> } | null>(null)

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

function changeRequestFieldLabel(key: string) {
  return CHANGE_REQUEST_FIELD_LABELS[key] || key
}

function changeRequestStatusLabel(s: string) {
  const m: Record<string, string> = {
    pending: 'Ожидает',
    approved: 'Одобрен',
    rejected: 'Отклонён',
    cancelled: 'Отозван',
  }
  return m[s] || s
}

function changeRequestStatusTagType(s: string) {
  if (s === 'approved') return 'success'
  if (s === 'rejected') return 'error'
  if (s === 'pending') return 'warning'
  return 'default'
}

async function fetchChangeRequests() {
  if (user.value?.role !== 'driver') return
  changeRequestsLoading.value = true
  try {
    changeRequests.value = await $fetch(`${apiBase}/admin/users/${route.params.id}/change-requests`, {
      credentials: 'include',
      query: { status: changeRequestsFilter.value },
    })
    changeRequests.value = Array.isArray(changeRequests.value) ? changeRequests.value : []
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
    onFormSaved()
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
    onFormSaved()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    rejectingRequestId.value = null
  }
}

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
      await fetchChangeRequests()
    } else {
      profile.value = null
    }
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}

function onFormSaved() {
  if (user.value?.role === 'driver') {
    $fetch<any>(`${apiBase}/admin/users/${route.params.id}/driver-profile`, { credentials: 'include' })
      .then((p) => {
        profile.value = p
      })
      .catch(() => {})
    fetchChangeRequests()
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
    message.success('Пользователь восстановлен')
  } catch (e: any) {
    message.error(e?.data?.message || e?.message || 'Ошибка')
  } finally {
    activating.value = false
  }
}

async function handleDeletePermanent() {
  if (!user.value?.id) return
  deleting.value = true
  try {
    await $fetch(`${apiBase}/admin/users/${user.value.id}`, { method: 'DELETE', credentials: 'include' })
    message.success('Пользователь удалён навсегда')
    navigateTo('/admin/settings/deactivated-users')
  } catch (e: any) {
    message.error(e?.data?.message || e?.message || 'Ошибка удаления')
  } finally {
    deleting.value = false
  }
}

function handleImpersonate() {
  if (!user.value?.id) return
  const name = user.value?.name || user.value?.email || '—'
  dialog.warning({
    title: 'Войти под пользователем',
    content: `Вы войдёте под учётной записью ${name} (${user.value?.role}). Чтобы вернуться — нажмите баннер в кабинете.`,
    positiveText: 'Войти',
    negativeText: 'Отмена',
    onPositiveClick: async () => {
      try {
        await impersonate(user.value!.id)
        message.success(`Вход под ${name}`)
      } catch (e: any) {
        message.error(e?.message || e?.data?.error || 'Ошибка при входе под пользователем')
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
    message.success('Водитель верифицирован')
  } catch (e: any) {
    message.error(e?.data?.error || e?.data?.message || e?.message || 'Ошибка верификации')
  } finally {
    verifying.value = false
  }
}

const rejectModal = ref(false)
const suspendModal = ref(false)
const actionComment = ref('')

function handleReject() {
  actionComment.value = ''
  rejectModal.value = true
}

async function submitReject() {
  if (!actionComment.value?.trim()) {
    message.error('Укажите причину отклонения')
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
    message.success('Верификация отклонена')
    rejectModal.value = false
  } catch (e: any) {
    message.error(e?.data?.error || e?.data?.message || e?.message || 'Ошибка')
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
    message.error('Укажите причину приостановки')
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
    message.success('Водитель приостановлен')
    suspendModal.value = false
  } catch (e: any) {
    message.error(e?.data?.error || e?.data?.message || e?.message || 'Ошибка')
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
    message.success('Водитель восстановлен')
  } catch (e: any) {
    message.error(e?.data?.error || e?.data?.message || e?.message || 'Ошибка')
  } finally {
    restoring.value = false
  }
}

onMounted(load)
watch(changeRequestsFilter, fetchChangeRequests)
</script>

<style scoped>
.form-uniform :deep(.n-form-item .n-input),
.form-uniform :deep(.n-form-item .n-select) {
  width: 100%;
}
</style>
