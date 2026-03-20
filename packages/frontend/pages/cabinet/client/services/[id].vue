<template>
  <div>
    <UiBackBtn to="/cabinet/client/services" />

    <n-card v-if="service" :title="t('client.services.serviceDetails')">
      <n-descriptions :column="1" bordered>
        <n-descriptions-item :label="t('client.services.route')">{{ service.from_city }} → {{ service.to_city }}</n-descriptions-item>
        <n-descriptions-item :label="t('client.services.transport')">{{ service.vehicle_plate }} ({{ service.vehicle_type || '—' }})</n-descriptions-item>
        <n-descriptions-item :label="t('client.services.company')">{{ service.company_name || '—' }}</n-descriptions-item>
        <n-descriptions-item :label="t('client.services.description')">{{ service.description || '—' }}</n-descriptions-item>
        <n-descriptions-item :label="t('client.services.price')">{{ service.price }} {{ service.currency }}</n-descriptions-item>
      </n-descriptions>
    </n-card>

    <div v-else-if="!loading" style="padding: 40px; text-align: center">
      <n-empty :description="t('client.services.serviceNotFound')" />
    </div>
    <div v-else style="padding: 40px; text-align: center">
      <n-spin size="large" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'cabinet-client',  })

const { apiBase: API } = useApiBase()
const route = useRoute()
const service = ref<any>(null)
const loading = ref(true)

async function loadService() {
  try {
    service.value = await $fetch<any>(`${API}/cabinet/client/services/${route.params.id}`, { credentials: 'include' })
  } catch {
    service.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadService)
</script>
