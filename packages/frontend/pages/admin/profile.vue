<template>
  <div class="admin-profile">
    <n-grid :cols="3" :x-gap="24" responsive="screen">
      <!-- Левая колонка: Аватар и основная инфа -->
      <n-gi :span="1">
        <n-card class="shadow-sm text-center">
          <n-space vertical align="center" size="large">
            <div class="avatar-wrap">
              <div class="avatar-container">
                <img
                  v-if="avatarUrl && !avatarError"
                  :key="avatarUrl"
                  :src="avatarUrl"
                  alt="Avatar"
                  class="avatar-img"
                  @error="avatarError = true"
                  @load="onAvatarLoad"
                />
                <n-avatar
                  v-else
                  round
                  :size="120"
                  :style="{ backgroundColor: '#ff6b4a', fontSize: '48px' }"
                >
                  {{ session?.user?.name?.charAt(0) || 'A' }}
                </n-avatar>
              </div>
              <n-upload
                :default-file-list="[]"
                :max="1"
                accept=".jpg,.jpeg,.png,.gif,.webp"
                :custom-request="handleAvatarUpload"
                :show-file-list="false"
              >
                <n-button quaternary size="small" class="avatar-upload-btn">{{ $t('admin.profile.changePhoto') }}</n-button>
              </n-upload>
            </div>
            <div>
              <n-h2 style="margin: 0">{{ session?.user?.name || $t('admin.profile.administrator') }}</n-h2>
              <n-text depth="3">Super Admin</n-text>
            </div>
            <n-tag type="success" round :bordered="false">{{ $t('admin.profile.active') }}</n-tag>

            <n-divider />

            <div class="profile-details">
              <div class="detail-item">
                <n-text depth="3">{{ $t('common.email') }}:</n-text>
                <n-text strong>{{ session?.user?.email }}</n-text>
              </div>
              <div class="detail-item">
                <n-text depth="3">{{ $t('admin.profile.phone') }}</n-text>
                <n-text strong>{{ session?.user?.phone || $t('admin.profile.notSpecified') }}</n-text>
              </div>
            </div>
          </n-space>
        </n-card>
      </n-gi>

      <!-- Правая колонка: Формы редактирования -->
      <n-gi :span="2">
        <n-tabs type="line" animated>
          <n-tab-pane name="basic" :tab="$t('admin.profile.basicData')">
            <n-form class="mt-20" style="max-width: 400px">
              <n-form-item :label="$t('admin.profile.fullName')">
                <n-input v-model:value="profileForm.name" :placeholder="$t('admin.profile.enterName')" />
              </n-form-item>
              <n-form-item :label="$t('common.email')">
                <n-input :value="profileForm.email" disabled />
              </n-form-item>
              <n-form-item :label="$t('admin.profile.phoneNumber')">
                <n-input v-model:value="profileForm.phone" placeholder="+993 ..." />
              </n-form-item>
              <n-button type="primary" :loading="basicLoading" @click="handleUpdateProfile">
                {{ $t('admin.profile.saveChanges') }}
              </n-button>
            </n-form>
          </n-tab-pane>

          <n-tab-pane name="security" :tab="$t('admin.profile.security')">
            <n-form class="mt-20" style="max-width: 400px">
              <n-form-item :label="$t('admin.profile.currentPassword')">
                <n-input
                  v-model:value="passwordForm.currentPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('admin.profile.enterCurrentPassword')"
                />
              </n-form-item>
              <n-form-item :label="$t('admin.profile.newPassword')">
                <n-input
                  v-model:value="passwordForm.newPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('admin.profile.minChars')"
                />
              </n-form-item>
              <n-form-item :label="$t('admin.profile.confirmPassword')">
                <n-input
                  v-model:value="passwordForm.confirmPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('admin.profile.repeatNewPassword')"
                />
              </n-form-item>
              <n-button type="primary" :loading="passwordLoading" @click="handleChangePassword">
                {{ $t('admin.profile.updatePassword') }}
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

definePageMeta({ layout: 'admin' })

const { t } = useI18n()

const { apiBase } = useApiBase()
const { session, fetchSession } = useAuth()
const message = useMessage()

const avatarUrl = computed(() => useAvatarUrl(session.value?.user?.image))
const avatarError = ref(false)
watch(avatarUrl, () => { avatarError.value = false })
function onAvatarLoad() {
  if (import.meta.dev) console.log('[Profile] avatar img loaded OK')
}

watch(
  [avatarUrl, () => session.value?.user],
  ([url, user]) => {
    if (import.meta.dev) {
      console.log('[Profile] avatarUrl:', url, '| user.image:', user?.image, '| full user:', user)
    }
  },
  { immediate: true }
)

const profileForm = reactive({
  name: '',
  email: '',
  phone: '',
})

const basicLoading = ref(false)
const passwordLoading = ref(false)

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

watch(
  () => session.value?.user,
  (user) => {
    if (user) {
      profileForm.name = user.name || ''
      profileForm.email = user.email || ''
      profileForm.phone = user.phone || ''
    }
  },
  { immediate: true }
)

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
    const res = await $fetch<{ url?: string }>(`${apiBase}/api/auth/upload-avatar`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    if (import.meta.dev) console.log('[Profile] upload-avatar response:', res)
    await fetchSession()
    if (import.meta.dev) console.log('[Profile] after fetchSession, user.image:', session.value?.user?.image)
    message.success(t('client.profile.photoUpdated'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

async function handleUpdateProfile() {
  basicLoading.value = true
  try {
    await $fetch(`${apiBase}/api/auth/update-profile`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        name: profileForm.name || undefined,
        phone: profileForm.phone || null,
      },
    })
    await fetchSession()
    message.success(t('client.profile.profileUpdated'))
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally {
    basicLoading.value = false
  }
}

async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.error(t('client.profile.passwordsMismatch'))
    return
  }
  if (passwordForm.newPassword.length < 6) {
    message.error(t('client.profile.passwordTooShort'))
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
    message.success(t('client.profile.passwordUpdated'))
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (e: any) {
    message.error(e?.data?.error || t('client.profile.passwordChangeError'))
  } finally {
    passwordLoading.value = false
  }
}
</script>

<style scoped>
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
  margin-bottom: 12px;
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
.avatar-container {
  position: relative;
}
.avatar-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
