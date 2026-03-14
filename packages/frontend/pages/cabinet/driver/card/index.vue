<template>
  <div>
    <n-h3 style="margin: 0 0 20px 0;">Карточка водителя</n-h3>
    <DriverCardForm
      ref="formRef"
      :load-url="loadUrl"
      :save-url="saveUrl"
      save-method="PATCH"
      :api-base="apiBase"
      :active-tab="activeTab"
      :is-driver-context="true"
      @update:active-tab="onTabChange"
      @saved="onFormSaved"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

useSeoMeta({ title: 'Карточка водителя — BridgeCore Systems' })

const route = useRoute()
const router = useRouter()
const { apiBase } = useApiBase()
const { fetchStatus: refreshVerification } = useDriverVerificationStatus()
const { fetchAlerts } = useDriverAlerts()
const formRef = ref<{ loadProfile: () => Promise<void>; handleSave: () => Promise<void> } | null>(null)

const loadUrl = computed(() => `${apiBase}/cabinet/driver/profile`)
const saveUrl = computed(() => `${apiBase}/cabinet/driver/profile`)

const tabNames = ['main', 'passport', 'license', 'permits'] as const
const activeTab = ref<string>(
  (route.query.tab as string) && tabNames.includes(route.query.tab as any) ? (route.query.tab as string) : 'main'
)
watch(() => route.query.tab, (tab) => {
  if (tab && tabNames.includes(tab as any)) activeTab.value = tab
})

function onTabChange(name: string) {
  if (route.query.tab !== name) {
    router.replace({ query: { ...route.query, tab: name } })
  }
}

function onFormSaved() {
  refreshVerification()
  fetchAlerts()
}

onMounted(() => {
  formRef.value?.loadProfile()
})
</script>
