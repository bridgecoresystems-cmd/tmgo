<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/cabinet/client/services')">← Назад к списку</n-button>

    <n-card v-if="service" title="Услуга перевозчика">
      <n-descriptions :column="1" bordered>
        <n-descriptions-item label="Маршрут">{{ service.from_city }} → {{ service.to_city }}</n-descriptions-item>
        <n-descriptions-item label="Транспорт">{{ service.vehicle_plate }} ({{ service.vehicle_type || '—' }})</n-descriptions-item>
        <n-descriptions-item label="Компания">{{ service.company_name || '—' }}</n-descriptions-item>
        <n-descriptions-item label="Описание">{{ service.description || '—' }}</n-descriptions-item>
        <n-descriptions-item label="Цена">{{ service.price }} {{ service.currency }}</n-descriptions-item>
      </n-descriptions>
    </n-card>

    <div v-else-if="!loading" style="padding: 40px; text-align: center">
      <n-empty description="Услуга не найдена" />
    </div>
    <div v-else style="padding: 40px; text-align: center">
      <n-spin size="large" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-client', middleware: 'cabinet-auth' })

const API = 'http://localhost:8000'
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
