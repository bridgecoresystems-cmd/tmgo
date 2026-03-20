<template>
  <div>
    <n-h3 style="margin: 0 0 20px 0;">{{ t('driver.card.title') }}</n-h3>
    <DriverProfileVerificationStatus />
    <n-tabs v-model:value="mainTab" type="line" animated class="card-tabs">
      <n-tab-pane name="my-card" :tab="t('driver.card.myCard')">
        <DriverCardView :is-driver-context="true" />
      </n-tab-pane>
      <n-tab-pane name="profile" :tab="t('driver.card.profileOld')">
        <DriverCardForm
          ref="formRef"
          :load-url="loadUrl"
          :save-url="saveUrl"
          save-method="PATCH"
          :api-base="apiBase"
          :active-tab="profileSubTab"
          :is-driver-context="true"
          @update:active-tab="onProfileSubTabChange"
          @saved="onFormSaved"
        />
      </n-tab-pane>
      <n-tab-pane name="profile-v2" :tab="t('driver.card.profileV2')">
        <DriverCardV2 :is-driver-context="true" @submitted="onFormSaved" @saved="onFormSaved" />
      </n-tab-pane>
      <n-tab-pane name="documents" :tab="t('driver.documents.tabDocuments')">
        <DriverDocumentsList ref="documentsRef" />
      </n-tab-pane>
      <n-tab-pane name="citizenships" :tab="t('driver.documents.tabCitizenships')">
        <DriverCitizenshipsList ref="citizenshipsRef" />
      </n-tab-pane>
      <n-tab-pane name="contacts" :tab="t('driver.contacts.title')">
        <DriverContactsList ref="contactsRef" />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver',  })

useSeoMeta({ title: t('driver.card.pageTitle') })

const route = useRoute()
const router = useRouter()
const { apiBase } = useApiBase()
const { fetchStatus: refreshVerification } = useDriverVerificationStatus()
const { fetchAlerts } = useDriverAlerts()
const formRef = ref<{ loadProfile: () => Promise<void>; handleSave: () => Promise<void> } | null>(null)
const documentsRef = ref<{ fetch: (showHistory?: boolean) => void } | null>(null)
const citizenshipsRef = ref<{ fetch: () => void } | null>(null)
const contactsRef = ref<{ fetch: () => void } | null>(null)

const loadUrl = computed(() => `${apiBase}/cabinet/driver/profile`)
const saveUrl = computed(() => `${apiBase}/cabinet/driver/profile`)

const mainTabNames = ['my-card', 'profile', 'profile-v2', 'documents', 'citizenships', 'contacts'] as const
const mainTab = ref<string>(
  (route.query.tab as string) && mainTabNames.includes(route.query.tab as any)
    ? (route.query.tab as string)
    : 'my-card'
)

const profileSubTabNames = ['main', 'passport', 'license', 'permits'] as const
const profileSubTab = ref<string>(
  (route.query.subtab as string) && profileSubTabNames.includes(route.query.subtab as any)
    ? (route.query.subtab as string)
    : 'main'
)

watch(
  () => route.query.tab,
  (tab) => {
    if (tab && mainTabNames.includes(tab as any)) mainTab.value = tab
  }
)
watch(
  () => route.query.subtab,
  (subtab) => {
    if (subtab && profileSubTabNames.includes(subtab as any)) profileSubTab.value = subtab
  }
)

watch(mainTab, (name) => {
  if (route.query.tab !== name) {
    router.replace({ query: { ...route.query, tab: name } })
  }
})

function onProfileSubTabChange(name: string) {
  profileSubTab.value = name
  if (route.query.subtab !== name) {
    router.replace({ query: { ...route.query, subtab: name } })
  }
}

function onFormSaved() {
  refreshVerification()
  fetchAlerts()
  documentsRef.value?.fetch()
  citizenshipsRef.value?.fetch()
  contactsRef.value?.fetch()
}

onMounted(() => {
  formRef.value?.loadProfile()
})
</script>

<style scoped>
.card-tabs {
  margin-top: 16px;
}
</style>
