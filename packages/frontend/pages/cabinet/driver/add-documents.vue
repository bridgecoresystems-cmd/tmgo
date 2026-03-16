<template>
  <div>
    <div class="page-header mb-24">
      <n-h2 style="margin: 0;">Добавить документы</n-h2>
      <n-text depth="3">
        Добавляйте гражданства, контакты и документы. После одобрения администратором они появятся в вашей карточке.
      </n-text>
    </div>

    <n-alert type="info" class="mb-16">
      Для добавления паспорта или гражданства после верификации нужен одобренный запрос. Создайте запрос во вкладке
      <strong>«Запросы на изменение»</strong>, дождитесь одобрения администратором, затем добавьте документ.
    </n-alert>

    <n-tabs v-model:value="activeTab" type="line" animated class="add-docs-tabs">
      <n-tab-pane name="citizenships" tab="Гражданства">
        <n-card embedded>
          <DriverCitizenshipsList ref="citizenshipsRef" />
        </n-card>
      </n-tab-pane>
      <n-tab-pane name="contacts" tab="Телефоны и Email">
        <n-card embedded>
          <DriverContactsList ref="contactsRef" />
        </n-card>
      </n-tab-pane>
      <n-tab-pane name="documents" tab="Документы">
        <n-card embedded>
          <DriverDocumentsList ref="documentsRef" />
        </n-card>
      </n-tab-pane>
      <n-tab-pane name="change-requests" tab="Запросы на изменение">
        <n-card embedded>
          <DriverChangeRequestsList ref="changeRequestsRef" />
        </n-card>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

useSeoMeta({ title: 'Добавить документы — BridgeCore Systems' })

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
