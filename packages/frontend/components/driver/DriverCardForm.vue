<template>
  <div>
    <n-alert v-if="loadError" type="error" style="margin-bottom: 16px">
      {{ loadError }}
      <n-button size="small" style="margin-top: 8px" @click="loadProfile">Повторить</n-button>
    </n-alert>

    <n-card v-else>
      <n-tabs v-model:value="activeTab" type="line" animated @update:value="onTabChange">
        <n-tab-pane name="main" tab="1. Основная информация">
          <n-form :model="form" label-placement="top" class="form-uniform" style="max-width: 600px; padding-top: 16px;">
            <n-form-item label="Водитель ID">
              <n-input :value="form.id" disabled placeholder="Генерируется системой" />
            </n-form-item>
            <n-form-item label="Фамилия">
              <n-input v-model:value="form.surname" placeholder="Мурадов" />
            </n-form-item>
            <n-form-item label="Имя">
              <n-input v-model:value="form.given_name" placeholder="Азат" />
            </n-form-item>
            <n-form-item label="Отчество">
              <n-input v-model:value="form.patronymic" placeholder="Аманович" />
            </n-form-item>
            <n-form-item label="Дата рождения">
              <n-date-picker
                :value="form.date_of_birth ? new Date(form.date_of_birth).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.date_of_birth = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item label="Гражданство">
              <div class="multi-field">
                <div v-for="(item, i) in form.citizenships" :key="'c-' + i" class="multi-field-row">
                  <n-select
                    v-model:value="form.citizenships[i]"
                    :options="citizenshipOptions"
                    filterable
                    tag
                    placeholder="Выберите или введите"
                    clearable
                    style="flex: 1; margin-bottom: 8px"
                  />
                  <n-popconfirm
                    v-if="i > 0"
                    positive-text="Удалить"
                    negative-text="Отмена"
                    @positive-click="form.citizenships.splice(i, 1)"
                  >
                    <template #trigger>
                      <n-button quaternary size="small" type="error" class="remove-btn">×</n-button>
                    </template>
                    Вы действительно хотите удалить это поле?
                  </n-popconfirm>
                </div>
                <n-button quaternary size="small" type="primary" @click="addCitizenship">+ Добавить</n-button>
              </div>
            </n-form-item>
            <n-form-item label="Пол">
              <n-select
                v-model:value="form.gender"
                :options="genderOptions"
                placeholder="Выберите"
                clearable
              />
            </n-form-item>
            <n-form-item label="Контактный телефон">
              <div class="multi-field">
                <div v-for="(item, i) in form.phones" :key="'p-' + i" class="multi-field-row">
                  <n-input
                    v-model:value="form.phones[i]"
                    placeholder="+993 65 12 34 56"
                    style="flex: 1; margin-bottom: 8px"
                  />
                  <n-popconfirm
                    v-if="i > 0"
                    positive-text="Удалить"
                    negative-text="Отмена"
                    @positive-click="form.phones.splice(i, 1)"
                  >
                    <template #trigger>
                      <n-button quaternary size="small" type="error" class="remove-btn">×</n-button>
                    </template>
                    Вы действительно хотите удалить это поле?
                  </n-popconfirm>
                </div>
                <n-button quaternary size="small" type="primary" @click="addPhone">+ Добавить</n-button>
              </div>
            </n-form-item>
            <n-form-item label="Email">
              <div class="multi-field">
                <div class="multi-field-row">
                  <n-input :value="form.email" disabled placeholder="Из учётной записи" style="flex: 1; margin-bottom: 8px" />
                </div>
                <div v-for="(item, i) in form.extra_emails" :key="'e-' + i" class="multi-field-row">
                  <n-input
                    v-model:value="form.extra_emails[i]"
                    placeholder="Доп. email"
                    style="flex: 1; margin-bottom: 8px"
                  />
                  <n-popconfirm
                    positive-text="Удалить"
                    negative-text="Отмена"
                    @positive-click="form.extra_emails.splice(i, 1)"
                  >
                    <template #trigger>
                      <n-button quaternary size="small" type="error" class="remove-btn">×</n-button>
                    </template>
                    Вы действительно хотите удалить это поле?
                  </n-popconfirm>
                </div>
                <n-button quaternary size="small" type="primary" @click="addEmail">+ Добавить</n-button>
              </div>
            </n-form-item>
            <n-form-item label="Статус">
              <n-select
                v-model:value="form.status"
                :options="statusOptions"
                placeholder="Выберите"
                clearable
              />
            </n-form-item>
            <n-form-item label="Категория занятости">
              <n-select
                v-model:value="form.employment_category"
                :options="employmentOptions"
                placeholder="Выберите"
                clearable
              />
            </n-form-item>
            <n-button type="primary" :loading="saving" @click="handleSave">Сохранить</n-button>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="passport" tab="2. Паспортные данные">
          <n-form :model="form" label-placement="top" class="form-uniform" style="max-width: 600px; padding-top: 16px;">
            <div class="passport-row">
              <n-form-item label="Серия паспорта" class="passport-series">
                <n-input v-model:value="form.passport_series" placeholder="AB" maxlength="6" />
              </n-form-item>
              <n-form-item label="Номер паспорта" class="passport-number">
                <n-input v-model:value="form.passport_number" placeholder="1234567" />
              </n-form-item>
            </div>
            <n-form-item label="Дата выдачи">
              <n-date-picker
                :value="form.passport_issue_date ? new Date(form.passport_issue_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.passport_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item label="Дата окончания">
              <n-date-picker
                :value="form.passport_expiry_date ? new Date(form.passport_expiry_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.passport_expiry_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item label="Кем выдан">
              <n-input v-model:value="form.passport_issued_by" placeholder="МВД Туркменистана" />
            </n-form-item>
            <n-form-item label="Место рождения">
              <n-input v-model:value="form.place_of_birth" placeholder="Ашхабад" />
            </n-form-item>
            <n-form-item label="Адрес проживания">
              <n-input v-model:value="form.residential_address" type="textarea" placeholder="Ашхабад, ул. Гарашсызлык, д. 45" :rows="2" />
            </n-form-item>
            <n-form-item label="Скан паспорта (PDF/JPG)">
              <n-upload
                :default-file-list="passportFileList"
                :max="1"
                accept=".pdf,.jpg,.jpeg,.png"
                :custom-request="handlePassportUpload"
              >
                <n-button>Загрузить PDF или JPG</n-button>
              </n-upload>
              <n-text v-if="form.passport_scan_url" depth="3" style="font-size: 12px; margin-top: 4px; display: block;">
                Файл загружен. Сохраните форму, чтобы закрепить.
              </n-text>
            </n-form-item>
            <n-button type="primary" :loading="saving" @click="handleSave">Сохранить</n-button>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="license" tab="3. Водительское удостоверение">
          <n-form :model="form" label-placement="top" class="form-uniform" style="max-width: 600px; padding-top: 16px;">
            <n-form-item label="Номер водительского удостоверения">
              <n-input v-model:value="form.license_number" placeholder="TM-123456" />
            </n-form-item>
            <n-form-item label="Категории прав">
              <n-input v-model:value="form.license_categories" placeholder="B / C / D / E" />
            </n-form-item>
            <n-form-item label="Дата выдачи">
              <n-date-picker
                :value="form.license_issue_date ? new Date(form.license_issue_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.license_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item label="Дата окончания">
              <n-date-picker
                :value="form.license_expiry ? new Date(form.license_expiry).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.license_expiry = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item label="Кем выдано">
              <n-input v-model:value="form.license_issued_by" placeholder="МВД Туркменистана" />
            </n-form-item>
            <n-form-item label="Скан водительских прав (PDF/JPG)">
              <n-upload
                :default-file-list="licenseFileList"
                :max="1"
                accept=".pdf,.jpg,.jpeg,.png"
                :custom-request="handleLicenseUpload"
              >
                <n-button>Загрузить PDF или JPG</n-button>
              </n-upload>
              <n-text v-if="form.license_scan_url" depth="3" style="font-size: 12px; margin-top: 4px; display: block;">
                Файл загружен. Сохраните форму.
              </n-text>
            </n-form-item>
            <n-form-item label="Наличие международных прав">
              <n-select
                v-model:value="form.has_international_license"
                :options="yesNoOptions"
                placeholder="Да / Нет"
                clearable
              />
            </n-form-item>
            <n-form-item label="Номер международного удостоверения">
              <n-input v-model:value="form.international_license_number" placeholder="INT-789456" />
            </n-form-item>
            <n-form-item label="Срок действия международного удостоверения">
              <n-input v-model:value="form.international_license_validity" placeholder="2022-2027" />
            </n-form-item>
            <n-form-item label="Дата последнего медосмотра">
              <n-date-picker
                :value="form.last_medical_examination_date ? new Date(form.last_medical_examination_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.last_medical_examination_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item label="Источник найма">
              <n-select
                v-model:value="form.hire_source"
                :options="hireSourceOptions"
                placeholder="Выберите"
                clearable
              />
            </n-form-item>
            <n-form-item label="Прикреплённые документы">
              <n-input v-model:value="form.attached_documents" type="textarea" placeholder="Паспорт, права, медсправка, страховка, лицензии" :rows="2" />
            </n-form-item>
            <n-form-item label="Дата последнего обновления">
              <n-input :value="form.updated_at" disabled placeholder="Автоматически системой" />
            </n-form-item>
            <n-button type="primary" :loading="saving" @click="handleSave">Сохранить</n-button>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="permits" tab="4. Разрешительные документы">
          <n-form :model="form" label-placement="top" class="form-uniform" style="max-width: 600px; padding-top: 16px;">
            <n-form-item label="Разрешение на въезд в зону / страну">
              <n-input v-model:value="form.permission_entry_zone" type="textarea" placeholder="Например: Разрешение на въезд в РФ, Казахстан" :rows="2" />
            </n-form-item>
            <n-form-item label="Дата выдачи разрешения">
              <n-date-picker
                :value="form.permission_issue_date ? new Date(form.permission_issue_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.permission_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item label="Срок действия">
              <n-date-picker
                :value="form.permission_validity_date ? new Date(form.permission_validity_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.permission_validity_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item label="Медицинская справка">
              <n-input v-model:value="form.medical_certificate" placeholder="Nº MC-2025-0123, действует до 01.06.2026" />
            </n-form-item>
            <n-form-item label="Скан мед. справки (PDF/JPG)">
              <n-upload
                :default-file-list="medicalFileList"
                :max="1"
                accept=".pdf,.jpg,.jpeg,.png"
                :custom-request="handleMedicalUpload"
              >
                <n-button>Загрузить PDF или JPG</n-button>
              </n-upload>
              <n-text v-if="form.medical_certificate_scan_url" depth="3" style="font-size: 12px; margin-top: 4px; display: block;">
                Файл загружен. Сохраните форму.
              </n-text>
            </n-form-item>
            <n-form-item label="Сертификат прохождения техминимума">
              <n-input v-model:value="form.technical_minimum_certificate" placeholder="Nº TM-2025-0098" />
            </n-form-item>
            <n-form-item label="Карта тахографа / водительская карта">
              <n-input v-model:value="form.tachograph_card_number" placeholder="Nº TK-567890" />
            </n-form-item>
            <n-form-item label="Прочие разрешения / документы">
              <n-input v-model:value="form.other_permits" type="textarea" placeholder="Страховка, пропуск, допуск ADR и т. д." :rows="2" />
            </n-form-item>
            <n-button type="primary" :loading="saving" @click="handleSave">Сохранить</n-button>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="docs" tab="5. Документы и банк">
          <n-form :model="form" label-placement="top" class="form-uniform" style="max-width: 600px; padding-top: 16px;">
            <n-form-item label="Название компании">
              <n-input v-model:value="form.company_name" placeholder="ООО «Транспорт»" />
            </n-form-item>
            <n-form-item label="ИНН">
              <n-input v-model:value="form.inn" placeholder="ИНН организации или ИП" />
            </n-form-item>
            <n-form-item label="Юридический адрес">
              <n-input v-model:value="form.address" type="textarea" placeholder="Юридический адрес" :rows="2" />
            </n-form-item>
            <n-form-item label="Банк">
              <n-input v-model:value="form.bank_name" placeholder="Название банка" />
            </n-form-item>
            <n-form-item label="Расчётный счёт">
              <n-input v-model:value="form.bank_account" placeholder="Номер счёта" />
            </n-form-item>
            <n-form-item label="БИК банка">
              <n-input v-model:value="form.bank_bik" placeholder="БИК" />
            </n-form-item>
            <n-button type="primary" :loading="saving" @click="handleSave">Сохранить</n-button>
          </n-form>
        </n-tab-pane>

      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { citizenships } from '@tmgo/shared'

