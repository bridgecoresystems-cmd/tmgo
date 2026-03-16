<template>
  <div class="driver-card-view">
    <n-spin :show="loading">
      <div v-if="!loading" style="min-height: 400px; padding: 20px;">
        <n-alert v-if="error" type="error" class="mb-16">
          {{ error }}
          <template #footer>
            <n-button size="small" @click="loadProfile">Повторить</n-button>
          </template>
        </n-alert>

        <div v-if="!error && profile" class="view-content">
          <!-- 1. Основная информация -->
          <n-h3 prefix="bar" align-text>1. Основная информация</n-h3>
          <n-card embedded :bordered="false" class="mb-24 view-card">
            <div class="view-grid">
              <template v-if="profile.id">
                <div class="view-row">
                  <span class="view-label">Водитель ID:</span>
                  <span class="view-value">{{ profile.id }} <n-tag size="small" type="info">Auto</n-tag></span>
                </div>
              </template>
              <div class="view-row">
                <span class="view-label">ФИО:</span>
                <span class="view-value">{{ fullName }}</span>
              </div>
              <div v-if="profile.date_of_birth" class="view-row">
                <span class="view-label">Дата рождения:</span>
                <span class="view-value">{{ formatDate(profile.date_of_birth) }}</span>
              </div>
              <div v-if="citizenshipsDisplay" class="view-row">
                <span class="view-label">Гражданство:</span>
                <span class="view-value">{{ citizenshipsDisplay }}</span>
              </div>
              <div v-if="profile.gender" class="view-row">
                <span class="view-label">Пол:</span>
                <span class="view-value">{{ genderLabel }}</span>
              </div>
              <div v-if="phonesDisplay" class="view-row">
                <span class="view-label">Контактный телефон:</span>
                <span class="view-value">{{ phonesDisplay }}</span>
              </div>
              <div v-if="profile.email" class="view-row">
                <span class="view-label">Email (Логин):</span>
                <span class="view-value">{{ profile.email }}</span>
              </div>
              <div v-if="emailsDisplay" class="view-row">
                <span class="view-label">Доп. email:</span>
                <span class="view-value">{{ emailsDisplay }}</span>
              </div>
              <div v-if="profile.status" class="view-row">
                <span class="view-label">Статус (Диспетчер):</span>
                <span class="view-value">{{ statusLabel }}</span>
              </div>
              <div v-if="profile.employment_category" class="view-row">
                <span class="view-label">Категория занятости:</span>
                <span class="view-value">{{ employmentLabel }}</span>
              </div>
            </div>
          </n-card>

          <!-- 2. Паспортные данные -->
          <n-h3 prefix="bar" align-text>2. Паспортные данные</n-h3>
          <n-card v-if="hasPassportData" embedded :bordered="false" class="mb-24 view-card">
            <div class="view-grid">
              <div v-if="passportSeriesNumber" class="view-row">
                <span class="view-label">Серия / Номер паспорта:</span>
                <span class="view-value">{{ passportSeriesNumber }}</span>
              </div>
              <div v-if="passportDatesDisplay" class="view-row">
                <span class="view-label">Даты действия:</span>
                <span class="view-value">{{ passportDatesDisplay }}</span>
              </div>
              <div v-if="profile.passport_issued_by" class="view-row">
                <span class="view-label">Кем выдан:</span>
                <span class="view-value">{{ profile.passport_issued_by }}</span>
              </div>
              <div v-if="profile.place_of_birth" class="view-row">
                <span class="view-label">Место рождения:</span>
                <span class="view-value">{{ profile.place_of_birth }}</span>
              </div>
              <div v-if="profile.residential_address" class="view-row">
                <span class="view-label">Адрес проживания:</span>
                <span class="view-value">{{ profile.residential_address }}</span>
              </div>
              <div v-if="profile.passport_scan_url" class="view-row">
                <span class="view-label">Скан паспорта (PDF/JPG):</span>
                <span class="view-value">
                  <n-button text type="primary" size="small" @click="openScanModal(profile.passport_scan_url, 'Скан паспорта')">
                    Просмотр скана
                  </n-button>
                </span>
              </div>
            </div>
            <!-- Дополнительные паспорта (из «Добавить документы») -->
            <template v-for="(ep, idx) in extraPassports" :key="ep.id">
              <n-divider v-if="idx === 0 && hasMainPassportData" style="margin: 16px 0;" />
              <div class="view-grid extra-passport-block" :class="{ 'extra-passport-block--not-first': idx > 0 }">
                <div v-if="ep.series || ep.number" class="view-row">
                  <span class="view-label">Серия / Номер паспорта{{ hasMainPassportData ? ` (${idx + 2})` : ` ${idx + 1}` }}:</span>
                  <span class="view-value">{{ [ep.series, ep.number].filter(Boolean).join(' ') || '—' }}</span>
                </div>
                <div v-if="ep.issued_at || ep.expires_at" class="view-row">
                  <span class="view-label">Даты действия:</span>
                  <span class="view-value">{{ formatDate(ep.issued_at) }} — {{ formatDate(ep.expires_at) }}</span>
                </div>
                <div v-if="ep.issued_by" class="view-row">
                  <span class="view-label">Кем выдан:</span>
                  <span class="view-value">{{ ep.issued_by }}</span>
                </div>
                <div v-if="ep.place_of_birth" class="view-row">
                  <span class="view-label">Место рождения:</span>
                  <span class="view-value">{{ ep.place_of_birth }}</span>
                </div>
                <div v-if="ep.residential_address" class="view-row">
                  <span class="view-label">Адрес проживания:</span>
                  <span class="view-value">{{ ep.residential_address }}</span>
                </div>
                <div v-if="ep.scan_url" class="view-row">
                  <span class="view-label">Скан паспорта (PDF/JPG):</span>
                  <span class="view-value">
                    <n-button text type="primary" size="small" @click="openScanModal(ep.scan_url, hasMainPassportData ? `Скан паспорта (${idx + 2})` : `Скан паспорта ${idx + 1}`)">
                      Просмотр скана
                    </n-button>
                  </span>
                </div>
              </div>
            </template>
          </n-card>

          <!-- 3. Водительское удостоверение -->
          <n-h3 prefix="bar" align-text>3. Водительское удостоверение</n-h3>
          <n-card v-if="hasLicenseData" embedded :bordered="false" class="mb-24 view-card">
            <div class="view-grid">
              <div v-if="profile.license_number" class="view-row">
                <span class="view-label">Номер ВУ:</span>
                <span class="view-value">{{ profile.license_number }}</span>
              </div>
              <div v-if="licenseCategoriesDisplay" class="view-row">
                <span class="view-label">Категории прав:</span>
                <span class="view-value">{{ licenseCategoriesDisplay }}</span>
              </div>
              <div v-if="licenseDatesDisplay" class="view-row">
                <span class="view-label">Даты действия ВУ:</span>
                <span class="view-value">{{ licenseDatesDisplay }}</span>
              </div>
              <div v-if="profile.license_scan_url" class="view-row">
                <span class="view-label">Скан ВУ (PDF/JPG):</span>
                <span class="view-value">
                  <n-button text type="primary" size="small" @click="openScanModal(profile.license_scan_url, 'Скан ВУ')">
                    Просмотр скана
                  </n-button>
                </span>
              </div>
              <!-- Международные права — только если водитель указал -->
              <template v-if="profile.has_international_license">
                <div v-if="profile.international_license_number" class="view-row">
                  <span class="view-label">Номер МВУ:</span>
                  <span class="view-value">{{ profile.international_license_number }}</span>
                </div>
                <div v-if="profile.international_license_validity" class="view-row">
                  <span class="view-label">Срок действия МВУ:</span>
                  <span class="view-value">{{ profile.international_license_validity }}</span>
                </div>
                <div v-if="profile.international_license_scan_url" class="view-row">
                  <span class="view-label">Скан МВУ:</span>
                  <span class="view-value">
                    <n-button text type="primary" size="small" @click="openScanModal(profile.international_license_scan_url!, 'Скан МВУ')">
                      Просмотр скана
                    </n-button>
                  </span>
                </div>
              </template>
            </div>
            <!-- Дополнительные ВУ (из «Добавить документы») -->
            <template v-for="(el, idx) in extraLicenses" :key="el.id">
              <n-divider v-if="idx === 0 && hasMainLicenseData" style="margin: 16px 0;" />
              <div class="view-grid extra-passport-block" :class="{ 'extra-passport-block--not-first': idx > 0 }">
                <div v-if="el.number" class="view-row">
                  <span class="view-label">Номер ВУ{{ hasMainLicenseData ? ` (${idx + 2})` : ` ${idx + 1}` }}:</span>
                  <span class="view-value">{{ el.number }}</span>
                </div>
                <div v-if="el.license_categories" class="view-row">
                  <span class="view-label">Категории прав:</span>
                  <span class="view-value">{{ el.license_categories }}</span>
                </div>
                <div v-if="el.issued_at || el.expires_at" class="view-row">
                  <span class="view-label">Даты действия ВУ:</span>
                  <span class="view-value">{{ formatDate(el.issued_at) }} — {{ formatDate(el.expires_at) }}</span>
                </div>
                <div v-if="el.issued_by" class="view-row">
                  <span class="view-label">Кем выдан:</span>
                  <span class="view-value">{{ el.issued_by }}</span>
                </div>
                <div v-if="el.scan_url" class="view-row">
                  <span class="view-label">Скан ВУ (PDF/JPG):</span>
                  <span class="view-value">
                    <n-button text type="primary" size="small" @click="openScanModal(el.scan_url, hasMainLicenseData ? `Скан ВУ (${idx + 2})` : `Скан ВУ ${idx + 1}`)">
                      Просмотр скана
                    </n-button>
                  </span>
                </div>
              </div>
            </template>
          </n-card>

          <!-- 4. Разрешительные документы — только заполненные -->
          <template v-if="hasPermitsData">
            <n-h3 prefix="bar" align-text>4. Разрешительные документы</n-h3>
            <n-card embedded :bordered="false" class="mb-24 view-card">
              <div class="view-grid">
                <!-- Виза -->
                <template v-if="hasVisaData">
                  <div v-if="profile.permission_entry_zone" class="view-row">
                    <span class="view-label">Разрешение на въезд (Виза):</span>
                    <span class="view-value">{{ profile.permission_entry_zone }}</span>
                  </div>
                  <div v-if="visaDatesDisplay" class="view-row">
                    <span class="view-label">Даты действия визы:</span>
                    <span class="view-value">{{ visaDatesDisplay }}</span>
                  </div>
                  <div v-if="profile.visa_scan_url" class="view-row">
                    <span class="view-label">Скан визы:</span>
                    <span class="view-value">
                      <n-button text type="primary" size="small" @click="openScanModal(profile.visa_scan_url!, 'Скан визы')">
                        Просмотр скана
                      </n-button>
                    </span>
                  </div>
                </template>
                <!-- Медсправка -->
                <template v-if="profile.medical_certificate || profile.last_medical_examination_date || profile.medical_certificate_scan_url">
                  <div v-if="profile.medical_certificate" class="view-row">
                    <span class="view-label">Медицинская справка:</span>
                    <span class="view-value">{{ profile.medical_certificate }}</span>
                  </div>
                  <div v-if="profile.last_medical_examination_date" class="view-row">
                    <span class="view-label">Действует до:</span>
                    <span class="view-value">{{ formatDate(profile.last_medical_examination_date) }}</span>
                  </div>
                  <div v-if="profile.medical_certificate_scan_url" class="view-row">
                    <span class="view-label">Скан медсправки:</span>
                    <span class="view-value">
                      <n-button text type="primary" size="small" @click="openScanModal(profile.medical_certificate_scan_url!, 'Скан медсправки')">
                        Просмотр скана
                      </n-button>
                    </span>
                  </div>
                </template>
                <div v-if="profile.technical_minimum_certificate" class="view-row">
                  <span class="view-label">Техминимум:</span>
                  <span class="view-value">{{ profile.technical_minimum_certificate }}</span>
                </div>
                <div v-if="profile.tachograph_card_number" class="view-row">
                  <span class="view-label">Карта тахографа:</span>
                  <span class="view-value">{{ profile.tachograph_card_number }}</span>
                </div>
                <div v-if="profile.other_permits" class="view-row">
                  <span class="view-label">Прочие документы:</span>
                  <span class="view-value">{{ profile.other_permits }}</span>
                </div>
                <div v-if="profile.hire_source" class="view-row">
                  <span class="view-label">Источник найма:</span>
                  <span class="view-value">{{ profile.hire_source }}</span>
                </div>
              </div>
            </n-card>
          </template>
        </div>
      </div>
    </n-spin>

    <!-- Scan modal -->
    <Teleport to="body">
      <Transition name="scan-modal-fade">
        <div v-if="scanModalVisible" class="scan-modal-overlay">
          <div
            ref="scanModalEl"
            class="scan-modal-draggable"
            :style="{ left: modalPos.x + 'px', top: modalPos.y + 'px' }"
            @mousedown="onModalContentMousedown"
          >
            <div class="scan-modal-header" @mousedown.stop="startDrag">
              <span class="scan-modal-title">{{ scanModalTitle }}</span>
              <n-button quaternary circle size="small" @click="closeScanModal">
                <template #icon>
                  <span style="font-size: 18px; line-height: 1;">×</span>
                </template>
              </n-button>
            </div>
            <div v-if="scanModalUrl" class="scan-modal-body">
              <img v-if="isImageUrl(scanModalUrl)" :src="scanFullUrl(scanModalUrl)" alt="" class="scan-modal-img" />
              <iframe v-else :src="scanFullUrl(scanModalUrl)" class="scan-modal-iframe" title="Документ" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Режим водителя: загрузка своего профиля */
    isDriverContext?: boolean
    /** Готовый профиль (для админки / заказчика) — не делать fetch */
    initialProfile?: Record<string, any> | null
  }>(),
  { isDriverContext: true, initialProfile: null }
)

