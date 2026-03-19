<template>
  <div class="documents-list">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" style="margin-bottom: 16px">{{ error }}</n-alert>
      <n-space vertical>
        <div class="documents-header">
          <n-checkbox v-model:checked="showHistory">{{ t('driver.documents.showHistory') }}</n-checkbox>
          <n-button type="primary" size="small" @click="fetch()">{{ t('driver.documents.refresh') }}</n-button>
          <n-button type="primary" size="small" @click="showAddModal = true">{{ t('driver.documents.addDocument') }}</n-button>
        </div>
        <n-empty v-if="!loading && docs.length === 0" :description="t('driver.documents.noDocuments')" />
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
                  <n-descriptions-item v-if="doc.doc_type === 'visa' && doc.country" :label="t('driver.documents.issueCountry')">{{ displayCountry(doc.country) }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'visa' && doc.number" :label="t('driver.documents.visaNum')">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'medical_certificate' && doc.number" :label="t('driver.documents.medicalNum')">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'tachograph_card' && doc.country" :label="t('driver.documents.issueCountry')">{{ displayCountry(doc.country) }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'tachograph_card' && doc.number" :label="t('driver.documents.tachographNum')">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'technical_minimum_cert' && doc.issued_by" :label="t('driver.documents.techMinInstitution')">{{ doc.issued_by }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'technical_minimum_cert' && doc.number" :label="t('driver.documents.techMinCertNum')">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'drivers_license' && doc.number" :label="t('driver.documents.licenseNum')">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'drivers_license' && doc.license_categories" :label="t('driver.documents.licenseCategories')">{{ doc.license_categories }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'adr_certificate' && doc.issued_by" :label="t('driver.documents.adrIssuedBy')">{{ doc.issued_by }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'adr_certificate' && doc.number" :label="t('driver.documents.adrCertNum')">{{ doc.number }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'adr_certificate'" :label="t('driver.documents.allowedClasses')">{{ formatAdrClassesForDoc(doc) }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'passport' && doc.place_of_birth" :label="t('driver.documents.placeOfBirth')">{{ doc.place_of_birth }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.doc_type === 'passport' && doc.residential_address" :label="t('driver.documents.residentialAddress')">{{ doc.residential_address }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.issued_at" :label="issuedAtLabel(doc.doc_type)">{{ doc.issued_at }}</n-descriptions-item>
                  <n-descriptions-item v-if="doc.expires_at" :label="expiresAtLabel(doc.doc_type)">{{ doc.expires_at }}</n-descriptions-item>
                </n-descriptions>
                <div v-if="doc.scan_url" class="scan-link">
                  <n-button text type="primary" size="small" @click="openScan(doc.scan_url)">
                    {{ t('driver.card.viewScan') }}
                  </n-button>
                </div>
                <div class="doc-actions">
                  <UiDeleteBtn
                    v-if="canDelete(doc)"
                    size="tiny"
                    :confirm-text="t('driver.documents.deleteDocument')"
                    @confirm="doRemove(doc.id)"
                  />
                </div>
              </n-card>
            </n-space>
          </div>
        </div>
      </n-space>
    </n-spin>

    <n-modal v-model:show="showAddModal" preset="card" :title="t('driver.documents.addDocumentModal')" style="max-width: 500px">
      <n-form ref="addFormRef" :model="addForm" label-placement="top">
        <n-form-item :label="t('driver.documents.docType')" required>
          <n-select v-model:value="addForm.doc_type" :options="docTypeOptions" :placeholder="t('driver.documents.select')" :render-label="renderDocTypeOption" />
        </n-form-item>

        <!-- Medical certificate -->
        <template v-if="isMedicalForm">
          <n-form-item :label="t('driver.documents.medicalNum')">
            <n-input v-model:value="addForm.number" :placeholder="t('driver.documents.placeholderMedicalNum')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.issueDate')">
            <n-date-picker
              :value="addForm.issued_at ? new Date(addForm.issued_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.expiryDate')">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.medicalScan')">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? t('driver.card.uploaded') : t('driver.card.uploadFile') }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Tech minimum cert -->
        <template v-else-if="isTechMinForm">
          <n-form-item :label="t('driver.documents.techMinInstitution')">
            <n-input v-model:value="addForm.issued_by" :placeholder="t('driver.documents.placeholderTechMinInstitution')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.techMinCertNum')">
            <n-input v-model:value="addForm.number" :placeholder="t('driver.documents.placeholderTechMinNum')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.receiptDate')">
            <n-date-picker
              :value="addForm.issued_at ? new Date(addForm.issued_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.expiryDate')">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.docScan')">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? t('driver.card.uploaded') : t('driver.card.uploadFile') }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Tachograph card -->
        <template v-else-if="isTachographForm">
          <n-form-item :label="t('driver.documents.tachographNum')">
            <n-input v-model:value="addForm.number" :placeholder="t('driver.documents.placeholderTachographNum')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.issueCountry')">
            <n-select v-model:value="addForm.country" :options="visaCountryOptions" :placeholder="t('common.selectCity')" filterable />
          </n-form-item>
          <n-form-item :label="t('driver.documents.issueDate')">
            <n-date-picker
              :value="addForm.issued_at ? new Date(addForm.issued_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.expiryDate')">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.docScan')">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? t('driver.card.uploaded') : t('driver.card.uploadFile') }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- ADR certificate -->
        <template v-else-if="isAdrForm">
          <n-form-item :label="t('driver.documents.adrIssuedBy')">
            <n-input v-model:value="addForm.issued_by" :placeholder="t('driver.documents.placeholderAdrIssuedBy')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.adrCertNum')">
            <n-input v-model:value="addForm.number" :placeholder="t('driver.documents.placeholderAdrNum')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.allowedClasses')">
            <n-checkbox-group v-model:value="addForm.allowed_classes">
              <n-space vertical size="small">
                <n-checkbox v-for="c in adrClasses" :key="c.value" :value="c.value" :label="t('adrClasses.' + c.value)" />
              </n-space>
            </n-checkbox-group>
          </n-form-item>
          <n-form-item :label="t('driver.documents.issueDate')">
            <n-date-picker
              :value="addForm.issued_at ? new Date(addForm.issued_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.expiryDate')">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.docScan')">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? t('driver.card.uploaded') : t('driver.card.uploadFile') }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Driver's license -->
        <template v-else-if="isDriversLicenseForm">
          <n-form-item :label="t('driver.documents.licenseNum')" required>
            <n-input v-model:value="addForm.number" :placeholder="t('driver.documents.placeholderLicenseNum')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.licenseCategories')">
            <n-checkbox-group v-model:value="addForm.license_categories_arr">
              <n-space>
                <n-checkbox v-for="c in licenseCategories" :key="c.value" :value="c.value" :label="c.label" />
              </n-space>
            </n-checkbox-group>
          </n-form-item>
          <n-form-item :label="t('driver.documents.issueDate')">
            <n-date-picker
              :value="addForm.issued_at ? new Date(addForm.issued_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.expiryDate')">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.licenseScan')">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? t('driver.card.uploaded') : t('driver.card.uploadFile') }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Visa -->
        <template v-else-if="isVisaForm">
          <n-form-item :label="t('driver.documents.issueCountry')" required>
            <n-select v-model:value="addForm.country" :options="visaCountryOptions" :placeholder="t('driver.documents.selectVisaCountry')" filterable />
          </n-form-item>
          <n-form-item :label="t('driver.documents.visaNum')" required>
            <n-input v-model:value="addForm.number" :placeholder="t('driver.documents.placeholderNumber')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.startDate')">
            <n-date-picker
              :value="addForm.issued_at ? new Date(addForm.issued_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.expiryDate')">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.docScan')">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? t('driver.card.uploaded') : t('driver.card.uploadFile') }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Passport -->
        <template v-else-if="isPassportForm">
          <n-form-item :label="t('driver.documents.series')">
            <n-input v-model:value="addForm.series" :placeholder="t('driver.documents.placeholderSeries')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.number')">
            <n-input v-model:value="addForm.number" :placeholder="t('driver.documents.placeholderNumber')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.issuedBy')">
            <n-input v-model:value="addForm.issued_by" :placeholder="t('driver.documents.placeholderOvd')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.placeOfBirth')">
            <n-input v-model:value="addForm.place_of_birth" :placeholder="t('driver.documents.placeholderCity')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.residentialAddress')">
            <n-input v-model:value="addForm.residential_address" :placeholder="t('driver.documents.placeholderAddress')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.issueDate')">
            <n-date-picker
              :value="addForm.issued_at ? new Date(addForm.issued_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.validUntil')">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.passportScan')">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? t('driver.card.uploaded') : t('driver.card.uploadFile') }}</n-button>
            </n-upload>
          </n-form-item>
        </template>

        <!-- Generic fallback -->
        <template v-else>
          <n-form-item :label="t('driver.documents.series')">
            <n-input v-model:value="addForm.series" :placeholder="t('driver.documents.placeholderSeries')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.number')">
            <n-input v-model:value="addForm.number" :placeholder="t('driver.documents.placeholderNumber')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.issuedBy')">
            <n-input v-model:value="addForm.issued_by" :placeholder="t('driver.documents.placeholderOvd')" />
          </n-form-item>
          <n-form-item :label="t('driver.documents.issueDate')">
            <n-date-picker
              :value="addForm.issued_at ? new Date(addForm.issued_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.issued_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.validUntil')">
            <n-date-picker
              :value="addForm.expires_at ? new Date(addForm.expires_at).getTime() : null"
              type="date"
              clearable
              style="width: 100%"
              @update:value="(v: number | null) => { addForm.expires_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
            />
          </n-form-item>
          <n-form-item :label="t('driver.documents.docScan')">
            <n-upload :max="1" :custom-request="handleUpload" :show-file-list="false">
              <n-button size="small">{{ addForm.scan_url ? t('driver.card.uploaded') : t('driver.card.uploadFile') }}</n-button>
            </n-upload>
          </n-form-item>
          <n-form-item :label="t('driver.documents.notes')">
            <n-input v-model:value="addForm.notes" type="textarea" :placeholder="t('driver.documents.optional')" />
          </n-form-item>
        </template>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" :loading="adding" @click="doAdd">{{ t('common.add') }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { useMessage } from 'naive-ui'
import { visaCountries, adrClasses, licenseCategories } from '@tmgo/shared'

const { t } = useI18n()
const { apiBase } = useApiBase()
const { docs, loading, error, fetch, upload, create, remove } = useDriverDocuments()
const { unlocked, fetchUnlocked } = useDriverChangeRequests()

// doc_type → change_request field_key (должно совпадать с backend)
const DOC_TYPE_TO_CHANGE_KEY: Record<string, string> = {
  passport: 'passport:add',
  drivers_license: 'drivers_license:renew',
  international_drivers_license: 'drivers_license:renew',
  visa: 'visa:add',
  medical_certificate: 'medical_certificate:add',
  tachograph_card: 'tachograph_card:add',
  technical_minimum_cert: 'technical_minimum_cert:add',
  adr_certificate: 'adr_certificate:add',
  insurance: 'insurance:add',
  entry_permit: 'entry_permit:add',
}

function isDocTypeAllowed(docType: string) {
  const key = DOC_TYPE_TO_CHANGE_KEY[docType]
  if (!key) return true // 'other' — без ограничений
  return unlocked.value.unlocked_keys.includes(key)
}

function renderDocTypeOption(option: { label: string; value: string }) {
  const allowed = isDocTypeAllowed(option.value)
  const expires = DOC_TYPE_TO_CHANGE_KEY[option.value]
    ? unlocked.value.expires_at[DOC_TYPE_TO_CHANGE_KEY[option.value]]
    : null
  return h('span', {
    style: { color: allowed ? '#18a058' : '#d03050', fontStyle: allowed ? 'normal' : 'italic' },
  }, allowed
    ? `${option.label} — ${t('driver.changeRequests.allowed')}${expires ? ` (${t('driver.changeRequests.until')} ${expires})` : ''}`
    : `${option.label} — ${t('driver.changeRequests.forbidden')}`
  )
}
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
  visaCountries.map((c) => ({ label: t('visaCountries.' + c), value: c }))
)

const isVisaForm = computed(() => addForm.doc_type === 'visa')
const isMedicalForm = computed(() => addForm.doc_type === 'medical_certificate')
const isTachographForm = computed(() => addForm.doc_type === 'tachograph_card')
const isTechMinForm = computed(() => addForm.doc_type === 'technical_minimum_cert')
const isAdrForm = computed(() => addForm.doc_type === 'adr_certificate')
const isDriversLicenseForm = computed(() => addForm.doc_type === 'drivers_license')
const isPassportForm = computed(() => addForm.doc_type === 'passport')

const docTypeOptions = computed(() => [
  { label: t('driver.documents.docTypeMedical'), value: 'medical_certificate' },
  { label: t('driver.documents.docTypeInsurance'), value: 'insurance' },
  { label: t('driver.documents.docTypeVisa'), value: 'visa' },
  { label: t('driver.documents.docTypePassport'), value: 'passport' },
  { label: t('driver.documents.docTypeDriversLicense'), value: 'drivers_license' },
  { label: t('driver.documents.docTypeIntlLicense'), value: 'international_drivers_license' },
  { label: t('driver.documents.docTypeTachograph'), value: 'tachograph_card' },
  { label: t('driver.documents.docTypeTechMin'), value: 'technical_minimum_cert' },
  { label: t('driver.documents.docTypeAdr'), value: 'adr_certificate' },
])

const DOC_TYPE_LABELS = computed((): Record<string, string> => ({
  passport: t('driver.documents.docTypePassport'),
  drivers_license: t('driver.documents.docTypeDriversLicense'),
  medical_certificate: t('driver.documents.docTypeMedical'),
  insurance: t('driver.documents.docTypeInsurance'),
  visa: t('driver.documents.docTypeVisa'),
  tachograph_card: t('driver.documents.docTypeTachograph'),
  technical_minimum_cert: t('driver.documents.docTypeTechMin'),
  adr_certificate: t('driver.documents.docTypeAdr'),
}))

const groupedDocs = computed(() => {
  const byType: Record<string, any[]> = {}
  for (const d of docs.value) {
    const dt = d.doc_type || 'unknown'
    if (!byType[dt]) byType[dt] = []
    byType[dt].push(d)
  }
  return byType
})

function docTypeLabel(type: string) {
  return DOC_TYPE_LABELS.value[type] || type
}

function displayCountry(key: string) {
  const translated = t('visaCountries.' + key)
  return translated !== 'visaCountries.' + key ? translated : key
}

function formatAdrClassesForDoc(doc: any) {
  const arr = Array.isArray(doc.allowed_classes) && doc.allowed_classes.length
    ? doc.allowed_classes
    : (doc.license_categories ? doc.license_categories.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  if (!arr.length) return '—'
  return arr.map((v: string) => t('adrClasses.' + v) || v).join(', ')
}

function issuedAtLabel(docType: string) {
  if (docType === 'visa') return t('driver.documents.startDate')
  if (docType === 'technical_minimum_cert') return t('driver.documents.receiptDate')
  return t('driver.documents.issueDate')
}

function expiresAtLabel(docType: string) {
  if (docType === 'passport') return t('driver.documents.validUntil')
  return t('driver.documents.expiryDate')
}

function docHeaderText(doc: any) {
  if (doc.doc_type === 'visa') {
    const country = doc.country ? displayCountry(doc.country) : null
    const parts = [country, doc.number].filter(Boolean)
    return parts.length ? parts.join(' — ') : '—'
  }
  if (doc.doc_type === 'medical_certificate') {
    return doc.number ? `№ ${doc.number}` : '—'
  }
  if (doc.doc_type === 'tachograph_card') {
    const country = doc.country ? displayCountry(doc.country) : null
    const parts = [country, doc.number].filter(Boolean)
    return parts.length ? parts.join(' — ') : '—'
  }
  if (doc.doc_type === 'technical_minimum_cert') {
    return doc.number ? `№ ${doc.number}` : doc.issued_by || '—'
  }
  if (doc.doc_type === 'adr_certificate') {
    return doc.number ? `№ ${doc.number}` : doc.issued_by || '—'
  }
  if (doc.doc_type === 'drivers_license') {
    return doc.number ? `${t('driver.documents.licenseNum')} № ${doc.number}` : '—'
  }
  const s = doc.series || doc.number ? `${doc.series || ''} ${doc.number || ''}`.trim() : ''
  return s || '—'
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    active: t('driver.documents.statusActive'),
    pending_verification: t('driver.documents.statusPendingVerification'),
    expired: t('driver.documents.statusExpired'),
    revoked: t('driver.documents.statusRevoked'),
    superseded: t('driver.documents.statusSuperseded'),
    rejected: t('driver.documents.statusRejected'),
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
    message.success(t('driver.documents.documentDeleted'))
  } catch (e: any) {
    message.error(e?.data?.error || t('common.error'))
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
    message.error(e?.data?.error || t('driver.profile.uploadError'))
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
    message.error(t('driver.documents.selectDocType'))
    return
  }
  if (isVisaForm.value && !addForm.country) {
    message.error(t('driver.documents.selectVisaCountry'))
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
    message.success(t('driver.documents.documentAdded'))
    showAddModal.value = false
    resetAddForm()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.error'))
  } finally {
    adding.value = false
  }
}

watch(showHistory, () => fetch(showHistory.value))
onMounted(() => { fetch(showHistory.value); fetchUnlocked() })

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