const props = withDefaults(
  defineProps<{
    loadUrl: string
    saveUrl: string
    saveMethod: 'PATCH'
    apiBase: string
    activeTab?: string
    // TODO: вернуть adminEditedFields — метки «отредактировано» для полей, изменённых админом
    /** Когда передан — форма заполняется из него без fetch (для админки) */
    initialProfile?: Record<string, any> | null
  }>(),
  { activeTab: 'main' }
)

const emit = defineEmits<{ saved: []; 'update:activeTab': [value: string] }>()

const citizenshipOptions = computed(() =>
  citizenships.map((c) => ({ label: c, value: c }))
)

const message = useMessage()
const saving = ref(false)
const loadError = ref<string | null>(null)
const activeTab = ref(props.activeTab)
watch(() => props.activeTab, (v) => {
  if (v && tabNames.includes(v as any)) activeTab.value = v
})

const tabNames = ['main', 'passport', 'license', 'permits', 'docs'] as const

const uploadBaseUrl = computed(() => props.loadUrl.replace(/\/$/, ''))

const genderOptions = [
  { label: 'Мужской', value: 'male' },
  { label: 'Женский', value: 'female' },
]

const statusOptions = [
  { label: 'Активен', value: 'active' },
  { label: 'Неактивен', value: 'inactive' },
  { label: 'В отпуске', value: 'on_leave' },
  { label: 'Уволен', value: 'fired' },
]

