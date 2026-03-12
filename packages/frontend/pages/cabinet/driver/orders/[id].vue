<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/cabinet/driver/orders')">
      ← Назад к списку
    </n-button>

    <n-card v-if="order" title="Заказ">
      <n-descriptions :column="1" bordered>
        <n-descriptions-item label="Маршрут">{{ order.from_city }} → {{ order.to_city }}</n-descriptions-item>
        <n-descriptions-item label="Товар">{{ order.cargo_name || '—' }}</n-descriptions-item>
        <n-descriptions-item label="Описание">{{ order.cargo_description || '—' }}</n-descriptions-item>
        <n-descriptions-item label="Цена">{{ order.price }} {{ order.currency }}</n-descriptions-item>
        <n-descriptions-item label="Транспорт">{{ order.vehicle_plate || '—' }}</n-descriptions-item>
        <n-descriptions-item label="Статус">{{ statusLabels[order.status] || order.status }}</n-descriptions-item>
      </n-descriptions>
      <n-button type="info" style="margin-top: 16px" @click="handleOpenChat">
        💬 Чат с заказчиком
      </n-button>
    </n-card>

    <div v-else-if="!loading" style="padding: 40px; text-align: center">
      <n-empty description="Заказ не найден" />
    </div>

    <div v-else style="padding: 40px; text-align: center">
      <n-spin size="large" />
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const API = 'http://localhost:8000'
const route = useRoute()
const { openChat } = useOrderChat()
const order = ref<any>(null)
const loading = ref(true)

function handleOpenChat() {
  openChat(order.value?.id || null, 'Заказчик')
}
const statusLabels: Record<string, string> = {
  PENDING: 'Ожидание', ACCEPTED: 'Принят', IN_TRANSIT: 'В пути', DELIVERED: 'Доставлен', CANCELLED: 'Отменён',
}

async function loadOrder() {
  try {
    order.value = await $fetch<any>(`${API}/cabinet/driver/orders/${route.params.id}`, { credentials: 'include' })
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadOrder)
</script>
