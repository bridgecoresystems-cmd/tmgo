<template>
  <div>
    <UiBackBtn to="/cabinet/driver/orders" />

    <n-card v-if="order" :title="t('driver.orders.order')">
      <n-descriptions :column="1" bordered>
        <n-descriptions-item :label="t('driver.orders.route')">{{ order.from_city }} → {{ order.to_city }}</n-descriptions-item>
        <n-descriptions-item :label="t('driver.orders.cargo')">{{ order.cargo_name || '—' }}</n-descriptions-item>
        <n-descriptions-item :label="t('driver.orders.cargoDescription')">{{ order.cargo_description || '—' }}</n-descriptions-item>
        <n-descriptions-item :label="t('common.price')">{{ order.price }} {{ order.currency }}</n-descriptions-item>
        <n-descriptions-item :label="t('common.transport')">{{ order.vehicle_plate || '—' }}</n-descriptions-item>
        <n-descriptions-item :label="t('common.status')">{{ statusLabels[order.status] || order.status }}</n-descriptions-item>
      </n-descriptions>
      <n-button type="info" style="margin-top: 16px" @click="handleOpenChat">
        💬 {{ t('driver.orders.chatWithClient') }}
      </n-button>
    </n-card>

    <div v-else-if="!loading" style="padding: 40px; text-align: center">
      <n-empty :description="t('driver.orders.orderNotFound')" />
    </div>

    <div v-else style="padding: 40px; text-align: center">
      <n-spin size="large" />
    </div>

  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const { apiBase: API } = useApiBase()
const route = useRoute()
const { openChat } = useOrderChat()
const order = ref<any>(null)
const loading = ref(true)

function handleOpenChat() {
  openChat(order.value?.id || null, t('driver.orders.chatWithClient'))
}

const statusLabels = computed<Record<string, string>>(() => ({
  PENDING: t('driver.orders.statusPending'),
  ACCEPTED: t('driver.orders.statusAccepted'),
  IN_TRANSIT: t('driver.orders.statusInTransit'),
  DELIVERED: t('driver.orders.statusDelivered'),
  CANCELLED: t('driver.orders.statusCancelled'),
}))

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
