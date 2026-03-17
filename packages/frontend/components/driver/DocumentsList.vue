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
                    <span>{{ docHeaderText(doc) }}</span>
                    <n-tag :type="statusTagType(doc.status)" size="small">{{ statusLabel(doc.status) }}</n-tag>
                  </n-space>
                </template>
                <n-descriptions :column="2" size="small">
                  <n-descriptions-item v-if="doc.doc_type === 'visa' && doc.country" label="Страна выдачи">{{ doc.country }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'visa' && doc.number" label="Номер визы">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'medical_certificate' && doc.number" label="Номер медсправки">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'tachograph_card' && doc.country" label="Страна выдачи">{{ doc.country }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'tachograph_card' && doc.number" label="Номер карты">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'technical_minimum_cert' && doc.issued_by" label="Учебное заведение">{{ doc.issued_by }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'technical_minimum_cert' && doc.number" label="Номер сертификата">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'drivers_license' && doc.number" label="Номер ВУ">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'drivers_license' && doc.license_categories" label="Категории прав">{{ doc.license_categories }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'adr_certificate' && doc.issued_by" label="Кем выдано">{{ doc.issued_by }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'adr_certificate' && doc.number" label="Номер свидетельства">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'adr_certificate'" label="Разрешённые классы">{{ formatAdrClassesForDoc(doc) }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'passport' && doc.place_of_birth" label="Место рождения">{{ doc.place_of_birth }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'passport' && doc.residential_address" label="Адрес проживания">{{ doc.residential_address }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.issued_at" :label="doc.doc_type === 'visa' ? 'Дата начала' : doc.doc_type === 'technical_minimum_cert' ? 'Дата получения' : doc.doc_type === 'medical_certificate' || doc.doc_type === 'tachograph_card' || doc.doc_type === 'adr_certificate' || doc.doc_type === 'drivers_license' ? 'Дата выдачи' : 'Выдан'">{{ doc.issued_at }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.expires_at" :label="doc.doc_type === 'visa' ? 'Дата окончания' : doc.doc_type === 'medical_certificate' || doc.doc_type === 'tachograph_card' || doc.doc_type === 'technical_minimum_cert' || doc.doc_type === 'adr_certificate' || doc.doc_type === 'drivers_license' ? 'Дата окончания' : 'Действует до'">{{ doc.expires_at }}</n-descriptions-item>
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

        <!-- Медсправка: номер, дата выдачи, дата окончания, скан -->
        <template v-if="isMedicalForm">
          <n-form-item label="Номер медсправки">
            <n-input v-model:value="addForm.number" placeholder="№ 12345" />
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
          <n-form-item label="Дата окончания">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item label="Скан медсправки">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? 'Загружено' : 'Загрузить файл' }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Сертификат техминимума: учебное заведение, номер, дата получения, дата окончания, скан -->
        <template v-else-if="isTechMinForm">
          <n-form-item label="Имя учебного заведения">
            <n-input v-model:value="addForm.issued_by" placeholder="Название учебного центра" />
          </n-form-item>
          <n-form-item label="Номер сертификата">
            <n-input v-model:value="addForm.number" placeholder="№ TM-2025-0098" />
          </n-form-item>
          <n-form-item label="Дата получения">
            <n-date-picker
              :value="addForm.issued_at ? new Date(addForm.issued_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item label="Дата окончания">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item label="Скан документа">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? 'Загружено' : 'Загрузить файл' }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Карта тахографа: номер, страна выдачи, дата выдачи, дата окончания -->
        <template v-else-if="isTachographForm">
          <n-form-item label="Номер карты тахографа">
            <n-input v-model:value="addForm.number" placeholder="№ TK-567890" />
          </n-form-item>
          <n-form-item label="Страна выдачи">
            <n-select v-model:value="addForm.country" :options="visaCountryOptions" placeholder="Выберите страну" filterable />
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
          <n-form-item label="Дата окончания">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item label="Скан документа">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? 'Загружено' : 'Загрузить файл' }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- ADR допуск: кем выдано, номер, классы, даты, скан -->
        <template v-else-if="isAdrForm">
          <n-form-item label="Кем выдано">
            <n-input v-model:value="addForm.issued_by" placeholder="Организация, выдавшая допуск" />
          </n-form-item>
          <n-form-item label="Номер свидетельства">
            <n-input v-model:value="addForm.number" placeholder="№ ADR-2025-001" />
          </n-form-item>
          <n-form-item label="Разрешённые классы">
            <n-checkbox-group v-model:value="addForm.allowed_classes">
              <n-space vertical size="small">
                <n-checkbox v-for="c in adrClasses" :key="c.value" :value="c.value" :label="c.label" />
              </n-space>
            </n-checkbox-group>
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
          <n-form-item label="Дата окончания">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item label="Скан документа">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? 'Загружено' : 'Загрузить файл' }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Водительское удостоверение: номер, категории (чекбоксы), даты, скан -->
        <template v-else-if="isDriversLicenseForm">
          <n-form-item label="Номер ВУ" required>
            <n-input v-model:value="addForm.number" placeholder="tm-123456" />
          </n-form-item>
          <n-form-item label="Категории прав">
            <n-checkbox-group v-model:value="addForm.license_categories_arr">
              <n-space>
                <n-checkbox v-for="c in licenseCategories" :key="c.value" :value="c.value" :label="c.label" />
              </n-space>
            </n-checkbox-group>
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
          <n-form-item label="Дата окончания">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item label="Скан ВУ">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? 'Загружено' : 'Загрузить файл' }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Виза: поля визы -->
        <template v-else-if="isVisaForm">
          <n-form-item label="Страна выдачи" required>
            <n-select v-model:value="addForm.country" :options="visaCountryOptions" placeholder="Выберите страну" filterable />
          </n-form-item>
          <n-form-item label="Номер визы" required>
            <n-input v-model:value="addForm.number" placeholder="1234567" />
          </n-form-item>
          <n-form-item label="Дата начала">
            <n-date-picker
              :value="addForm.issued_at ? new Date(addForm.issued_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item label="Дата окончания">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item label="Скан документа">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? 'Загружено' : 'Загрузить файл' }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Паспорт: серия, номер, кем выдан, место рождения, адрес проживания, даты, скан -->
        <template v-else-if="isPassportForm">
          <n-form-item label="Серия">
            <n-input v-model:value="addForm.series" placeholder="AB" />
          </n-form-item>
          <n-form-item label="Номер">
            <n-input v-model:value="addForm.number" placeholder="1234567" />
          </n-form-item>
          <n-form-item label="Кем выдан">
            <n-input v-model:value="addForm.issued_by" placeholder="ОВД" />
          </n-form-item>
          <n-form-item label="Место рождения">
            <n-input v-model:value="addForm.place_of_birth" placeholder="г. Ашхабад" />
          </n-form-item>
          <n-form-item label="Адрес проживания">
            <n-input v-model:value="addForm.residential_address" placeholder="ул. Махтумкули, д. 10" />
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
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? 'Загружено' : 'Загрузить файл' }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Остальные типы: общие поля -->
        <template v-else>
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
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? 'Загружено' : 'Загрузить файл' }}</n-button>
            </n-upload>
          </n-form-item>
          <n-form-item label="Примечание">
            <n-input v-model:value="addForm.notes" type="textarea" placeholder="Опционально" />
          </n-form-item>
        </template>
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
import { visaCountries, adrClasses, licenseCategories } from '@tmgo/shared'

