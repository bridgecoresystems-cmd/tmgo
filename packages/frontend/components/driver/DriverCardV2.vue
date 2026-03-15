<template>
  <div class="driver-card-v2">
    <n-spin :show="loading">
      <div v-if="!loading" style="min-height: 400px; padding: 20px;">
        <n-alert v-if="error" type="error" class="mb-16">
          {{ error }}
          <template #footer>
            <n-button size="small" @click="loadProfile">Повторить</n-button>
          </template>
        </n-alert>

        <n-form
          v-if="!error"
          ref="formRef"
          :model="form"
          label-placement="left"
          label-width="240"
          label-align="left"
          class="v2-form"
          :disabled="isLocked"
        >
        <!-- 1. Основная информация -->
        <n-h3 prefix="bar" align-text>1. Основная информация</n-h3>
        <n-card embedded :bordered="false" class="mb-24">
          <n-space vertical size="large">
            <n-form-item label="Водитель ID">
              <n-space align="center">
                <n-text depth="3">{{ form.id || 'Генерируется системой' }}</n-text>
                <n-tag v-if="form.id" size="small" type="info">Auto</n-tag>
              </n-space>
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
              <n-select v-model:value="form.status" :options="statusOptions" :disabled="isDriverContext" style="width: 200px" />
            </n-form-item>

            <n-form-item label="Категория занятости">
              <n-select v-model:value="form.employment_category" :options="employmentOptions" :disabled="isDriverContext" style="width: 200px" />
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
                <n-upload
                  :max="1"
                  :custom-request="(o) => handleUpload(o, 'passport')"
                  :show-file-list="false"
                >
                  <n-button size="small">{{ form.passport_scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                </n-upload>
                <n-button v-if="form.passport_scan_url" text type="primary" size="small" @click="openScan(form.passport_scan_url)">
                  Просмотр скана
                </n-button>
              </n-space>
            </n-form-item>
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

            <n-form-item label="Скан ВУ (PDF/JPG)" required>
              <n-space vertical>
                <n-upload
                  :max="1"
                  :custom-request="(o) => handleUpload(o, 'license')"
                  :show-file-list="false"
                >
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
                    <n-form-item label="Скан МВУ" label-placement="left" label-width="120">
                      <n-upload
                        :max="1"
                        :custom-request="(o) => handleUpload(o, 'intl_license')"
                        :show-file-list="false"
                      >
                        <n-button size="small">Загрузить</n-button>
                      </n-upload>
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
                <n-upload :max="1" :custom-request="(o) => handleUpload(o, 'visa')" :show-file-list="false">
                  <n-button size="small">Загрузить скан визы</n-button>
                </n-upload>
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
                <n-upload :max="1" :custom-request="(o) => handleUpload(o, 'medical')" :show-file-list="false">
                  <n-button size="small">Загрузить скан справки</n-button>
                </n-upload>
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

            <n-form-item label="Прикреплённые документы">
              <n-space>
                <n-tag v-if="form.passport_scan_url" type="success" size="small">Паспорт</n-tag>
                <n-tag v-if="form.license_scan_url" type="success" size="small">ВУ</n-tag>
                <n-tag v-if="form.international_license_scan_url" type="success" size="small">МВУ</n-tag>
                <n-tag v-if="form.visa_scan_url" type="success" size="small">Виза</n-tag>
                <n-tag v-if="form.medical_certificate_scan_url" type="success" size="small">Медсправка</n-tag>
                <n-text v-if="!anyScanUploaded" depth="3">Нет прикреплённых файлов</n-text>
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
            <n-button :loading="saving" @click="handleSave">Сохранить черновик</n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">Отправить на верификацию</n-button>
          </n-space>
        </div>
      </n-form>
    </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { 
  useMessage, 
  NForm, NFormItem, NInput, NCard, NSpace, NButton, NSelect, NDatePicker, 
  NUpload, NTag, NText, NRadioGroup, NRadio, NCheckboxGroup, NCheckbox, 
  NSpin, NAlert, NH3, NDivider
} from 'naive-ui'
import { citizenships } from '@tmgo/shared'

const props = defineProps<{
  isDriverContext?: boolean
}>()

const emit = defineEmits(['saved', 'submitted'])

const { apiBase } = useApiBase()
const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)

const citizenshipOptions = computed(() => 
  citizenships.map(c => ({ label: c, value: c }))
)

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
  
  passport_series: '',
  passport_number: '',
  passport_issue_date: null as string | null,
  passport_expiry_date: null as string | null,
  passport_issued_by: '',
  place_of_birth: '',
  residential_address: '',
  passport_scan_url: '',

  license_number: '',
  license_categories_arr: [] as string[],
  license_issue_date: null as string | null,
  license_expiry: null as string | null,
  license_scan_url: '',
  has_international_license: false,
  international_license_number: '',
  international_license_validity: '',
  international_license_scan_url: '',

  permission_entry_zone: '',
  permission_issue_date: null as string | null,
  permission_validity_date: null as string | null,
  medical_certificate: '',
  last_medical_examination_date: null as string | null,
  technical_minimum_certificate: '',
  tachograph_card_number: '',
  other_permits: '',
  hire_source: 'По рекомендации',
  visa_scan_url: '',
  medical_certificate_scan_url: '',
  updated_at: '',
  verification_status: 'not_submitted'
})

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
  { label: 'По рекомендации', value: 'По рекомендации' },
  { label: 'Объявление', value: 'Объявление' },
  { label: 'Агентство', value: 'Агентство' }
]