const { apiBase } = useApiBase()
const route = useRoute()
const loading = ref(false)
const error = ref<string | null>(null)
const profile = ref<Record<string, any> | null>(props.initialProfile ?? null)

const scanModalVisible = ref(false)
const scanModalUrl = ref<string | null>(null)
const scanModalTitle = ref('')
const scanModalEl = ref<HTMLElement | null>(null)
const modalPos = ref({ x: 0, y: 0 })
let dragStart = { x: 0, y: 0, posX: 0, posY: 0 }

const statusLabels: Record<string, string> = {
  active: 'Активен',
  inactive: 'Неактивен',
  on_leave: 'В отпуске',
  fired: 'Уволен',
}
const employmentLabels: Record<string, string> = {
  full_time: 'Штатный',
  freelance: 'Внештатный',
  leased: 'Аренда',
}

const fullName = computed(() => {
  const p = profile.value
  if (!p) return '—'
  const parts = [p.surname, p.given_name, p.patronymic].filter(Boolean)
  return parts.join(' ') || '—'
})

const citizenshipsDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const arr = p.citizenships ?? (p.citizenship ? p.citizenship.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  return Array.isArray(arr) ? arr.filter(Boolean).join(', ') : (p.citizenship || '')
})

const phonesDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const arr = p.phones ?? (p.phone ? p.phone.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  return Array.isArray(arr) ? arr.filter(Boolean).join(', ') : (p.phone || '')
})

const emailsDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const arr = p.extra_emails ?? (p.additional_emails ? p.additional_emails.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  return Array.isArray(arr) ? arr.filter(Boolean).join(', ') : (p.additional_emails || '')
})

const genderLabel = computed(() => {
  const g = profile.value?.gender
  return g === 'female' ? 'Женский' : g === 'male' ? 'Мужской' : g || '—'
})

const statusLabel = computed(() => statusLabels[profile.value?.status] ?? profile.value?.status ?? '—')
const employmentLabel = computed(() => employmentLabels[profile.value?.employment_category] ?? profile.value?.employment_category ?? '—')

const passportSeriesNumber = computed(() => {
  const p = profile.value
  if (!p) return ''
  const s = (p.passport_series ?? '').trim()
  const n = (p.passport_number ?? '').trim()
  if (s && n) return `${s} ${n}`
  return s || n || ''
})

const passportDatesDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const from = p.passport_issue_date
  const to = p.passport_expiry_date
  if (!from && !to) return ''
  return `${formatDate(from)} — ${formatDate(to)}`
})

const licenseCategoriesDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const arr = p.license_categories_arr ?? (p.license_categories ? p.license_categories.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  return Array.isArray(arr) ? arr.filter(Boolean).join('/') : (p.license_categories || '')
})

const licenseDatesDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const from = p.license_issue_date
  const to = p.license_expiry
  if (!from && !to) return ''
  return `${formatDate(from)} — ${formatDate(to)}`
})

const visaDatesDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const from = p.permission_issue_date
  const to = p.permission_validity_date
  if (!from && !to) return ''
  return `${formatDate(from)} — ${formatDate(to)}`
})

const extraPassports = computed(() => {
  const arr = profile.value?.passports_from_documents
  if (!Array.isArray(arr)) return []
  const mainSeries = (profile.value?.passport_series ?? '').trim().toUpperCase()
  const mainNumber = (profile.value?.passport_number ?? '').trim()
  const mainKey = `${mainSeries} ${mainNumber}`.trim()
  if (!mainKey) return arr
  return arr.filter((ep: any) => {
    const epSeries = (ep.series ?? '').trim().toUpperCase()
    const epNumber = (ep.number ?? '').trim()
    const epKey = `${epSeries} ${epNumber}`.trim()
    return epKey !== mainKey
  })
})

const hasMainPassportData = computed(() => {
  const p = profile.value
  return p && (passportSeriesNumber.value || p.passport_issued_by || p.place_of_birth || p.residential_address || p.passport_scan_url)
})

const hasPassportData = computed(() => hasMainPassportData.value || extraPassports.value.length > 0)