const { apiBase } = useApiBase()
const { docs, loading, error, fetch, upload, create, remove } = useDriverDocuments()
const message = useMessage()
const showHistory = ref(false)
const showAddModal = ref(false)
const adding = ref(false)

const addForm = reactive({
  doc_type: 'medical_certificate',
  country: null as string | null,
  series: '',
  number: '',
  issued_by: '',
  issued_at: null as string | null,
  expires_at: null as string | null,
  scan_url: null as string | null,
  license_categories: '',
  license_categories_arr: [] as string[],
  allowed_classes: [] as string[],
  place_of_birth: '',
  residential_address: '',
  notes: '',
})

const visaCountryOptions = computed(() =>
  visaCountries.map((c) => ({ label: c, value: c }))
)

const isVisaForm = computed(() => addForm.doc_type === 'visa')
const isMedicalForm = computed(() => addForm.doc_type === 'medical_certificate')
const isTachographForm = computed(() => addForm.doc_type === 'tachograph_card')
const isTechMinForm = computed(() => addForm.doc_type === 'technical_minimum_cert')
const isAdrForm = computed(() => addForm.doc_type === 'adr_certificate')
const isDriversLicenseForm = computed(() => addForm.doc_type === 'drivers_license')
const isPassportForm = computed(() => addForm.doc_type === 'passport')


