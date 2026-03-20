<template>
  <div>
    <div class="page-header mb-24">
      <n-h2 style="margin: 0;">{{ t('driver.documents.title') }}</n-h2>
      <n-text depth="3">
        {{ t('driver.documents.subtitle') }}
      </n-text>
    </div>

    <n-alert type="info" class="mb-16">
      {{ t('driver.documents.alertInfo') }}
      <strong>{{ t('driver.documents.alertInfoBold') }}</strong>{{ t('driver.documents.alertInfoSuffix') }}
    </n-alert>

    <n-tabs v-model:value="activeTab" type="line" animated class="add-docs-tabs">
      <n-tab-pane name="citizenships" :tab="t('driver.documents.tabCitizenships')">
        <n-card embedded>
          <DriverCitizenshipsList ref="citizenshipsRef" />
        </n-card>
      </n-tab-pane>
      <n-tab-pane name="contacts" :tab="t('driver.documents.tabContacts')">
        <n-card embedded>
          <DriverContactsList ref="contactsRef" />
        </n-card>
      </n-tab-pane>
      <n-tab-pane name="documents" :tab="t('driver.documents.tabDocuments')">
        <n-card embedded>
          <DriverDocumentsList ref="documentsRef" />
        </n-card>
      </n-tab-pane>
      <n-tab-pane name="change-requests" :tab="t('driver.documents.tabChangeRequests')">
        <n-card embedded>
          <DriverChangeRequestsList ref="changeRequestsRef" />
        </n-card>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver',  })

useSeoMeta({ title: t('driver.documents.pageTitle') })

const route = useRoute()
const router = useRouter()
const tabNames = ['citizenships', 'contacts', 'documents', 'change-requests'] as const
const activeTab = ref<string>(
  (route.query.tab as string) && tabNames.includes(route.query.tab as any)
    ? (route.query.tab as string)
    : 'documents'
)

watch(() => route.query.tab, (tab) => {
  if (tab && tabNames.includes(tab as any)) activeTab.value = tab
})
watch(activeTab, (tab) => {
  if (route.query.tab !== tab) {
    router.replace({ query: { ...route.query, tab } })
  }
})

const citizenshipsRef = ref<{ fetch: () => void } | null>(null)
const contactsRef = ref<{ fetch: () => void } | null>(null)
const documentsRef = ref<{ fetch: (showHistory?: boolean) => void } | null>(null)
const changeRequestsRef = ref<{ fetch: () => void } | null>(null)

onMounted(() => {
  citizenshipsRef.value?.fetch()
  contactsRef.value?.fetch()
  documentsRef.value?.fetch()
  changeRequestsRef.value?.fetch()
})
</script>

<style scoped>
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
.page-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}
.add-docs-tabs {
  margin-top: 16px;
}
</style>