const anyScanUploaded = computed(() => {
  return !!(form.passport_scan_url || form.license_scan_url || form.international_license_scan_url || form.visa_scan_url || form.medical_certificate_scan_url)
})

const isLocked = computed(() => 
  props.isDriverContext && ['submitted', 'verified', 'waiting_verification', 'request'].includes(form.verification_status)
)

async function loadProfile() {
  loading.value = true
  error.value = null
  try {
    const url = props.isDriverContext 
      ? `${apiBase}/cabinet/driver/profile`
      : `${apiBase}/admin/users/${useRoute().params.id}/driver-profile`
    
    const data = await $fetch<any>(url, { credentials: 'include' })
    
    // Map data to form
    Object.assign(form, data)
    
    // Handle special mappings
    if (data.citizenship) form.citizenships = data.citizenship.split(',').map((s: string) => s.trim())
    if (data.phone) form.phones = data.phone.split(',').map((s: string) => s.trim())
    if (data.additional_emails) form.extra_emails = data.additional_emails.split(',').map((s: string) => s.trim())
    if (data.license_categories) form.license_categories_arr = data.license_categories.split(',').map((s: string) => s.trim())
    
    // Ensure at least one empty field for dynamic lists
    if (!form.citizenships || form.citizenships.length === 0) form.citizenships = ['']
    if (!form.phones || form.phones.length === 0) form.phones = ['']

    console.log('Loaded form data:', form)
  } catch (e: any) {
    console.error('Error loading profile:', e)
    error.value = e?.data?.error || 'Ошибка загрузки профиля'
  } finally {
    loading.value = false
  }
}

function buildSaveBody() {
  return {
    ...form,
    citizenship: form.citizenships.filter(Boolean).join(', '),
    phone: form.phones.filter(Boolean).join(', '),
    additional_emails: form.extra_emails.filter(Boolean).join(', '),
    license_categories: form.license_categories_arr.join(', ')
  }
}

async function handleSave() {
  saving.value = true
  try {
    const url = props.isDriverContext 
      ? `${apiBase}/cabinet/driver/profile`
      : `${apiBase}/admin/users/${useRoute().params.id}/driver-profile`
    
    await $fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      body: buildSaveBody()
    })
    message.success('Черновик сохранен')
    emit('saved')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка сохранения')
  } finally {
    saving.value = false
  }
}

async function handleSubmit() {
  // Simple validation
  const required = [
    { v: form.surname, l: 'Фамилия' },
    { v: form.given_name, l: 'Имя' },
    { v: form.date_of_birth, l: 'Дата рождения' },
    { v: form.passport_number, l: 'Номер паспорта' },
    { v: form.license_number, l: 'Номер ВУ' }
  ]
  const missing = required.filter(r => !r.v).map(r => r.l)
  if (missing.length > 0) {
    message.error(`Заполните обязательные поля: ${missing.join(', ')}`)
    return
  }

  submitting.value = true
  try {
    const url = `${apiBase}/cabinet/driver/profile/submit-for-verification`
    await $fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: buildSaveBody()
    })
    message.success('Карточка отправлена на верификацию')
    form.verification_status = 'submitted'
    emit('submitted')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка отправки')
  } finally {
    submitting.value = false
  }
}

async function handleUpload({ file }: any, type: string) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    fd.append('doc_type', type)
    
    const res = await $fetch<{ url: string }>(`${apiBase}/cabinet/driver/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    
    if (type === 'passport') form.passport_scan_url = res.url
    else if (type === 'license') form.license_scan_url = res.url
    else if (type === 'intl_license') form.international_license_scan_url = res.url
    
    message.success('Файл загружен')
  } catch (e: any) {
    message.error('Ошибка загрузки файла')
  }
}

function openScan(url: string) {
  const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`
  window.open(fullUrl, '_blank')
}

onMounted(loadProfile)
</script>

<style scoped>
.driver-card-v2 {
  max-width: 900px;
  margin: 0 auto;
}
.v2-form {
  padding: 20px 0;
}
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
.mt-8 { margin-top: 8px; }
.mt-24 { margin-top: 24px; }

:deep(.n-form-item-label) {
  font-weight: 600;
}
</style>