const employmentOptions = [
  { label: 'Штатный', value: 'full_time' },
  { label: 'Внештатный', value: 'freelance' },
  { label: 'Арендованный транспорт', value: 'leased' },
]

const yesNoOptions = [
  { label: 'Да', value: true },
  { label: 'Нет', value: false },
]

const hireSourceOptions = [
  { label: 'По рекомендации', value: 'recommendation' },
  { label: 'Объявление', value: 'advertisement' },
  { label: 'Агентство', value: 'agency' },
]

const passportFileList = computed(() =>
  form.passport_scan_url
    ? [{ id: '1', name: 'Скан паспорта', status: 'done' as const, url: `${props.apiBase}${form.passport_scan_url}` }]
    : [],
)

async function handlePassportUpload({ file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void }) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-passport`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    form.passport_scan_url = res.url
    message.success('Файл загружен. Нажмите «Сохранить».')
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
    onError(e)
  }
}

const licenseFileList = computed(() =>
  form.license_scan_url
    ? [{ id: '1', name: 'Скан прав', status: 'done' as const, url: `${props.apiBase}${form.license_scan_url}` }]
    : [],
)

async function handleLicenseUpload({ file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void }) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-license`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    form.license_scan_url = res.url
    message.success('Файл загружен. Нажмите «Сохранить».')
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
    onError(e)
  }
}

