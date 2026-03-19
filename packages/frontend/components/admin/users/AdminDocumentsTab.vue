<template>
  <div>
    <n-tabs v-model:value="filter" type="line">
      <n-tab-pane name="pending_verification" :tab="t('admin.docsPending')" />
      <n-tab-pane name="all" :tab="t('admin.docsAll')" />
    </n-tabs>

    <n-spin :show="loading">
      <n-empty v-if="!loading && filtered.length === 0" :description="t('admin.docsNone')" style="margin-top: 24px" />

      <n-list v-else bordered style="margin-top: 12px">
        <n-list-item v-for="doc in filtered" :key="doc.id">
          <n-thing>
            <template #header>
              <n-space align="center">
                <span>{{ docTypeLabel(doc.doc_type) }}</span>
                <n-tag :type="statusTagType(doc.status)" size="small">{{ statusLabel(doc.status) }}</n-tag>
              </n-space>
            </template>
            <template #description>
              <n-space size="small" style="flex-wrap: wrap; margin-top: 4px">
                <n-text v-if="doc.series || doc.number" depth="2" style="font-size: 13px">
                  {{ [doc.series, doc.number].filter(Boolean).join(' ') }}
                </n-text>
                <n-text v-if="doc.country" depth="2" style="font-size: 13px">{{ doc.country }}</n-text>
                <n-text v-if="doc.issued_at" depth="3" style="font-size: 12px">{{ t('driver.documents.issueDate') }}: {{ doc.issued_at }}</n-text>
                <n-text v-if="doc.expires_at" depth="3" style="font-size: 12px">{{ t('driver.documents.expiryDate') }}: {{ doc.expires_at }}</n-text>
                <n-text v-if="doc.issued_by" depth="3" style="font-size: 12px">{{ doc.issued_by }}</n-text>
              </n-space>
              <div v-if="doc.scan_url" style="margin-top: 6px">
                <n-button text size="small" type="info" @click="openScan(doc.scan_url)">
                  {{ t('driver.documents.viewScan') }}
                </n-button>
              </div>
            </template>
          </n-thing>
          <template #suffix>
            <n-space v-if="doc.status === 'pending_verification'">
              <n-button
                type="success"
                size="small"
                :loading="actionId === doc.id + ':approve'"
                @click="doVerify(doc.id, 'active')"
              >
                {{ t('admin.approve') }}
              </n-button>
              <n-button
                type="error"
                quaternary
                size="small"
                :loading="actionId === doc.id + ':reject'"
                @click="doVerify(doc.id, 'rejected')"
              >
                {{ t('admin.reject') }}
              </n-button>
            </n-space>
          </template>
        </n-list-item>
      </n-list>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { NTabs, NTabPane, NSpin, NEmpty, NList, NListItem, NThing, NSpace, NTag, NButton, NText, useMessage } from 'naive-ui'

const { t } = useI18n()
const { apiBase } = useApiBase()
const message = useMessage()

const props = defineProps<{ userId: string }>()

function openScan(path: string) {
  const url = path.startsWith('http') ? path : `${apiBase}${path}`
  window.open(url, '_blank')
}

const docs = ref<any[]>([])
const loading = ref(false)
const actionId = ref<string | null>(null)
const filter = ref<'pending_verification' | 'all'>('pending_verification')

const filtered = computed(() =>
  filter.value === 'all' ? docs.value : docs.value.filter((d) => d.status === 'pending_verification')
)

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: 'driver.documents.docTypePassport',
  drivers_license: 'driver.documents.docTypeDriversLicense',
  international_drivers_license: 'driver.documents.docTypeIntlLicense',
  medical_certificate: 'driver.documents.docTypeMedical',
  insurance: 'driver.documents.docTypeInsurance',
  visa: 'driver.documents.docTypeVisa',
  tachograph_card: 'driver.documents.docTypeTachograph',
  technical_minimum_cert: 'driver.documents.docTypeTechMin',
  adr_certificate: 'driver.documents.docTypeAdr',
  entry_permit: 'driver.documents.docTypeEntryPermit',
  other: 'driver.documents.docTypeOther',
}

function docTypeLabel(type: string) {
  return DOC_TYPE_LABELS[type] ? t(DOC_TYPE_LABELS[type]) : type
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    active: 'admin.docsStatusActive',
    pending_verification: 'admin.docsStatusPending',
    rejected: 'admin.docsStatusRejected',
    revoked: 'admin.docsStatusRevoked',
  }
  return m[s] ? t(m[s]) : s
}

function statusTagType(s: string) {
  if (s === 'active') return 'success'
  if (s === 'pending_verification') return 'warning'
  if (s === 'rejected') return 'error'
  return 'default'
}

async function loadDocs() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${apiBase}/admin/users/${props.userId}/documents`, { credentials: 'include' })
    docs.value = Array.isArray(data) ? data : []
  } catch {
    docs.value = []
  } finally {
    loading.value = false
  }
}

async function doVerify(docId: string, status: 'active' | 'rejected') {
  actionId.value = `${docId}:${status === 'active' ? 'approve' : 'reject'}`
  try {
    await $fetch(`${apiBase}/admin/users/${props.userId}/documents/${docId}/status`, {
      method: 'PATCH',
      credentials: 'include',
      body: { status },
    })
    message.success(status === 'active' ? t('admin.docsApproveSuccess') : t('admin.docsRejectSuccess'))
    await loadDocs()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    actionId.value = null
  }
}

onMounted(loadDocs)
defineExpose({ loadDocs })
</script>
