<template>
  <div class="change-requests-list">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" style="margin-bottom: 16px">{{ error }}</n-alert>
      <n-space vertical>
        <div class="list-header">
          <n-button type="primary" size="small" @click="showAddModal = true">{{ t('driver.changeRequests.add') }}</n-button>
        </div>
        <n-empty v-if="!loading && list.length === 0" :description="t('driver.changeRequests.noItems')" />
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
                  {{ t('driver.changeRequests.answer') }} {{ r.admin_comment }}
                </p>
                <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.7;">
                  {{ formatDate(r.requested_at) }}
                </p>
              </template>
            </n-thing>
            <template #suffix>
              <n-popconfirm
                v-if="r.status === 'pending'"
                :positive-text="t('driver.changeRequests.revoke')"
                :negative-text="t('common.cancel')"
                @positive-click="doCancel(r.id)"
              >
                <template #trigger>
                  <n-button quaternary size="small">{{ t('driver.changeRequests.revoke') }}</n-button>
                </template>
                {{ t('driver.changeRequests.revokeConfirm') }}
              </n-popconfirm>
            </template>
          </n-list-item>
        </n-list>
      </n-space>
    </n-spin>

    <n-modal v-model:show="showAddModal" preset="card" :title="t('driver.changeRequests.addModal')" style="max-width: 450px">
      <n-alert type="info" style="margin-bottom: 16px">
        {{ t('driver.changeRequests.alertInfo') }}
      </n-alert>
      <n-form :model="addForm" label-placement="top">
        <n-form-item :label="t('driver.changeRequests.changeType')" required>
          <n-select v-model:value="addForm.field_key" :options="fieldKeyOptions" :placeholder="t('driver.documents.select')" />
        </n-form-item>
        <n-form-item :label="t('driver.changeRequests.reason')" required>
          <n-input v-model:value="addForm.reason" type="textarea" :placeholder="t('driver.changeRequests.reasonPlaceholder')" :rows="3" />
        </n-form-item>
        <n-form-item :label="t('driver.changeRequests.desiredValue')">
          <n-input v-model:value="addForm.requested_value" :placeholder="t('driver.changeRequests.desiredValuePlaceholder')" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" :loading="adding" @click="doAdd">{{ t('driver.changeRequests.submit') }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t } = useI18n()
const { list, loading, error, fetch, create, cancel } = useDriverChangeRequests()
const message = useMessage()
const showAddModal = ref(false)
const adding = ref(false)
const addForm = reactive({ field_key: 'surname', reason: '', requested_value: '' })

const fieldKeyOptions = computed(() => [
  { label: t('driver.changeRequests.fieldSurname'), value: 'surname' },
  { label: t('driver.changeRequests.fieldGivenName'), value: 'given_name' },
  { label: t('driver.changeRequests.fieldPatronymic'), value: 'patronymic' },
  { label: t('driver.changeRequests.fieldDateOfBirth'), value: 'date_of_birth' },
  { label: t('driver.changeRequests.fieldGender'), value: 'gender' },
  { label: t('driver.changeRequests.fieldPassportAdd'), value: 'passport:add' },
  { label: t('driver.changeRequests.fieldPassportRenew'), value: 'passport:renew' },
  { label: t('driver.changeRequests.fieldDriversLicenseRenew'), value: 'drivers_license:renew' },
  { label: t('driver.changeRequests.fieldMedicalRenew'), value: 'medical_certificate:renew' },
  { label: t('driver.changeRequests.fieldMedicalAdd'), value: 'medical_certificate:add' },
  { label: t('driver.changeRequests.fieldVisaAdd'), value: 'visa:add' },
  { label: t('driver.changeRequests.fieldTachographAdd'), value: 'tachograph_card:add' },
  { label: t('driver.changeRequests.fieldTechMinAdd'), value: 'technical_minimum_cert:add' },
  { label: t('driver.changeRequests.fieldAdrAdd'), value: 'adr_certificate:add' },
  { label: t('driver.changeRequests.fieldInsuranceAdd'), value: 'insurance:add' },
  { label: t('driver.changeRequests.fieldEntryPermitAdd'), value: 'entry_permit:add' },
  { label: t('driver.changeRequests.fieldCitizenshipAdd'), value: 'citizenship:add' },
  { label: t('driver.changeRequests.fieldCitizenshipRevoke'), value: 'citizenship:revoke' },
  { label: t('driver.changeRequests.fieldIdentityCorrection'), value: 'identity_correction' },
])

const FIELD_LABELS = computed((): Record<string, string> => ({
  surname: t('driver.changeRequests.fieldSurname'),
  given_name: t('driver.changeRequests.fieldGivenName'),
  passport: t('driver.changeRequests.fieldPassport'),
  'passport:add': t('driver.changeRequests.fieldPassportAdd'),
  'passport:renew': t('driver.changeRequests.fieldPassportRenew'),
  'drivers_license:renew': t('driver.changeRequests.fieldDriversLicenseRenew'),
  'medical_certificate:renew': t('driver.changeRequests.fieldMedicalRenew'),
  'medical_certificate:add': t('driver.changeRequests.fieldMedicalAdd'),
  'visa:add': t('driver.changeRequests.fieldVisaAdd'),
  'tachograph_card:add': t('driver.changeRequests.fieldTachographAdd'),
  'technical_minimum_cert:add': t('driver.changeRequests.fieldTechMinAdd'),
  'adr_certificate:add': t('driver.changeRequests.fieldAdrAdd'),
  'citizenship:add': t('driver.changeRequests.fieldCitizenshipAdd'),
  'citizenship:revoke': t('driver.changeRequests.fieldCitizenshipRevoke'),
}))

function fieldLabel(key: string) {
  return FIELD_LABELS.value[key] || key
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    pending: t('driver.changeRequests.statusPending'),
    approved: t('driver.changeRequests.statusApproved'),
    rejected: t('driver.changeRequests.statusRejected'),
    cancelled: t('driver.changeRequests.statusCancelled'),
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
    message.error(t('driver.changeRequests.specifyReason'))
    return
  }
  adding.value = true
  try {
    await create({
      field_key: addForm.field_key,
      reason: addForm.reason.trim(),
      requested_value: addForm.requested_value?.trim() || undefined,
    })
    message.success(t('driver.changeRequests.submitted'))
    showAddModal.value = false
    addForm.reason = ''
    addForm.requested_value = ''
  } catch (e: any) {
    message.error(e?.data?.error || t('common.error'))
  } finally {
    adding.value = false
  }
}

async function doCancel(id: string) {
  try {
    await cancel(id)
    message.success(t('driver.changeRequests.revoked'))
  } catch (e: any) {
    message.error(e?.data?.error || t('common.error'))
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
