<template>
  <div class="profile-page">
    <n-grid :cols="3" :x-gap="24" responsive="screen">
      <!-- Левая колонка: Аватар и основная инфа -->
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
                <n-button quaternary size="small" class="avatar-upload-btn">Изменить фото</n-button>
              </n-upload>
            </div>
            <div>
              <n-h2 style="margin: 0">{{ displayName || 'Заказчик' }}</n-h2>
              <n-text depth="3">Заказчик</n-text>
            </div>
            <n-tag type="info" round :bordered="false">Личный кабинет</n-tag>

            <n-divider />

            <div class="profile-details">
              <div class="detail-item">
                <n-text depth="3">Email:</n-text>
                <n-text strong>{{ profile?.email || '—' }}</n-text>
              </div>
              <div v-if="phones.length" class="detail-item">
                <n-text depth="3">Телефоны:</n-text>
                <div class="phones-list">
                  <n-text v-for="(p, i) in phones" :key="i" strong>{{ p }}</n-text>
                </div>
              </div>
            </div>
          </n-space>
        </n-card>
      </n-gi>

      <!-- Правая колонка: Формы -->
      <n-gi :span="2">
        <n-tabs type="line" animated>
          <n-tab-pane name="basic" tab="Основные данные">
            <n-form class="mt-20" style="max-width: 400px">
              <n-form-item label="Имя">
                <n-input v-model:value="basicForm.name" placeholder="Введите имя" />
              </n-form-item>
              <n-form-item label="Email">
                <n-input :value="profile?.email" disabled />
              </n-form-item>
              <n-form-item label="Телефоны (через запятую)">
                <n-input
                  v-model:value="basicForm.phones"
                  type="textarea"
                  placeholder="+993 65 12 34 56, +993 66 12 34 56"
                  :rows="2"
                />
              </n-form-item>
              <n-button type="primary" :loading="basicLoading" @click="handleUpdateProfile">
                Сохранить изменения
              </n-button>
            </n-form>
          </n-tab-pane>

          <n-tab-pane name="security" tab="Безопасность">
            <n-form class="mt-20" style="max-width: 400px">
              <n-form-item label="Текущий пароль">
                <n-input
                  v-model:value="passwordForm.currentPassword"
                  type="password"
                  show-password-on="click"
                  placeholder="Введите текущий пароль"
                />
              </n-form-item>
              <n-form-item label="Новый пароль">
                <n-input
                  v-model:value="passwordForm.newPassword"
                  type="password"
                  show-password-on="click"
                  placeholder="Минимум 6 символов"
                />
              </n-form-item>
              <n-form-item label="Подтвердите пароль">
                <n-input
                  v-model:value="passwordForm.confirmPassword"
                  type="password"
                  show-password-on="click"
                  placeholder="Повторите новый пароль"
                />
              </n-form-item>
              <n-button type="primary" :loading="passwordLoading" @click="handleChangePassword">
                Обновить пароль
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

definePageMeta({ layout: 'cabinet-client', middleware: 'cabinet-auth' })

useSeoMeta({ title: 'Профиль — BridgeCore Systems' })

const { apiBase } = useApiBase()
const { fetchSession } = useAuth()
const message = useMessage()

const profile = ref<{
  role: string
  name?: string
  displayName: string
  email: string
  image?: string
  phone?: string
  phones: string[]
} | null>(null)

const displayName = computed(() => profile.value?.displayName || 'Заказчик')

const phones = computed(() => profile.value?.phones ?? [])

const avatarUrl = computed(() => useAvatarUrl(profile.value?.image))

const basicForm = reactive({
  name: '',
  phones: '',
})

const basicLoading = ref(false)
const passwordLoading = ref(false)

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

async function loadProfile() {
  try {
    const data = await $fetch<any>(`${apiBase}/cabinet/profile`, { credentials: 'include' })
    profile.value = data
    basicForm.name = data.name ?? ''
    basicForm.phones = (data.phones ?? []).join(', ')
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
    message.success('Фото обновлено')
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
    onError(e)
  }
}

async function handleUpdateProfile() {
  basicLoading.value = true
  try {
    const phone = basicForm.phones
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ')
    await $fetch(`${apiBase}/api/auth/update-profile`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        name: basicForm.name || undefined,
        phone: phone || null,
      },
    })
    await fetchSession()
    await loadProfile()
    message.success('Профиль обновлён')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка сохранения')
  } finally {
    basicLoading.value = false
  }
}

async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.error('Пароли не совпадают')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    message.error('Пароль должен быть не менее 6 символов')
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
    message.success('Пароль обновлён')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка смены пароля')
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
