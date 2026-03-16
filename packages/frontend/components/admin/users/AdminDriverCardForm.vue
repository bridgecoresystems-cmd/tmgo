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

          <!-- 2. Паспортные данные -->
          <n-h3 prefix="bar" align-text>2. Паспортные данные</n-h3>
          <n-card embedded :bordered="false" class="mb-24">
            <n-space vertical size="large">
              <n-form-item label="Серия / Номер паспорта" required>
                <n-space>
                  <n-input v-model:value="form.passport_series" placeholder="AB" style="width: 80px" />
                  <n-input v-model:value="form.passport_number" placeholder="123456" style="width: 160px" />
                </n-space>
              </n-form-item>

              <n-form-item label="Даты действия" required>
                <n-space align="center">
                  <n-date-picker
                    :value="form.passport_issue_date ? new Date(form.passport_issue_date).getTime() : null"
                    type="date"
                    placeholder="Дата выдачи"
                    @update:value="(v) => { form.passport_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                  />
                  <n-text depth="3">—</n-text>
                  <n-date-picker
                    :value="form.passport_expiry_date ? new Date(form.passport_expiry_date).getTime() : null"
                    type="date"
                    placeholder="Дата окончания"
                    @update:value="(v) => { form.passport_expiry_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                  />
                </n-space>
              </n-form-item>

              <n-form-item label="Кем выдан" required path="passport_issued_by">
                <n-input v-model:value="form.passport_issued_by" placeholder="ОВД г. Ашхабад" />
              </n-form-item>

              <n-form-item label="Место рождения" required path="place_of_birth">
                <n-input v-model:value="form.place_of_birth" placeholder="г. Мары" />
              </n-form-item>

              <n-form-item label="Адрес проживания" required path="residential_address">
                <n-input v-model:value="form.residential_address" placeholder="ул. Махтумкули, д. 10" />
              </n-form-item>

              <n-form-item label="Скан паспорта (PDF/JPG)" required>
                <n-space vertical>
                  <n-upload :max="1" :custom-request="(o) => handlePassportUpload(o)" :show-file-list="false">
                    <n-button size="small">{{ form.passport_scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                  </n-upload>
                  <n-button v-if="form.passport_scan_url" text type="primary" size="small" @click="openScan(form.passport_scan_url)">
                    Просмотр скана
                  </n-button>
                </n-space>
              </n-form-item>

              <!-- Второй паспорт -->
              <template v-if="hasPassport2">
                <n-divider style="margin: 24px 0 16px;">Паспорт (2)</n-divider>
                <n-form-item label="Серия / Номер паспорта">
                  <n-space>
                    <n-input v-model:value="form.extra_passports[0].passport_series" placeholder="AB" style="width: 80px" />
                    <n-input v-model:value="form.extra_passports[0].passport_number" placeholder="1234567" style="width: 160px" />
                  </n-space>
                </n-form-item>
                <n-form-item label="Статус паспорта">
                  <n-switch v-model:value="form.extra_passports[0].is_active">
                    <template #checked>Активен</template>
                    <template #unchecked>Неактивен</template>
                  </n-switch>
                </n-form-item>
                <n-form-item label="Даты действия">
                  <n-space align="center">
                    <n-date-picker
                      :value="form.extra_passports[0].passport_issue_date ? new Date(form.extra_passports[0].passport_issue_date).getTime() : null"
                      type="date"
                      placeholder="Дата выдачи"
                      @update:value="(v) => { form.extra_passports[0].passport_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                    />
                    <n-text depth="3">—</n-text>
                    <n-date-picker
                      :value="form.extra_passports[0].passport_expiry_date ? new Date(form.extra_passports[0].passport_expiry_date).getTime() : null"
                      type="date"
                      placeholder="Дата окончания"
                      @update:value="(v) => { form.extra_passports[0].passport_expiry_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                    />
                  </n-space>
                </n-form-item>
                <n-form-item label="Кем выдан">
                  <n-input v-model:value="form.extra_passports[0].passport_issued_by" placeholder="МВД Туркменистана" />
                </n-form-item>
                <n-form-item label="Место рождения">
                  <n-input v-model:value="form.extra_passports[0].place_of_birth" placeholder="Ашхабад" />
                </n-form-item>
                <n-form-item label="Адрес проживания">
                  <n-input v-model:value="form.extra_passports[0].residential_address" type="textarea" placeholder="Ашхабад, ул. Гарашсызлык, д. 45" :rows="2" />
                </n-form-item>
                <n-form-item label="Скан паспорта (PDF/JPG)">
                  <n-space vertical>
                    <n-upload :max="1" :custom-request="(o) => handleExtraPassportUpload(o)" :show-file-list="false">
                      <n-button size="small">{{ form.extra_passports[0]?.passport_scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                    </n-upload>
                    <n-button v-if="form.extra_passports[0]?.passport_scan_url" text type="primary" size="small" @click="openScan(form.extra_passports[0].passport_scan_url)">
                      Просмотр скана
                    </n-button>
                  </n-space>
                </n-form-item>
                <n-button quaternary type="error" size="small" @click="removePassport2">Удалить второй паспорт</n-button>
              </template>

              <n-button v-if="!hasPassport2" quaternary type="primary" size="small" @click="addPassport2">+ Добавить второй паспорт</n-button>
            </n-space>
          </n-card>

          <!-- 3. Водительское удостоверение -->
          <n-h3 prefix="bar" align-text>3. Водительское удостоверение</n-h3>
          <n-card embedded :bordered="false" class="mb-24">
            <n-space vertical size="large">
              <n-form-item label="Номер ВУ" required path="license_number">
                <n-input v-model:value="form.license_number" placeholder="tm-123456" style="width: 240px" />
              </n-form-item>

              <n-form-item label="Категории прав" required>
                <n-checkbox-group v-model:value="form.license_categories_arr">
                  <n-space>
                    <n-checkbox value="A">A</n-checkbox>
                    <n-checkbox value="B">B</n-checkbox>
                    <n-checkbox value="C">C</n-checkbox>
                    <n-checkbox value="D">D</n-checkbox>
                    <n-checkbox value="E">E</n-checkbox>
                  </n-space>
                </n-checkbox-group>
              </n-form-item>

              <n-form-item label="Даты действия ВУ" required>
                <n-space align="center">
                  <n-date-picker
                    :value="form.license_issue_date ? new Date(form.license_issue_date).getTime() : null"
                    type="date"
                    placeholder="Дата выдачи"
                    @update:value="(v) => { form.license_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                  />
                  <n-text depth="3">—</n-text>
                  <n-date-picker
                    :value="form.license_expiry ? new Date(form.license_expiry).getTime() : null"
                    type="date"
                    placeholder="Дата окончания"
                    @update:value="(v) => { form.license_expiry = v ? new Date(v).toISOString().slice(0, 10) : null }"
                  />
                </n-space>
              </n-form-item>

              <n-form-item label="Кем выдано">
                <n-input v-model:value="form.license_issued_by" placeholder="МВД Туркменистана" />
              </n-form-item>

              <n-form-item label="Скан ВУ (PDF/JPG)" required>
                <n-space vertical>
                  <n-upload :max="1" :custom-request="(o) => handleLicenseUpload(o)" :show-file-list="false">
                    <n-button size="small">{{ form.license_scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                  </n-upload>
                  <n-button v-if="form.license_scan_url" text type="primary" size="small" @click="openScan(form.license_scan_url)">
                    Просмотр скана
                  </n-button>
                </n-space>
              </n-form-item>

              <n-form-item label="Международные права">
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

const props = defineProps<{
  loadUrl: string
  saveUrl: string
  apiBase: string
  initialProfile?: any
}>()

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

const hasPassport2 = computed(() => form.extra_passports.length > 0)

function addPassport2() {
  form.extra_passports.push({
    passport_series: '',
    passport_number: '',
    passport_issue_date: null,
    passport_expiry_date: null,
    passport_issued_by: '',
    place_of_birth: '',
    residential_address: '',
    passport_scan_url: '',
    is_active: true
  })
}

function removePassport2() {
  form.extra_passports = []
}

function openScan(url: string) {
  const fullUrl = url.startsWith('http') ? url : `${props.apiBase}${url}`
  window.open(fullUrl, '_blank')
}

function applyProfileToForm(data: Record<string, any>) {
  if (!data) return
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

  form.extra_passports = Array.isArray(data.extra_passports) ? data.extra_passports.map((p: any) => ({
    passport_series: p.passport_series ?? '',
    passport_number: p.passport_number ?? '',
    passport_issue_date: p.passport_issue_date ?? null,
    passport_expiry_date: p.passport_expiry_date ?? null,
    passport_issued_by: p.passport_issued_by ?? '',
    place_of_birth: p.place_of_birth ?? '',
    residential_address: p.residential_address ?? '',
    passport_scan_url: p.passport_scan_url ?? '',
    is_active: p.is_active ?? true
  })) : []
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

    passport_series: form.passport_series,
    passport_number: form.passport_number,
    passport_issue_date: form.passport_issue_date,
    passport_expiry_date: form.passport_expiry_date,
    passport_issued_by: form.passport_issued_by,
    place_of_birth: form.place_of_birth,
    residential_address: form.residential_address,
    passport_scan_url: form.passport_scan_url,
    passport_is_active: form.passport_is_active,
    extra_passports: form.extra_passports.map(p => ({
      passport_series: p.passport_series || null,
      passport_number: p.passport_number || null,
      passport_issue_date: p.passport_issue_date || null,
      passport_expiry_date: p.passport_expiry_date || null,
      passport_issued_by: p.passport_issued_by || null,
      place_of_birth: p.place_of_birth || null,
      residential_address: p.residential_address || null,
      passport_scan_url: p.passport_scan_url || null,
      is_active: p.is_active ?? true
    })),

    license_number: form.license_number,
    license_categories: form.license_categories_arr.join(', '),
    license_issue_date: form.license_issue_date,
    license_expiry: form.license_expiry,
    license_issued_by: form.license_issued_by,
    license_scan_url: form.license_scan_url,
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
    message.success('Профиль сохранён')
    emit('saved')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка сохранения')
  } finally {
    saving.value = false
  }
}

async function handlePassportUpload({ file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void }) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-passport`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    form.passport_scan_url = res.url
    message.success('Файл загружен. Нажмите «Сохранить».')
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
    onError(e)
  }
}

async function handleExtraPassportUpload({ file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void }) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    fd.append('index', '0')
    const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-extra-passport`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    if (form.extra_passports.length === 0) {
      form.extra_passports.push({
        passport_series: '', passport_number: '', passport_issue_date: null, passport_expiry_date: null,
        passport_issued_by: '', place_of_birth: '', residential_address: '', passport_scan_url: res.url,
        is_active: true
      })
    } else {
      form.extra_passports[0] = { ...form.extra_passports[0], passport_scan_url: res.url }
    }
    message.success('Файл загружен. Нажмите «Сохранить».')
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
    onError(e)
  }
}

async function handleLicenseUpload({ file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void }) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-license`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    form.license_scan_url = res.url
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

:deep(.n-form-item-label) {
  font-weight: 600;
}
</style>