const extraLicenses = computed(() => {
  const arr = profile.value?.licenses_from_documents
  if (!Array.isArray(arr)) return []
  const mainNumber = (profile.value?.license_number ?? '').trim()
  if (!mainNumber) return arr
  return arr.filter((el: any) => (el.number ?? '').trim() !== mainNumber)
})

const hasMainLicenseData = computed(() => {
  const p = profile.value
  return p && (p.license_number || licenseCategoriesDisplay.value || licenseDatesDisplay.value || p.license_scan_url || p.has_international_license)
})

const hasLicenseData = computed(() => hasMainLicenseData.value || extraLicenses.value.length > 0)

const hasVisaData = computed(() => {
  const p = profile.value
  return p && (p.permission_entry_zone || p.permission_issue_date || p.permission_validity_date || p.visa_scan_url)
})

const hasPermitsData = computed(() => {
  const p = profile.value
  return p && (
    hasVisaData.value ||
    p.medical_certificate ||
    p.last_medical_examination_date ||
    p.medical_certificate_scan_url ||
    p.technical_minimum_certificate ||
    p.tachograph_card_number ||
    p.other_permits ||
    p.hire_source
  )
})

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU')
}

async function loadProfile() {
  if (props.initialProfile) {
    profile.value = props.initialProfile
    return
  }
  loading.value = true
  error.value = null
  try {
    const url = props.isDriverContext
      ? `${apiBase}/cabinet/driver/profile`
      : `${apiBase}/admin/users/${route.params.id}/driver-profile`

    const data = await $fetch<any>(url, { credentials: 'include' })

    const mapped: Record<string, any> = { ...data }
    if (data.citizenship && !data.citizenships) {
      mapped.citizenships = data.citizenship.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    if (data.phone && !data.phones) {
      mapped.phones = data.phone.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    if (data.license_categories && !data.license_categories_arr) {
      mapped.license_categories_arr = data.license_categories.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    profile.value = mapped
  } catch (e: any) {
    console.error('Error loading profile:', e)
    error.value = e?.data?.error || 'Ошибка загрузки профиля'
  } finally {
    loading.value = false
  }
}

function isImageUrl(url: string) {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.gif')
}

function scanFullUrl(path: string) {
  if (!path) return ''
  return path.startsWith('http') ? path : `${apiBase}${path}`
}

function centerModal() {
  if (typeof window === 'undefined') return
  const w = 900
  modalPos.value = {
    x: Math.max(0, (window.innerWidth - w) / 2),
    y: Math.max(0, (window.innerHeight - 700) / 2),
  }
}

function startDrag(e: MouseEvent) {
  dragStart = { x: e.clientX, y: e.clientY, posX: modalPos.value.x, posY: modalPos.value.y }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', stopDrag)
}

function onDragMove(e: MouseEvent) {
  const dx = e.clientX - dragStart.x
  const dy = e.clientY - dragStart.y
  modalPos.value = {
    x: Math.max(0, dragStart.posX + dx),
    y: Math.max(0, dragStart.posY + dy),
  }
}

function stopDrag() {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', stopDrag)
}

function onModalContentMousedown(e: MouseEvent) {
  e.stopPropagation()
}

function closeScanModal() {
  scanModalVisible.value = false
  scanModalUrl.value = null
}

function openScanModal(url: string, title: string) {
  scanModalUrl.value = url
  scanModalTitle.value = title
  centerModal()
  scanModalVisible.value = true
}

watch(() => props.initialProfile, (v) => {
  if (v) profile.value = v
}, { immediate: true })

onMounted(() => {
  if (!props.initialProfile) loadProfile()
})
</script>

<style scoped>
.driver-card-view {
  max-width: 900px;
  margin: 0 auto;
}
.view-content {
  padding: 20px 0;
}
.view-card {
  background: var(--n-color-modal, #fff);
}
.view-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.view-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.view-label {
  font-weight: 600;
  color: var(--n-text-color-3, #666);
  min-width: 180px;
  flex-shrink: 0;
}
.view-value {
  color: var(--n-text-color, #333);
}
.extra-passport-block {
  margin-top: 8px;
  padding-top: 12px;
}
.extra-passport-block--not-first {
  border-top: 1px dashed var(--n-border-color, #e5e7eb);
  margin-top: 16px;
  padding-top: 16px;
}
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }

/* Scan modal (same as DriverCardForm) */
.scan-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.scan-modal-draggable {
  position: fixed;
  width: 90vw;
  max-width: 900px;
  max-height: 90vh;
  background: var(--n-color-modal, #fff);
  border-radius: 8px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10000;
}
.scan-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color, #e5e7eb);
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}
.scan-modal-title {
  font-weight: 600;
  font-size: 16px;
}
.scan-modal-body {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 400px;
  padding: 16px;
}
.scan-modal-img {
  max-width: 100%;
  max-height: calc(90vh - 80px);
  object-fit: contain;
}
.scan-modal-iframe {
  width: 100%;
  min-height: 60vh;
  border: none;
}
.scan-modal-fade-enter-active,
.scan-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.scan-modal-fade-enter-from,
.scan-modal-fade-leave-to {
  opacity: 0;
}
</style>
