<template>
  <div class="documents-list">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" style="margin-bottom: 16px">{{ error }}</n-alert>
      <n-space vertical>
        <div class="documents-header">
          <n-checkbox v-model:checked="showHistory">Показать историю</n-checkbox>
          <n-button type="primary" size="small" @click="fetch()">Обновить</n-button>
          <n-button type="primary" size="small" @click="showAddModal = true">Добавить документ</n-button>
        </div>
        <n-empty v-if="!loading && docs.length === 0" description="Нет документов" />
        <div v-else class="documents-by-type">
          <div v-for="(group, type) in groupedDocs" :key="type" class="doc-type-group">
            <n-h4 style="margin: 0 0 12px 0;">{{ docTypeLabel(type) }}</n-h4>
            <n-space vertical :size="12">
              <n-card v-for="doc in group" :key="doc.id" size="small" :class="['doc-card', `doc-card--${doc.status}`]">
                <template #header>
                  <n-space align="center" justify="space-between">
                    <span>{{ doc.series || doc.number ? `${doc.series || ''} ${doc.number || ''}`.trim() : '—' }}</span>
                    <n-tag :type="statusTagType(doc.status)" size="small">{{ statusLabel(doc.status) }}</n-tag>
                  </n-space>
                </template>
                <n-descriptions :column="2" size="small">
                  <n-descriptions-item v-if="doc.issued_at" label="Выдан">{{ doc.issued_at }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.expires_at" label="Действует до">{{ doc.expires_at }}</n-descriptions-item>
                </n-descriptions>
                <div v-if="doc.scan_url" class="scan-link">
                  <n-button text type="primary" size="small" @click="openScan(doc.scan_url)">
                    Просмотр скана
                  </n-button>
                </div>
                <div class="doc-actions">
                  <n-popconfirm
                    v-if="canDelete(doc)"
                    positive-text="Удалить"
                    negative-text="Отмена"
                    @positive-click="doRemove(doc.id)"
                  >
                    <template #trigger>
                      <n-button quaternary size="small" type="error">Удалить</n-button>
                    </template>
                    Удалить документ?
                  </n-popconfirm>
                </div>
              </n-card>
            </n-space>
          </div>
        </div>
      </n-space>
    </n-spin>

    <n-modal v-model:show="showAddModal" preset="card" title="Добавить документ" style="max-width: 500px">
      <n-form ref="addFormRef" :model="addForm" label-placement="top">
        <n-form-item label="Тип документа" required>
          <n-select v-model:value="addForm.doc_type" :options="docTypeOptions" placeholder="Выберите" />
        </n-form-item>
        <n-form-item label="Серия">
          <n-input v-model:value="addForm.series" placeholder="AB" />
        </n-form-item>
        <n-form-item label="Номер">
          <n-input v-model:value="addForm.number" placeholder="1234567" />
        </n-form-item>
        <n-form-item label="Кем выдан">
          <n-input v-model:value="addForm.issued_by" placeholder="ОВД" />
        </n-form-item>
        <n-form-item label="Дата выдачи">
          <n-date-picker
            :value="addForm.issued_at ? new Date(addForm.issued_at).getTime() : null"
            type="date"
            clearable
            style="width: 100%"
            @update:value="(v: number | null) => { addForm.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
          />
        </n-form-item>
        <n-form-item label="Действует до">
          <n-date-picker
            :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
            type="date"
            clearable
            style="width: 100%"
            @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
          />
        </n-form-item>
        <n-form-item label="Скан документа">
          <n-upload
            :max="1"
            :custom-request="handleUpload"
            :show-file-list="false"
          >
            <n-button size="small">{{ addForm.scan_url ? 'Загружено' : 'Загрузить файл' }}</n-button>
          </n-upload>
        </n-form-item>
        <n-form-item v-if="addForm.doc_type === 'drivers_license'" label="Категории ВУ">
          <n-input v-model:value="addForm.license_categories" placeholder="B, C, D, E" />
        </n-form-item>
        <n-form-item label="Примечание">
          <n-input v-model:value="addForm.notes" type="textarea" placeholder="Опционально" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddModal = false">Отмена</n-button>
          <n-button type="primary" :loading="adding" @click="doAdd">Добавить</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { apiBase } = useApiBase()
const { docs, loading, error, fetch, upload, create, remove } = useDriverDocuments()
const message = useMessage()
const showHistory = ref(false)
const showAddModal = ref(false)
const adding = ref(false)

const addForm = reactive({
  doc_type: 'medical_certificate',
  series: '',
  number: '',
  issued_by: '',
  issued_at: null as string | null,
  expires_at: null as string | null,
  scan_url: null as string | null,
  license_categories: '',
  notes: '',
})

const docTypeOptions = [
  { label: 'Медицинская справка', value: 'medical_certificate' },
  { label: 'Страховка', value: 'insurance' },
  { label: 'Виза', value: 'visa' },
  { label: 'Разрешение на въезд', value: 'entry_permit' },
  { label: 'Паспорт', value: 'passport' },
  { label: 'Водительское удостоверение', value: 'drivers_license' },
  { label: 'Международное ВУ', value: 'international_drivers_license' },
  { label: 'Карта тахографа', value: 'tachograph_card' },
  { label: 'Сертификат техминимума', value: 'technical_minimum_cert' },
  { label: 'ADR допуск', value: 'adr_certificate' },
  { label: 'Прочее', value: 'other' },
]

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: 'Паспорт',
  drivers_license: 'Водительское удостоверение',
  medical_certificate: 'Медицинская справка',
  insurance: 'Страховка',
  visa: 'Виза',
  entry_permit: 'Разрешение на въезд',
  other: 'Прочее',
}