const docTypeOptions = [
  { label: 'Медицинская справка', value: 'medical_certificate' },
  { label: 'Страховка', value: 'insurance' },
  { label: 'Виза', value: 'visa' },
  { label: 'Паспорт', value: 'passport' },
  { label: 'Водительское удостоверение', value: 'drivers_license' },
  { label: 'Международное ВУ', value: 'international_drivers_license' },
  { label: 'Карта тахографа', value: 'tachograph_card' },
  { label: 'Сертификат техминимума', value: 'technical_minimum_cert' },
  { label: 'ADR допуск', value: 'adr_certificate' },
]

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: 'Паспорт',
  drivers_license: 'Водительское удостоверение',
  medical_certificate: 'Медицинская справка',
  insurance: 'Страховка',
  visa: 'Виза',
  tachograph_card: 'Карта тахографа',
  technical_minimum_cert: 'Сертификат техминимума',
  adr_certificate: 'ADR допуск',
}

const groupedDocs = computed(() => {
  const byType: Record<string, any[]> = {}
  for (const d of docs.value) {
    const t = d.doc_type || 'unknown'
    if (!byType[t]) byType[t] = []
    byType[t].push(d)
  }
  return byType
})

function docTypeLabel(type: string) {
  return DOC_TYPE_LABELS[type] || type
}

const adrClassLabels: Record<string, string> = {
  '1': 'Класс 1', '2': 'Класс 2', '3': 'Класс 3', '4': 'Класс 4', '5': 'Класс 5',
  '6': 'Класс 6', '7': 'Класс 7', '8': 'Класс 8', '9': 'Класс 9',
}

function formatAdrClassesForDoc(doc: any) {
  const arr = Array.isArray(doc.allowed_classes) && doc.allowed_classes.length
    ? doc.allowed_classes
    : (doc.license_categories ? doc.license_categories.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  if (!arr.length) return '—'
  return arr.map((v: string) => adrClassLabels[v] || v).join(', ')
}

function docHeaderText(doc: any) {
  if (doc.doc_type === 'visa') {
    const parts = [doc.country, doc.number].filter(Boolean)
    return parts.length ? parts.join(' — ') : '—'
  }
  if (doc.doc_type === 'medical_certificate') {
    return doc.number ? `№ ${doc.number}` : '—'
  }
  if (doc.doc_type === 'tachograph_card') {
    const parts = [doc.country, doc.number].filter(Boolean)
    return parts.length ? parts.join(' — ') : '—'
  }
  if (doc.doc_type === 'technical_minimum_cert') {
    return doc.number ? `№ ${doc.number}` : doc.issued_by || '—'
  }
  if (doc.doc_type === 'adr_certificate') {
    return doc.number ? `№ ${doc.number}` : doc.issued_by || '—'
  }
  if (doc.doc_type === 'drivers_license') {
    return doc.number ? `ВУ № ${doc.number}` : '—'
  }
  const s = doc.series || doc.number ? `${doc.series || ''} ${doc.number || ''}`.trim() : ''
  return s || '—'
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
  addForm.country = null
  addForm.series = ''
  addForm.number = ''
  addForm.issued_by = ''
  addForm.issued_at = null
  addForm.expires_at = null
  addForm.scan_url = null
  addForm.license_categories = ''
  addForm.license_categories_arr = []
  addForm.allowed_classes = []
  addForm.place_of_birth = ''
  addForm.residential_address = ''
  addForm.notes = ''
}

async function doAdd() {
  if (!addForm.doc_type) {
    message.error('Выберите тип документа')
    return
  }
  if (isVisaForm.value && !addForm.country) {
    message.error('Укажите страну выдачи визы')
    return
  }
  adding.value = true
  try {
    const body: Record<string, unknown> = {
      doc_type: addForm.doc_type,
      country: addForm.country || null,
      series: addForm.series || null,
      number: addForm.number || null,
      issued_by: addForm.issued_by || null,
      issued_at: addForm.issued_at || null,
      expires_at: addForm.expires_at || null,
      scan_url: addForm.scan_url || null,
      place_of_birth: isPassportForm.value ? (addForm.place_of_birth || null) : null,
      residential_address: isPassportForm.value ? (addForm.residential_address || null) : null,
      license_categories: isDriversLicenseForm.value && addForm.license_categories_arr?.length
        ? addForm.license_categories_arr.join(', ')
        : (addForm.license_categories || null),
      notes: addForm.notes || null,
    }
    if (isAdrForm.value && addForm.allowed_classes?.length) {
      body.allowed_classes = addForm.allowed_classes
    }
    await create(body as any)
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