const medicalFileList = computed(() =>
  form.medical_certificate_scan_url
    ? [{ id: '1', name: 'Скан мед. справки', status: 'done' as const, url: `${props.apiBase}${form.medical_certificate_scan_url}` }]
    : [],
)

async function handleMedicalUpload({ file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void }) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-medical`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    form.medical_certificate_scan_url = res.url
    message.success('Файл загружен. Нажмите «Сохранить».')
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
    onError(e)
  }
}

const form = reactive({
  id: '' as string,
  surname: '' as string,
  given_name: '' as string,
  patronymic: '' as string,
  date_of_birth: null as string | null,
  citizenships: [''] as string[],
  gender: null as string | null,
  phones: [''] as string[],
  email: '' as string,
  extra_emails: [] as string[],
  status: null as string | null,
  employment_category: null as string | null,
  company_name: '' as string,
  license_number: '' as string,
  license_expiry: null as string | null,
  license_categories: '' as string,
  license_issue_date: null as string | null,
  license_issued_by: '' as string,
  license_scan_url: '' as string,
  has_international_license: null as boolean | null,
  international_license_number: '' as string,
  international_license_validity: '' as string,
  last_medical_examination_date: null as string | null,
  hire_source: null as string | null,
  attached_documents: '' as string,
  updated_at: '' as string,
  permission_entry_zone: '' as string,
  permission_issue_date: null as string | null,
  permission_validity_date: null as string | null,
  medical_certificate: '' as string,
  medical_certificate_scan_url: '' as string,
  technical_minimum_certificate: '' as string,
  tachograph_card_number: '' as string,
  other_permits: '' as string,
  inn: '' as string,
  address: '' as string,
  passport_series: '' as string,
  passport_number: '' as string,
  passport_issue_date: null as string | null,
  passport_expiry_date: null as string | null,
  passport_issued_by: '' as string,
  place_of_birth: '' as string,
  residential_address: '' as string,
  passport_scan_url: '' as string,
  bank_name: '' as string,
  bank_account: '' as string,
  bank_bik: '' as string,
})

function applyProfileData(data: Record<string, any>) {
  if (!data) return
  form.id = data.id ?? ''
  form.surname = data.surname ?? ''
  form.given_name = data.given_name ?? ''
  form.patronymic = data.patronymic ?? ''
  form.date_of_birth = data.date_of_birth ?? null
  const c = (data.citizenship ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
  form.citizenships = c.length ? c : ['']
  form.gender = data.gender ?? null
  const p = (data.phone ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
  form.phones = p.length ? p : ['']
  form.email = data.email ?? ''
  const e = (data.additional_emails ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
  form.extra_emails = e
  form.status = data.status ?? null
  form.employment_category = data.employment_category ?? null
  form.company_name = data.company_name ?? ''
  form.license_number = data.license_number ?? ''
  form.license_expiry = data.license_expiry ?? null
  form.license_categories = data.license_categories ?? ''
  form.license_issue_date = data.license_issue_date ?? null
  form.license_issued_by = data.license_issued_by ?? ''
  form.license_scan_url = data.license_scan_url ?? ''
  form.has_international_license = data.has_international_license ?? null
  form.international_license_number = data.international_license_number ?? ''
  form.international_license_validity = data.international_license_validity ?? ''
  form.last_medical_examination_date = data.last_medical_examination_date ?? null
  form.hire_source = data.hire_source ?? null
  form.attached_documents = data.attached_documents ?? ''
  form.updated_at = data.updated_at ?? ''
  form.permission_entry_zone = data.permission_entry_zone ?? ''
  form.permission_issue_date = data.permission_issue_date ?? null
  form.permission_validity_date = data.permission_validity_date ?? null
  form.medical_certificate = data.medical_certificate ?? ''
  form.medical_certificate_scan_url = data.medical_certificate_scan_url ?? ''
  form.technical_minimum_certificate = data.technical_minimum_certificate ?? ''
  form.tachograph_card_number = data.tachograph_card_number ?? ''
  form.other_permits = data.other_permits ?? ''
  form.inn = data.inn ?? ''
  form.address = data.address ?? ''
  let ps = data.passport_series ?? ''
  let pn = data.passport_number ?? ''
  if (!pn && ps.includes(' ')) {
    const [a, b] = ps.split(/\s+/, 2)
    if (a && b) {
      ps = a.trim()
      pn = b.replace(/\D/g, '')
    }
  }
  form.passport_series = ps
  form.passport_number = pn
  form.passport_issue_date = data.passport_issue_date ?? null
  form.passport_expiry_date = data.passport_expiry_date ?? null
  form.passport_issued_by = data.passport_issued_by ?? ''
  form.place_of_birth = data.place_of_birth ?? ''
  form.residential_address = data.residential_address ?? ''
  form.passport_scan_url = data.passport_scan_url ?? ''
  form.bank_name = data.bank_name ?? ''
  form.bank_account = data.bank_account ?? ''
  form.bank_bik = data.bank_bik ?? ''
  if (props.adminEditedFields && Array.isArray(data.admin_edited_fields)) {
    props.adminEditedFields.value = data.admin_edited_fields
  }
}

watch(
  () => props.initialProfile,
  (data) => {
    if (data && Object.keys(data).length) {
      applyProfileData(data)
    }
  },
  { immediate: true }
)

async function loadProfile() {
  if (props.initialProfile && Object.keys(props.initialProfile).length) {
    applyProfileData(props.initialProfile)
    return
  }
  loadError.value = null
  try {
    const data = await $fetch<any>(props.loadUrl, { credentials: 'include' })
    applyProfileData(data)
  } catch (e: any) {
    loadError.value = e?.data?.error || 'Ошибка загрузки карточки'
  }
}

async function handleSave() {
  saving.value = true
  try {
    await $fetch(props.saveUrl, {
      method: props.saveMethod,
      credentials: 'include',
      body: {
        surname: form.surname || null,
        given_name: form.given_name || null,
        patronymic: form.patronymic || null,
        date_of_birth: form.date_of_birth || null,
        citizenship: form.citizenships.filter(Boolean).join(', ') || null,
        gender: form.gender || null,
        status: form.status || null,
        employment_category: form.employment_category || null,
        company_name: form.company_name || null,
        license_number: form.license_number || null,
        license_expiry: form.license_expiry || null,
        license_categories: form.license_categories || null,
        license_issue_date: form.license_issue_date || null,
        license_issued_by: form.license_issued_by || null,
        license_scan_url: form.license_scan_url || null,
        has_international_license: form.has_international_license ?? null,
        international_license_number: form.international_license_number || null,
        international_license_validity: form.international_license_validity || null,
        last_medical_examination_date: form.last_medical_examination_date || null,
        hire_source: form.hire_source || null,
        attached_documents: form.attached_documents || null,
        permission_entry_zone: form.permission_entry_zone || null,
        permission_issue_date: form.permission_issue_date || null,
        permission_validity_date: form.permission_validity_date || null,
        medical_certificate: form.medical_certificate || null,
        medical_certificate_scan_url: form.medical_certificate_scan_url || null,
        technical_minimum_certificate: form.technical_minimum_certificate || null,
        tachograph_card_number: form.tachograph_card_number || null,
        other_permits: form.other_permits || null,
        phone: form.phones.filter(Boolean).join(', ') || null,
        additional_emails: form.extra_emails.filter(Boolean).join(', ') || null,
        inn: form.inn || null,
        address: form.address || null,
        passport_series: form.passport_series || null,
        passport_number: form.passport_number || null,
        passport_issue_date: form.passport_issue_date || null,
        passport_expiry_date: form.passport_expiry_date || null,
        passport_issued_by: form.passport_issued_by || null,
        place_of_birth: form.place_of_birth || null,
        residential_address: form.residential_address || null,
        passport_scan_url: form.passport_scan_url || null,
        bank_name: form.bank_name || null,
        bank_account: form.bank_account || null,
        bank_bik: form.bank_bik || null,
      },
    })
    message.success('Карточка сохранена')
    emit('saved')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка сохранения')
  } finally {
    saving.value = false
  }
}

function addCitizenship() {
  form.citizenships.push('')
}
function addPhone() {
  form.phones.push('')
}
function addEmail() {
  form.extra_emails.push('')
}

function onTabChange(name: string) {
  emit('update:activeTab', name)
}

defineExpose({
  loadProfile,
  handleSave,
})
</script>

<style scoped>
.form-uniform :deep(.n-form-item .n-input),
.form-uniform :deep(.n-form-item .n-select),
.form-uniform :deep(.n-form-item .n-date-picker) {
  width: 100%;
}
.form-uniform .multi-field {
  width: 100%;
}
.multi-field-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.multi-field-row .remove-btn {
  flex-shrink: 0;
  min-width: 32px;
}
.multi-field-row .n-input,
.multi-field-row .n-select {
  min-width: 0;
  flex: 1;
}

.passport-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}
.passport-row .passport-series,
.passport-row .passport-number {
  margin-bottom: 0;
}
@media (max-width: 480px) {
  .passport-row {
    grid-template-columns: 1fr;
  }
}
</style>
