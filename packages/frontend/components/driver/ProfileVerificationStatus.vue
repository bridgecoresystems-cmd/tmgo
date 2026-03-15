<template>
  <n-alert v-if="data" :type="alertType" :title="title" style="margin-bottom: 16px">
    <template #header>
      <span>{{ title }}</span>
      <n-tag v-if="data.missing_fields?.length" size="small" type="warning" style="margin-left: 8px">
        Заполните: {{ missingLabels }}
      </n-tag>
    </template>
    <p v-if="data.comment" class="verification-comment">{{ data.comment }}</p>
    <p v-else-if="data.submitted_at" class="verification-date">Отправлено: {{ formatDate(data.submitted_at) }}</p>
    <template #footer>
      <n-space>
        <n-button
          v-if="canSubmit"
          type="success"
          size="small"
          :loading="submitting"
          @click="submit"
        >
          Отправить на верификацию
        </n-button>
        <n-button
          v-if="canResubmit"
          type="primary"
          size="small"
          :loading="submitting"
          @click="resubmit"
        >
          Отправить повторно
        </n-button>
      </n-space>
    </template>
  </n-alert>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { data, fetchStatus } = useDriverVerificationStatus()
const message = useMessage()
const submitting = ref(false)
const { apiBase } = useApiBase()

const canSubmit = computed(() => {
  const s = data.value?.status
  return s && ['not_submitted', 'draft', 'not_verified'].includes(s)
})

const canResubmit = computed(() => data.value?.status === 'rejected')

const alertType = computed(() => {
  const s = data.value?.status
  if (s === 'verified') return 'success'
  if (s === 'rejected' || s === 'suspended') return 'error'
  if (s === 'submitted' || s === 'waiting_verification') return 'info'
  return 'default'
})

const title = computed(() => {
  const s = data.value?.status
  switch (s) {
    case 'verified': return 'Верифицирован'
    case 'submitted':
    case 'waiting_verification': return 'Ожидает проверки'
    case 'rejected': return 'Отклонён'
    case 'suspended': return 'Приостановлен'
    case 'request': return 'Запрос на изменение'
    default: return 'Статус верификации'
  }
})

const missingLabels = computed(() => {
  const labels: Record<string, string> = {
    surname: 'фамилию', given_name: 'имя', date_of_birth: 'дату рождения', gender: 'пол',
    passport: 'паспорт', drivers_license: 'ВУ', citizenship: 'гражданство',
  }
  return (data.value?.missing_fields ?? []).map((f) => labels[f] || f).join(', ')
})

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU')
}

async function submit() {
  submitting.value = true
  try {
    await $fetch(`${apiBase}/cabinet/driver/profile/submit-for-verification`, {
      method: 'POST',
      credentials: 'include',
      body: {},
    })
    message.success('Отправлено на верификацию')
    await fetchStatus()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    submitting.value = false
  }
}

async function resubmit() {
  submitting.value = true
  try {
    await $fetch(`${apiBase}/cabinet/driver/profile/resubmit`, {
      method: 'POST',
      credentials: 'include',
      body: {},
    })
    message.success('Отправлено повторно')
    await fetchStatus()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.verification-comment {
  margin: 8px 0 0;
  font-size: 14px;
}
.verification-date {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.9;
}
</style>