const groupedDocs = computed(() => {
  const byType: Record<string, any[]> = {}
  for (const d of docs.value) {
    const t = d.doc_type || 'other'
    if (!byType[t]) byType[t] = []
    byType[t].push(d)
  }
  return byType
})

function docTypeLabel(type: string) {
  return DOC_TYPE_LABELS[type] || type
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    active: 'Активен',
    pending_verification: 'На проверке',
    expired: 'Истёк',
    revoked: 'Отозван',
    superseded: 'Заменён',
    rejected: 'Отклонён',
  }
  return m[s] || s
}

function statusTagType(s: string) {
  if (s === 'active') return 'success'
  if (s === 'pending_verification') return 'warning'
  if (s === 'expired' || s === 'rejected') return 'error'
  return 'default'
}

function openScan(path: string) {
  const url = path.startsWith('http') ? path : `${apiBase}${path}`
  window.open(url, '_blank')
}

const RESTRICTED_TYPES = ['passport', 'drivers_license']
function canDelete(doc: any) {
  return !RESTRICTED_TYPES.includes(doc.doc_type)
}

async function doRemove(id: string) {
  try {
    await remove(id)
    message.success('Документ удалён')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  }
}

async function handleUpload({ file, onFinish, onError }: { file: { file?: File }; onFinish: () => void; onError?: () => void }) {
  const f = file.file
  if (!f) {
    onError?.()
    return
  }
  try {
    const fd = new FormData()
    fd.append('file', f, f.name)
    fd.append('doc_type', addForm.doc_type)
    const res = await $fetch<{ url: string }>(`${apiBase}/cabinet/driver/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    addForm.scan_url = res.url
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
    onError?.()
  }
}

function resetAddForm() {
  addForm.doc_type = 'medical_certificate'
  addForm.series = ''
  addForm.number = ''
  addForm.issued_by = ''
  addForm.issued_at = null
  addForm.expires_at = null
  addForm.scan_url = null
  addForm.license_categories = ''
  addForm.notes = ''
}

async function doAdd() {
  if (!addForm.doc_type) {
    message.error('Выберите тип документа')
    return
  }
  adding.value = true
  try {
    await create({
      doc_type: addForm.doc_type,
      series: addForm.series || null,
      number: addForm.number || null,
      issued_by: addForm.issued_by || null,
      issued_at: addForm.issued_at || null,
      expires_at: addForm.expires_at || null,
      scan_url: addForm.scan_url || null,
      license_categories: addForm.license_categories || null,
      notes: addForm.notes || null,
    })
    message.success('Документ добавлен')
    showAddModal.value = false
    resetAddForm()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    adding.value = false
  }
}

watch(showHistory, () => fetch(showHistory.value))
onMounted(() => fetch(showHistory.value))

defineExpose({ fetch })
</script>

<style scoped>
.documents-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.documents-by-type {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.doc-type-group {
  padding: 12px 0;
  border-bottom: 1px solid var(--n-border-color);
}
.doc-type-group:last-child {
  border-bottom: none;
}
.doc-card--superseded {
  opacity: 0.7;
}
.scan-link {
  margin-top: 8px;
}
.doc-actions {
  margin-top: 8px;
}
</style>
