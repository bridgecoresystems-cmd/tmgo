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
          <n-tag v-if="user?.role" :type="roleTagType">{{ user.role }}</n-tag>
          <n-tag v-if="profile?.verification_status === 'verified'" type="success">Верифицирован</n-tag>
          <n-tag v-else-if="profile?.verification_status === 'waiting_verification'" type="warning">Ожидает проверки</n-tag>
          <n-tag v-else-if="profile?.verification_status === 'not_verified'" type="default">Не верифицирован</n-tag>
          <n-button
            v-if="user?.role === 'driver' && profile && profile?.verification_status !== 'verified'"
            type="primary"
            :loading="verifying"
            @click="handleVerify"
          >
            Верифицировать
          </n-button>
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
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const { apiBase } = useApiBase()
const message = useMessage()
const loading = ref(true)
const loadError = ref<string | null>(null)
const verifying = ref(false)
const user = ref<any>(null)
const profile = ref<any>(null)
const formRef = ref<{ loadProfile: () => Promise<void>; handleSave: () => Promise<void> } | null>(null)

const loadUrl = computed(() => `${apiBase}/admin/users/${route.params.id}/driver-profile`)
const saveUrl = computed(() => `${apiBase}/admin/users/${route.params.id}/driver-profile`)

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
  }
}

async function handleVerify() {
  verifying.value = true
  try {
    await $fetch(`${apiBase}/admin/users/${route.params.id}/verify`, {
      method: 'POST',
      credentials: 'include',
    })
    profile.value = { ...profile.value, is_verified: true, verification_status: 'verified' }
    message.success('Водитель верифицирован')
  } catch (e: any) {
    message.error(e?.data?.message || e?.message || 'Ошибка верификации')
  } finally {
    verifying.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.form-uniform :deep(.n-form-item .n-input),
.form-uniform :deep(.n-form-item .n-select) {
  width: 100%;
}
</style>
