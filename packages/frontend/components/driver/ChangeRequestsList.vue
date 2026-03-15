<template>
  <div class="change-requests-list">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" style="margin-bottom: 16px">{{ error }}</n-alert>
      <n-space vertical>
        <div class="list-header">
          <n-button type="primary" size="small" @click="showAddModal = true">Создать запрос</n-button>
        </div>
        <n-empty v-if="!loading && list.length === 0" description="Нет запросов на изменение" />
        <n-list v-else bordered>
          <n-list-item v-for="r in list" :key="r.id">
            <n-thing>
              <template #header>
                <n-space align="center">
                  <span>{{ fieldLabel(r.field_key) }}</span>
                  <n-tag :type="statusTagType(r.status)" size="small">{{ statusLabel(r.status) }}</n-tag>
                </n-space>
              </template>
              <template #description>
                <p v-if="r.reason" style="margin: 4px 0 0;">{{ r.reason }}</p>
                <p v-if="r.admin_comment" style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">
                  Ответ: {{ r.admin_comment }}
                </p>
                <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.7;">
                  {{ formatDate(r.requested_at) }}
                </p>
              </template>
            </n-thing>
            <template #suffix>
              <n-popconfirm
                v-if="r.status === 'pending'"
                positive-text="Отозвать"
                negative-text="Отмена"
                @positive-click="doCancel(r.id)"
              >
                <template #trigger>
                  <n-button quaternary size="small">Отозвать</n-button>
                </template>
                Отозвать запрос?
              </n-popconfirm>
            </template>
          </n-list-item>
        </n-list>
      </n-space>
    </n-spin>

    <n-modal v-model:show="showAddModal" preset="card" title="Создать запрос на изменение" style="max-width: 450px">
      <n-alert type="info" style="margin-bottom: 16px">
        Запросы на изменение доступны после верификации профиля. Укажите причину и желаемое изменение.
      </n-alert>
      <n-form :model="addForm" label-placement="top">
        <n-form-item label="Тип изменения" required>
          <n-select v-model:value="addForm.field_key" :options="fieldKeyOptions" placeholder="Выберите" />
        </n-form-item>
        <n-form-item label="Причина" required>
          <n-input v-model:value="addForm.reason" type="textarea" placeholder="Опишите причину запроса" :rows="3" />
        </n-form-item>
        <n-form-item label="Желаемое значение (опционально)">
          <n-input v-model:value="addForm.requested_value" placeholder="Новое значение, если применимо" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddModal = false">Отмена</n-button>
          <n-button type="primary" :loading="adding" @click="doAdd">Отправить</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { list, loading, error, fetch, create, cancel } = useDriverChangeRequests()
const message = useMessage()
const showAddModal = ref(false)
const adding = ref(false)
const addForm = reactive({ field_key: 'surname', reason: '', requested_value: '' })

const fieldKeyOptions = [
  { label: 'Фамилия', value: 'surname' },
  { label: 'Имя', value: 'given_name' },
  { label: 'Отчество', value: 'patronymic' },
  { label: 'Дата рождения', value: 'date_of_birth' },
  { label: 'Пол', value: 'gender' },
  { label: 'Добавить паспорт', value: 'passport:add' },
  { label: 'Обновить паспорт', value: 'passport:renew' },
  { label: 'Обновить ВУ', value: 'drivers_license:renew' },
  { label: 'Обновить медсправку', value: 'medical_certificate:renew' },
  { label: 'Добавить визу', value: 'visa:add' },
  { label: 'Добавить страховку', value: 'insurance:add' },
  { label: 'Добавить разрешение на въезд', value: 'entry_permit:add' },
  { label: 'Добавить гражданство', value: 'citizenship:add' },
  { label: 'Отказ от гражданства', value: 'citizenship:revoke' },
  { label: 'Исправление данных', value: 'identity_correction' },
]

const FIELD_LABELS: Record<string, string> = {
  surname: 'Фамилия',
  given_name: 'Имя',
  passport: 'Паспорт',
  'passport:add': 'Добавить паспорт',
  'passport:renew': 'Обновить паспорт',
  'drivers_license:renew': 'Обновить ВУ',
  'citizenship:add': 'Добавить гражданство',
  'citizenship:revoke': 'Отказ от гражданства',
}

function fieldLabel(key: string) {
  return FIELD_LABELS[key] || key
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

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('ru-RU')
}

async function doAdd() {
  if (!addForm.reason?.trim()) {
    message.error('Укажите причину запроса')
    return
  }
  adding.value = true
  try {
    await create({
      field_key: addForm.field_key,
      reason: addForm.reason.trim(),
      requested_value: addForm.requested_value?.trim() || undefined,
    })
    message.success('Запрос отправлен')
    showAddModal.value = false
    addForm.reason = ''
    addForm.requested_value = ''
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    adding.value = false
  }
}

async function doCancel(id: string) {
  try {
    await cancel(id)
    message.success('Запрос отозван')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  }
}

onMounted(() => fetch())

defineExpose({ fetch })
</script>

<style scoped>
.list-header {
  margin-bottom: 16px;
}
</style>
