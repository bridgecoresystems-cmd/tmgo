<template>
  <div class="admin-driver-card-form">
    <n-alert v-if="loadError" type="error" class="mb-16">
      {{ loadError }}
      <n-button size="small" style="margin-top: 8px" @click="loadProfile">Повторить</n-button>
    </n-alert>

    <n-spin v-else :show="loading">
      <div v-if="!loading" style="min-height: 400px; padding: 20px;">
        <n-form
          v-if="!loadError"
          ref="formRef"
          :model="form"
          label-placement="left"
          label-width="240"
          label-align="left"
          class="v2-form"
        >
          <!-- 1. Основная информация -->
          <n-h3 prefix="bar" align-text>1. Основная информация</n-h3>
          <n-card embedded :bordered="false" class="mb-24">
            <n-space vertical size="large">
              <n-form-item label="Водитель ID">
                <n-text depth="3">{{ form.id || 'Генерируется системой' }}</n-text>
              </n-form-item>

              <n-form-item label="Фамилия" required path="surname">
                <n-input v-model:value="form.surname" placeholder="Akmuradow" />
              </n-form-item>

              <n-form-item label="Имя" required path="given_name">
                <n-input v-model:value="form.given_name" placeholder="Batyr" />
              </n-form-item>

              <n-form-item label="Отчество" path="patronymic">
                <n-input v-model:value="form.patronymic" placeholder="Muhamednazarowich" />
              </n-form-item>

              <n-form-item label="Дата рождения" required path="date_of_birth">
                <n-date-picker
                  :value="form.date_of_birth ? new Date(form.date_of_birth).getTime() : null"
                  type="date"
                  clearable
                  @update:value="(v) => { form.date_of_birth = v ? new Date(v).toISOString().slice(0, 10) : null }"
                />
              </n-form-item>

              <n-form-item label="Гражданство" required>
                <n-space vertical style="width: 100%">
                  <n-space v-for="(c, i) in form.citizenships" :key="i" align="center">
                    <n-select
                      v-model:value="form.citizenships[i]"
                      :options="citizenshipOptions"
                      filterable
                      tag
                      style="width: 200px"
                    />
                    <n-button v-if="i > 0" quaternary circle type="error" @click="form.citizenships.splice(i, 1)">×</n-button>
                  </n-space>
                  <n-button quaternary size="small" type="primary" @click="form.citizenships.push('')">+ Добавить</n-button>
                </n-space>
              </n-form-item>

              <n-form-item label="Пол" required path="gender">
                <n-radio-group v-model:value="form.gender">
                  <n-space>
                    <n-radio value="male">Мужской</n-radio>
                    <n-radio value="female">Женский</n-radio>
                  </n-space>
                </n-radio-group>
              </n-form-item>

              <n-form-item label="Контактный телефон" required>
                <n-space vertical style="width: 100%">
                  <n-space v-for="(p, i) in form.phones" :key="i" align="center">
                    <n-input v-model:value="form.phones[i]" placeholder="+99364852563" style="width: 200px" />
                    <n-button v-if="i > 0" quaternary circle type="error" @click="form.phones.splice(i, 1)">×</n-button>
                  </n-space>
                  <n-button quaternary size="small" type="primary" @click="form.phones.push('')">+ Добавить</n-button>
                </n-space>
              </n-form-item>

              <n-form-item label="Email (Логин)" required>
                <n-space vertical style="width: 100%">
                  <n-input :value="form.email" disabled style="width: 300px" />
                  <n-space v-for="(e, i) in form.extra_emails" :key="i" align="center">
                    <n-input v-model:value="form.extra_emails[i]" placeholder="extra@mail.com" style="width: 200px" />
                    <n-button quaternary circle type="error" @click="form.extra_emails.splice(i, 1)">×</n-button>
                  </n-space>
                  <n-button quaternary size="small" type="primary" @click="form.extra_emails.push('')">+ Добавить</n-button>
                </n-space>
              </n-form-item>

              <n-form-item label="Статус (Диспетчер)">
                <n-select v-model:value="form.status" :options="statusOptions" style="width: 200px" />
              </n-form-item>

              <n-form-item label="Категория занятости">
                <n-select v-model:value="form.employment_category" :options="employmentOptions" style="width: 200px" />

              </n-form-item>

              <n-form-item label="Компания">
                <n-input v-model:value="form.company_name" placeholder="ООО Транспорт" />
              </n-form-item>

              <n-form-item label="ИНН">
                <n-input v-model:value="form.inn" placeholder="123456789" />
              </n-form-item>

              <n-form-item label="Адрес">
                <n-input v-model:value="form.address" type="textarea" placeholder="г. Ашхабад, ул. Махтумкули, д. 10" />
              </n-form-item>
            </n-space>
          </n-card>

          <!-- 2. Паспортные данные (единый список как гражданство/телефоны) -->
          <n-h3 prefix="bar" align-text>2. Паспортные данные</n-h3>
          <n-card embedded :bordered="false" class="mb-24">
            <n-space vertical size="large">
              <template v-for="(p, pi) in passportsList" :key="p._key">
                <n-divider v-if="pi > 0" style="margin: 24px 0 16px;">Паспорт {{ pi + 1 }}</n-divider>
                <n-form-item :label="`Серия / Номер паспорта${pi > 0 ? ` (${pi + 1})` : ''}`" :required="pi === 0">
                  <n-space align="center">
                    <n-input v-model:value="p.series" placeholder="AB" style="width: 80px" />
                    <n-input v-model:value="p.number" placeholder="123456" style="width: 160px" />
                    <n-button v-if="pi > 0" quaternary circle type="error" @click="removePassport(pi)">×</n-button>
                  </n-space>
                </n-form-item>
                <n-form-item label="Даты действия" :required="pi === 0">
                  <n-space align="center">
                    <n-date-picker
                      :value="p.issued_at ? new Date(p.issued_at).getTime() : null"
                      type="date"
                      placeholder="Дата выдачи"
                      @update:value="(v) => { p.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
                    />
                    <n-text depth="3">—</n-text>
                    <n-date-picker
                      :value="p.expires_at ? new Date(p.expires_at).getTime() : null"
                      type="date"
                      placeholder="Дата окончания"
                      @update:value="(v) => { p.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
                    />
                  </n-space>
                </n-form-item>
                <n-form-item label="Кем выдан" :required="pi === 0">
                  <n-input v-model:value="p.issued_by" placeholder="ОВД г. Ашхабад" />
                </n-form-item>
                <n-form-item label="Место рождения" :required="pi === 0">
                  <n-input v-model:value="p.place_of_birth" placeholder="г. Мары" />
                </n-form-item>
                <n-form-item label="Адрес проживания" :required="pi === 0">
                  <n-input v-model:value="p.residential_address" placeholder="ул. Махтумкули, д. 10" />
                </n-form-item>
                <n-form-item label="Скан паспорта (PDF/JPG)" :required="pi === 0">
                  <n-space align="center">
                    <n-upload :max="1" :custom-request="(o) => handlePassportScanUpload(o, p)" :show-file-list="false">
                      <n-button size="small">{{ p.scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                    </n-upload>
                    <n-button v-if="p.scan_url" text type="primary" size="small" @click="openScan(p.scan_url)">
                      Просмотр скана
                    </n-button>
                  </n-space>
                </n-form-item>
              </template>
              <n-button quaternary type="primary" size="small" @click="addPassport">+ Добавить паспорт</n-button>
            </n-space>
          </n-card>

          <!-- 3. Водительское удостоверение (единый список) -->
          <n-h3 prefix="bar" align-text>3. Водительское удостоверение</n-h3>
          <n-card embedded :bordered="false" class="mb-24">
            <n-space vertical size="large">
              <template v-for="(lic, li) in licensesList" :key="lic._key">
                <n-divider v-if="li > 0" style="margin: 24px 0 16px;">ВУ {{ li + 1 }}</n-divider>
                <n-form-item :label="`Номер ВУ${li > 0 ? ` (${li + 1})` : ''}`" :required="li === 0">
                  <n-space align="center">
                    <n-input v-model:value="lic.number" placeholder="tm-123456" style="width: 240px" />
                    <n-button v-if="li > 0" quaternary circle type="error" @click="removeLicense(li)">×</n-button>
                  </n-space>
                </n-form-item>
                <n-form-item label="Категории прав" :required="li === 0">
                  <n-input v-model:value="lic.license_categories" placeholder="B, C, D, E" style="width: 200px" />
                </n-form-item>
                <n-form-item label="Даты действия ВУ" :required="li === 0">
                  <n-space align="center">
                    <n-date-picker
                      :value="lic.issued_at ? new Date(lic.issued_at).getTime() : null"
                      type="date"
                      placeholder="Дата выдачи"
                      @update:value="(v) => { lic.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
                    />
                    <n-text depth="3">—</n-text>
                    <n-date-picker
                      :value="lic.expires_at ? new Date(lic.expires_at).getTime() : null"
                      type="date"
                      placeholder="Дата окончания"
                      @update:value="(v) => { lic.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
                    />
                  </n-space>
                </n-form-item>
                <n-form-item label="Кем выдано">
                  <n-input v-model:value="lic.issued_by" placeholder="МВД Туркменистана" />
                </n-form-item>
                <n-form-item label="Скан ВУ (PDF/JPG)" :required="li === 0">
                  <n-space align="center">
                    <n-upload :max="1" :custom-request="(o) => handleLicenseScanUpload(o, lic)" :show-file-list="false">
                      <n-button size="small">{{ lic.scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                    </n-upload>
                    <n-button v-if="lic.scan_url" text type="primary" size="small" @click="openScan(lic.scan_url)">
                      Просмотр скана
                    </n-button>
                  </n-space>
                </n-form-item>
              </template>
              <n-button quaternary type="primary" size="small" @click="addLicense">+ Добавить ВУ</n-button>

              <n-form-item label="Международные права" class="mt-16">
                <n-space vertical style="width: 100%">
                  <n-radio-group v-model:value="form.has_international_license">
                    <n-space>
                      <n-radio :value="true">Да</n-radio>
                      <n-radio :value="false">Нет</n-radio>
                    </n-space>
                  </n-radio-group>
                  <template v-if="form.has_international_license">
                    <n-space vertical size="small" class="mt-8">
                      <n-form-item label="Номер МВУ" label-placement="left" label-width="120">
                        <n-input v-model:value="form.international_license_number" placeholder="INT-789456" />
                      </n-form-item>
                      <n-form-item label="Срок действия" label-placement="left" label-width="120">
                        <n-input v-model:value="form.international_license_validity" placeholder="2022-2027" />
                      </n-form-item>
                    </n-space>
                  </template>
                </n-space>
              </n-form-item>
            </n-space>
          </n-card>

          <!-- 4. Разрешительные документы -->
          <n-h3 prefix="bar" align-text>4. Разрешительные документы</n-h3>
          <n-card embedded :bordered="false" class="mb-24">
            <n-space vertical size="large">
              <n-form-item label="Разрешение на въезд (Виза)">
                <n-space vertical style="width: 100%">
                  <n-input v-model:value="form.permission_entry_zone" placeholder="Номер визы / зона" />
                  <n-space align="center">
                    <n-date-picker
                      :value="form.permission_issue_date ? new Date(form.permission_issue_date).getTime() : null"
                      type="date"
                      placeholder="Дата выдачи"
                      @update:value="(v) => { form.permission_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                    />
                    <n-text depth="3">—</n-text>
                    <n-date-picker
                      :value="form.permission_validity_date ? new Date(form.permission_validity_date).getTime() : null"
                      type="date"
                      placeholder="Дата окончания"
                      @update:value="(v) => { form.permission_validity_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                    />
                  </n-space>
                </n-space>
              </n-form-item>

              <n-form-item label="Медицинская справка">
                <n-space vertical style="width: 100%">
                  <n-input v-model:value="form.medical_certificate" placeholder="Номер справки" />
                  <n-date-picker
                    :value="form.last_medical_examination_date ? new Date(form.last_medical_examination_date).getTime() : null"
                    type="date"
                    placeholder="Действует до (или дата осмотра)"
                    @update:value="(v) => { form.last_medical_examination_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                  />
                  <n-space vertical>
                    <n-upload :max="1" :custom-request="(o) => handleMedicalUpload(o)" :show-file-list="false">
                      <n-button size="small">{{ form.medical_certificate_scan_url ? 'Заменить файл' : 'Загрузить скан справки' }}</n-button>
                    </n-upload>
                    <n-button v-if="form.medical_certificate_scan_url" text type="primary" size="small" @click="openScan(form.medical_certificate_scan_url)">
                      Просмотр скана
                    </n-button>
                  </n-space>
                </n-space>
              </n-form-item>

              <n-form-item label="Техминимум">
                <n-input v-model:value="form.technical_minimum_certificate" placeholder="№ TM-2025-0098" />
              </n-form-item>

              <n-form-item label="Карта тахографа">
                <n-input v-model:value="form.tachograph_card_number" placeholder="№ TK-567890" />
              </n-form-item>

              <n-form-item label="Прочие документы">
                <n-input v-model:value="form.other_permits" type="textarea" placeholder="Страховка, пропуск, допуск ADR и т. д." />
              </n-form-item>

              <n-form-item label="Источник найма">
                <n-select v-model:value="form.hire_source" :options="hireSourceOptions" style="width: 240px" />
              </n-form-item>

              <n-form-item label="Банковские реквизиты">
                <n-space vertical style="width: 100%">
                  <n-input v-model:value="form.bank_name" placeholder="Банк" />
                  <n-input v-model:value="form.bank_account" placeholder="Расчётный счёт" />
                  <n-input v-model:value="form.bank_bik" placeholder="БИК" />
                </n-space>
              </n-form-item>

              <n-form-item label="Дата последнего обновления">
                <n-text depth="3">{{ form.updated_at || 'Автоматически системой' }}</n-text>
              </n-form-item>
            </n-space>
          </n-card>

          <!-- Actions -->
          <div class="form-actions mt-24">
            <n-space justify="end">
              <n-button type="primary" :loading="saving" @click="handleSave">Сохранить</n-button>
            </n-space>
          </div>
        </n-form>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import {
  NForm, NFormItem, NInput, NCard, NSpace, NButton, NSelect, NDatePicker,
  NUpload, NTag, NText, NRadioGroup, NRadio, NCheckboxGroup, NCheckbox,
  NSpin, NH3, NDivider, NSwitch, useMessage
} from 'naive-ui'
import { citizenships } from '@tmgo/shared'

const route = useRoute()
const props = defineProps<{
  loadUrl: string
  saveUrl: string
  apiBase: string
  initialProfile?: any
}>()

const userId = computed(() => String(route.params.id || ''))
const documentsBaseUrl = computed(() => `${props.apiBase}/admin/users/${userId.value}/documents`)

const emit = defineEmits<{ saved: [] }>()

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const loadError = ref<string | null>(null)
const formRef = ref<InstanceType<typeof NForm> | null>(null)

const citizenshipOptions = computed(() =>
  citizenships.map(c => ({ label: c, value: c }))
)

const statusOptions = [
  { label: 'Активен', value: 'active' },
  { label: 'В отпуске', value: 'on_leave' },
  { label: 'Уволен', value: 'fired' }
]

const employmentOptions = [
  { label: 'Штатный', value: 'full_time' },
  { label: 'Внештатный', value: 'freelance' },
  { label: 'Аренда', value: 'leased' }
]

const hireSourceOptions = [
  { label: 'По рекомендации', value: 'recommendation' },
  { label: 'Объявление', value: 'advertisement' },
  { label: 'Агентство', value: 'agency' }
]

const uploadBaseUrl = computed(() => props.saveUrl)

const form = reactive({
  id: '',
  surname: '',
  given_name: '',
  patronymic: '',
  date_of_birth: null as string | null,
  citizenships: [''] as string[],
  gender: 'male' as 'male' | 'female',
  phones: [''] as string[],
  email: '',
  extra_emails: [] as string[],
  status: 'active',
  employment_category: 'freelance',
  company_name: '',
  inn: '',
  address: '',

  passport_series: '',
  passport_number: '',
  passport_issue_date: null as string | null,
  passport_expiry_date: null as string | null,
  passport_issued_by: '',
  place_of_birth: '',
  residential_address: '',
  passport_scan_url: '',
  passport_is_active: true,
  extra_passports: [] as Array<{
    passport_series?: string
    passport_number?: string
    passport_issue_date?: string | null
    passport_expiry_date?: string | null
    passport_issued_by?: string
    place_of_birth?: string
    residential_address?: string
    passport_scan_url?: string
    is_active?: boolean
  }>,

  license_number: '',
  license_categories_arr: [] as string[],
  license_issue_date: null as string | null,
  license_expiry: null as string | null,
  license_issued_by: '',
  license_scan_url: '',
  has_international_license: false,
  international_license_number: '',
  international_license_validity: '',

  permission_entry_zone: '',
  permission_issue_date: null as string | null,
  permission_validity_date: null as string | null,
  medical_certificate: '',
  last_medical_examination_date: null as string | null,
  technical_minimum_certificate: '',
  tachograph_card_number: '',
  other_permits: '',
  hire_source: 'recommendation',
  medical_certificate_scan_url: '',
  bank_name: '',
  bank_account: '',
  bank_bik: '',
  updated_at: ''
})

const profileData = ref<Record<string, any> | null>(null)

type PassportItem = {
  _key: string
  _source: 'main' | 'extra' | 'doc' | 'new'
  _docId?: string
  series: string
  number: string
  issued_at: string | null
  expires_at: string | null
  issued_by: string
  place_of_birth: string
  residential_address: string
  scan_url: string
}

type LicenseItem = {
  _key: string
  _source: 'main' | 'doc' | 'new'
  _docId?: string
  number: string
  license_categories: string
  issued_at: string | null
  expires_at: string | null
  issued_by: string
  scan_url: string
}

const passportsList = ref<PassportItem[]>([])
const licensesList = ref<LicenseItem[]>([])

function addPassport() {
  passportsList.value.push({
    _key: `new-${Date.now()}`,
    _source: 'new',
    series: '',
    number: '',
    issued_at: null,
    expires_at: null,
    issued_by: '',
    place_of_birth: '',
    residential_address: '',
    scan_url: ''
  })
}

async function removePassport(idx: number) {
  const p = passportsList.value[idx]
  if (p._source === 'doc' && p._docId) {
    try {
      await $fetch(`${documentsBaseUrl.value}/${p._docId}`, { method: 'DELETE', credentials: 'include' })
    } catch (e: any) {
      message.error(e?.data?.error || 'Ошибка удаления')
      return
    }
  }
  passportsList.value.splice(idx, 1)
}

function addLicense() {
  licensesList.value.push({
    _key: `new-${Date.now()}`,
    _source: 'new',
    number: '',
    license_categories: '',
    issued_at: null,
    expires_at: null,
    issued_by: '',
    scan_url: ''
  })
}

async function removeLicense(idx: number) {
  const lic = licensesList.value[idx]
  if (lic._source === 'doc' && lic._docId) {
    try {
      await $fetch(`${documentsBaseUrl.value}/${lic._docId}`, { method: 'DELETE', credentials: 'include' })
    } catch (e: any) {
      message.error(e?.data?.error || 'Ошибка удаления')
      return
    }
  }
  licensesList.value.splice(idx, 1)
}

function openScan(url: string) {
  const fullUrl = url.startsWith('http') ? url : `${props.apiBase}${url}`
  window.open(fullUrl, '_blank')
}

function buildPassportsList(data: Record<string, any>): PassportItem[] {
  const seen = new Set<string>()
  const key = (s: string, n: string) => `${(s || '').trim().toUpperCase()}_${(n || '').trim()}`
  const list: PassportItem[] = []

  const main: PassportItem = {
    _key: 'main',
    _source: 'main',
    series: data.passport_series ?? '',
    number: data.passport_number ?? '',
    issued_at: data.passport_issue_date ?? null,
    expires_at: data.passport_expiry_date ?? null,
    issued_by: data.passport_issued_by ?? '',
    place_of_birth: data.place_of_birth ?? '',
    residential_address: data.residential_address ?? '',
    scan_url: data.passport_scan_url ?? ''
  }
  list.push(main)
  seen.add(key(main.series, main.number))

  const extra = Array.isArray(data.extra_passports) ? data.extra_passports : []
  for (let i = 0; i < extra.length; i++) {
    const p = extra[i]
    const s = p.passport_series ?? p.passportSeries ?? ''
    const n = p.passport_number ?? p.passportNumber ?? ''
    if (seen.has(key(s, n))) continue
    seen.add(key(s, n))
    list.push({
      _key: `extra-${i}`,
      _source: 'extra',
      series: s,
      number: n,
      issued_at: p.passport_issue_date ?? p.passportIssueDate ?? null,
      expires_at: p.passport_expiry_date ?? p.passportExpiryDate ?? null,
      issued_by: p.passport_issued_by ?? p.passportIssuedBy ?? '',
      place_of_birth: p.place_of_birth ?? p.placeOfBirth ?? '',
      residential_address: p.residential_address ?? p.residentialAddress ?? '',
      scan_url: p.passport_scan_url ?? p.passportScanUrl ?? ''
    })
  }

  const docs = Array.isArray(data.passports_from_documents) ? data.passports_from_documents : []
  for (const d of docs) {
    const s = d.series ?? ''
    const n = d.number ?? ''
    if (seen.has(key(s, n))) continue
    seen.add(key(s, n))
    list.push({
      _key: `doc-${d.id}`,
      _source: 'doc',
      _docId: d.id,
      series: s,
      number: n,
      issued_at: d.issued_at ?? null,
      expires_at: d.expires_at ?? null,
      issued_by: d.issued_by ?? '',
      place_of_birth: d.place_of_birth ?? '',
      residential_address: d.residential_address ?? '',
      scan_url: d.scan_url ?? ''
    })
  }
  return list
}

function buildLicensesList(data: Record<string, any>): LicenseItem[] {
  const seen = new Set<string>()
  const list: LicenseItem[] = []

  const main: LicenseItem = {
    _key: 'main',
    _source: 'main',
    number: data.license_number ?? '',
    license_categories: data.license_categories ?? '',
    issued_at: data.license_issue_date ?? null,
    expires_at: data.license_expiry ?? null,
    issued_by: data.license_issued_by ?? '',
    scan_url: data.license_scan_url ?? ''
  }
  list.push(main)
  if (main.number) seen.add((main.number || '').trim())

  const docs = Array.isArray(data.licenses_from_documents) ? data.licenses_from_documents : []
  for (const d of docs) {
    const n = (d.number ?? '').trim()
    if (n && seen.has(n)) continue
    if (n) seen.add(n)
    list.push({
      _key: `doc-${d.id}`,
      _source: 'doc',
      _docId: d.id,
      number: d.number ?? '',
      license_categories: d.license_categories ?? '',
      issued_at: d.issued_at ?? null,
      expires_at: d.expires_at ?? null,
      issued_by: d.issued_by ?? '',
      scan_url: d.scan_url ?? ''
    })
  }
  return list
}

function applyProfileToForm(data: Record<string, any>) {
  if (!data || data.error) return
  profileData.value = data
  Object.assign(form, data)

  if (data.citizenship) form.citizenships = data.citizenship.split(',').map((s: string) => s.trim()).filter(Boolean)
  if (data.phone) form.phones = data.phone.split(',').map((s: string) => s.trim()).filter(Boolean)
  if (data.additional_emails) form.extra_emails = (data.additional_emails || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  if (data.license_categories) form.license_categories_arr = data.license_categories.split(',').map((s: string) => s.trim()).filter(Boolean)

  if (!form.citizenships?.length) form.citizenships = ['']
  if (!form.phones?.length) form.phones = ['']

  const hireSourceMap: Record<string, string> = {
    'По рекомендации': 'recommendation',
    'Объявление': 'advertisement',
    'Агентство': 'agency'
  }
  if (data.hire_source && hireSourceMap[data.hire_source]) {
    form.hire_source = hireSourceMap[data.hire_source]
  } else if (['recommendation', 'advertisement', 'agency'].includes(data.hire_source)) {
    form.hire_source = data.hire_source
  }

  passportsList.value = buildPassportsList(data)
  licensesList.value = buildLicensesList(data)
}

async function loadProfile() {
  if (props.initialProfile && Object.keys(props.initialProfile).length > 0) {
    applyProfileToForm(props.initialProfile)
    loading.value = false
    return
  }

  if (!props.loadUrl) {
    loadError.value = 'URL не задан'
    loading.value = false
    return
  }

  loading.value = true
  loadError.value = null
  try {
    const data = await $fetch<any>(props.loadUrl, { credentials: 'include' })
    applyProfileToForm(data)
  } catch (e: any) {
    loadError.value = e?.data?.error || 'Ошибка загрузки профиля'
  } finally {
    loading.value = false
  }
}

function buildSaveBody() {
  const mainPassport = passportsList.value[0]
  const extraPassports = passportsList.value.slice(1).filter(p => p._source === 'extra')
  const mainLicense = licensesList.value[0]

  const body: Record<string, unknown> = {
    surname: form.surname,
    given_name: form.given_name,
    patronymic: form.patronymic,
    date_of_birth: form.date_of_birth,
    citizenship: form.citizenships.filter(Boolean).join(', '),
    gender: form.gender,
    phone: form.phones.filter(Boolean).join(', '),
    additional_emails: form.extra_emails.filter(Boolean).join(', '),
    status: form.status,
    employment_category: form.employment_category,
    company_name: form.company_name,
    inn: form.inn,
    address: form.address,

    passport_series: mainPassport?.series ?? form.passport_series,
    passport_number: mainPassport?.number ?? form.passport_number,
    passport_issue_date: mainPassport?.issued_at ?? form.passport_issue_date,
    passport_expiry_date: mainPassport?.expires_at ?? form.passport_expiry_date,
    passport_issued_by: mainPassport?.issued_by ?? form.passport_issued_by,
    place_of_birth: mainPassport?.place_of_birth ?? form.place_of_birth,
    residential_address: mainPassport?.residential_address ?? form.residential_address,
    passport_scan_url: mainPassport?.scan_url ?? form.passport_scan_url,
    passport_is_active: true,
    extra_passports: extraPassports.map(p => ({
      passport_series: p.series || null,
      passport_number: p.number || null,
      passport_issue_date: p.issued_at || null,
      passport_expiry_date: p.expires_at || null,
      passport_issued_by: p.issued_by || null,
      place_of_birth: p.place_of_birth || null,
      residential_address: p.residential_address || null,
      passport_scan_url: p.scan_url || null,
      is_active: true
    })),

    license_number: mainLicense?.number ?? form.license_number,
    license_categories: mainLicense?.license_categories ?? form.license_categories_arr.join(', '),
    license_issue_date: mainLicense?.issued_at ?? form.license_issue_date,
    license_expiry: mainLicense?.expires_at ?? form.license_expiry,
    license_issued_by: mainLicense?.issued_by ?? form.license_issued_by,
    license_scan_url: mainLicense?.scan_url ?? form.license_scan_url,
    has_international_license: form.has_international_license,
    international_license_number: form.international_license_number,
    international_license_validity: form.international_license_validity,

    permission_entry_zone: form.permission_entry_zone,
    permission_issue_date: form.permission_issue_date,
    permission_validity_date: form.permission_validity_date,
    medical_certificate: form.medical_certificate,
    last_medical_examination_date: form.last_medical_examination_date,
    medical_certificate_scan_url: form.medical_certificate_scan_url,
    technical_minimum_certificate: form.technical_minimum_certificate,
    tachograph_card_number: form.tachograph_card_number,
    other_permits: form.other_permits,
    hire_source: form.hire_source,
    bank_name: form.bank_name,
    bank_account: form.bank_account,
    bank_bik: form.bank_bik
  }
  return body
}

async function handleSave() {
  saving.value = true
  try {
    await $fetch(props.saveUrl, {
      method: 'PATCH',
      credentials: 'include',
      body: buildSaveBody()
    })

    const base = documentsBaseUrl.value
    for (const p of passportsList.value) {
      if (p._source === 'doc' && p._docId) {
        await $fetch(`${base}/${p._docId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: {
            series: p.series || null,
            number: p.number || null,
            issued_by: p.issued_by || null,
            issued_at: p.issued_at || null,
            expires_at: p.expires_at || null,
            place_of_birth: p.place_of_birth || null,
            residential_address: p.residential_address || null,
            scan_url: p.scan_url || null
          }
        })
      } else if (p._source === 'new') {
        await $fetch(base, {
          method: 'POST',
          credentials: 'include',
          body: {
            doc_type: 'passport',
            series: p.series || null,
            number: p.number || null,
            issued_by: p.issued_by || null,
            issued_at: p.issued_at || null,
            expires_at: p.expires_at || null,
            place_of_birth: p.place_of_birth || null,
            residential_address: p.residential_address || null,
            scan_url: p.scan_url || null
          }
        })
      }
    }
    for (const lic of licensesList.value) {
      if (lic._source === 'doc' && lic._docId) {
        await $fetch(`${base}/${lic._docId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: {
            number: lic.number || null,
            issued_by: lic.issued_by || null,
            issued_at: lic.issued_at || null,
            expires_at: lic.expires_at || null,
            license_categories: lic.license_categories || null,
            scan_url: lic.scan_url || null
          }
        })
      } else if (lic._source === 'new') {
        await $fetch(base, {
          method: 'POST',
          credentials: 'include',
          body: {
            doc_type: 'drivers_license',
            number: lic.number || null,
            issued_by: lic.issued_by || null,
            issued_at: lic.issued_at || null,
            expires_at: lic.expires_at || null,
            license_categories: lic.license_categories || null,
            scan_url: lic.scan_url || null
          }
        })
      }
    }

    message.success('Профиль сохранён')
    emit('saved')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка сохранения')
  } finally {
    saving.value = false
  }
}

async function handlePassportScanUpload(
  { file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void },
  p: PassportItem
) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    let url: string
    if (p._source === 'main') {
      const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-passport`, {
        method: 'POST',
        credentials: 'include',
        body: fd
      })
      url = res.url
    } else {
      fd.append('doc_type', 'passport')
      const res = await $fetch<{ url: string }>(`${documentsBaseUrl.value}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: fd
      })
      url = res.url
    }
    p.scan_url = url
    message.success('Файл загружен. Нажмите «Сохранить».')
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
    onError(e)
  }
}

async function handleLicenseScanUpload(
  { file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void },
  lic: LicenseItem
) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    let url: string
    if (lic._source === 'main') {
      const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-license`, {
        method: 'POST',
        credentials: 'include',
        body: fd
      })
      url = res.url
    } else {
      fd.append('doc_type', 'drivers_license')
      const res = await $fetch<{ url: string }>(`${documentsBaseUrl.value}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: fd
      })
      url = res.url
    }
    lic.scan_url = url
    message.success('Файл загружен. Нажмите «Сохранить».')
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
    onError(e)
  }
}

async function handleMedicalUpload({ file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void }) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-medical`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    form.medical_certificate_scan_url = res.url
    message.success('Файл загружен. Нажмите «Сохранить».')
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
    onError(e)
  }
}

watch(() => props.initialProfile, (p) => {
  if (p && Object.keys(p).length > 0) {
    applyProfileToForm(p)
  }
}, { immediate: false })

onMounted(() => {
  loadProfile()
})

defineExpose({ loadProfile, handleSave })
</script>

<style scoped>
.admin-driver-card-form {
  max-width: 900px;
  margin: 0 auto;
}
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
.mt-8 { margin-top: 8px; }
.mt-24 { margin-top: 24px; }
.ml-8 { margin-left: 8px; }

:deep(.n-form-item-label) {
  font-weight: 600;
}
</style>
