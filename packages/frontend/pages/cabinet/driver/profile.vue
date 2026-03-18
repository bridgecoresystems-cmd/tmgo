<template>
  <div class="profile-page">
    <n-grid :cols="3" :x-gap="24" responsive="screen">
      <!-- Left column: Avatar and basic info -->
      <n-gi :span="1">
        <n-card class="shadow-sm text-center">
          <n-space vertical align="center" size="large">
            <div class="avatar-wrap">
              <n-avatar
                round
                :size="120"
                :src="avatarUrl"
                :style="!avatarUrl ? { backgroundColor: '#ff6b4a', fontSize: '48px' } : undefined"
              >
                {{ displayName?.charAt(0) || 'U' }}
              </n-avatar>
              <n-upload
                :default-file-list="[]"
                :max="1"
                accept=".jpg,.jpeg,.png,.gif,.webp"
                :custom-request="handleAvatarUpload"
                :show-file-list="false"
              >
                <n-button quaternary size="small" class="avatar-upload-btn">{{ t('driver.profile.changePhoto') }}</n-button>
              </n-upload>
            </div>
            <div>
              <n-h2 style="margin: 0">{{ displayName || t('driver.profile.carrier') }}</n-h2>
              <n-text depth="3">{{ t('driver.profile.carrier') }}</n-text>
            </div>
            <n-tag type="info" round :bordered="false">{{ t('driver.profile.personalCabinet') }}</n-tag>

            <n-divider />

            <div class="profile-details">
              <div class="detail-item">
                <n-text depth="3">Email:</n-text>
                <n-text strong>{{ profile?.email || '—' }}</n-text>
              </div>
              <div v-if="phones.length" class="detail-item">
                <n-text depth="3">{{ t('driver.profile.phones') }}</n-text>
                <div class="phones-list">
                  <n-text v-for="(p, i) in phones" :key="i" strong>{{ p }}</n-text>
                </div>
              </div>
            </div>
          </n-space>
        </n-card>
      </n-gi>

      <!-- Right column: Forms -->
      <n-gi :span="2">
        <n-tabs type="line" animated>
          <n-tab-pane name="security" :tab="t('driver.profile.security')">
            <n-form class="mt-20" style="max-width: 400px">
              <n-form-item :label="t('driver.profile.currentPassword')">
                <n-input
                  v-model:value="passwordForm.currentPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="t('driver.profile.currentPasswordPlaceholder')"
                />
              </n-form-item>
              <n-form-item :label="t('driver.profile.newPassword')">
                <n-input
                  v-model:value="passwordForm.newPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="t('driver.profile.newPasswordPlaceholder')"
                />
              </n-form-item>
              <n-form-item :label="t('driver.profile.confirmPassword')">
                <n-input
                  v-model:value="passwordForm.confirmPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="t('driver.profile.confirmPasswordPlaceholder')"
                />
              </n-form-item>
              <n-button type="primary" :loading="passwordLoading" @click="handleChangePassword">
                {{ t('driver.profile.updatePassword') }}
              </n-button>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

useSeoMeta({ title: t('driver.profile.title') })

const { apiBase } = useApiBase()
const { fetchSession } = useAuth()
const message = useMessage()

const profile = ref<{
  role: string
  surname?: string
  given_name?: string
  displayName: string
  email: string
  image?: string
  phones: string[]
} | null>(null)

const displayName = computed(() => {
  if (!profile.value) return ''
  if (profile.value.role === 'driver') {
    return [profile.value.surname, profile.value.given_name].filter(Boolean).join(' ') || t('driver.profile.carrier')
  }
  return profile.value.displayName
})

const phones = computed(() => profile.value?.phones ?? [])

const avatarUrl = computed(() => useAvatarUrl(profile.value?.image))

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const passwordLoading = ref(false)

async function loadProfile() {
  try {
    const data = await $fetch<any>(`${apiBase}/cabinet/profile`, { credentials: 'include' })
    profile.value = data
  } catch {
    profile.value = null
  }
}

async function handleAvatarUpload({
  file,
  onFinish,
  onError,
}: {
  file: { file: File }
  onFinish: () => void
  onError: (e: Error) => void
}) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    const res = await $fetch<{ url: string }>(`${apiBase}/api/auth/upload-avatar`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    await fetchSession()
    await loadProfile()
    message.success(t('driver.profile.photoUpdated'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('driver.profile.uploadError'))
    onError(e)
  }
}

async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.error(t('driver.profile.passwordsMismatch'))
    return
  }
  if (passwordForm.newPassword.length < 6) {
    message.error(t('driver.profile.passwordTooShort'))
    return
  }
  passwordLoading.value = true
  try {
    await $fetch(`${apiBase}/api/auth/change-password`, {
      method: 'POST',
      credentials: 'include',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
    })
    message.success(t('driver.profile.passwordUpdated'))
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (e: any) {
    message.error(e?.data?.error || t('driver.profile.passwordChangeError'))
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-page {
  max-width: 1000px;
}
.text-center {
  text-align: center;
}
.mt-20 {
  margin-top: 20px;
}
.profile-details {
  width: 100%;
  text-align: left;
}
.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.phones-list {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.shadow-sm {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}
.avatar-wrap {
  position: relative;
}
.avatar-upload-btn {
  margin-top: 8px;
}
</style>
