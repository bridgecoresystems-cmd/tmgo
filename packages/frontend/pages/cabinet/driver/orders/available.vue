<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/cabinet/driver/orders')">
      ← Назад
    </n-button>

    <n-alert v-if="vehicles.length === 0" type="warning" style="margin-bottom: 16px">
      Сначала добавьте транспорт в разделе «Мой транспорт».
      <template #footer>
        <n-button size="small" @click="navigateTo('/cabinet/driver/vehicles/create')">Добавить транспорт</n-button>
      </template>
    </n-alert>

    <n-card title="Доступные заказы">
      <div v-if="loading" style="padding: 40px; text-align: center">
        <n-spin size="large" />
      </div>
      <div v-else-if="availableOrders.length === 0" style="padding: 40px; text-align: center">
        <n-empty description="Нет доступных заказов" />
      </div>
      <n-data-table v-else :columns="columns" :data="availableOrders" :pagination="{ pageSize: 10 }" striped />
    </n-card>

    <n-modal v-model:show="showAcceptModal" preset="card" title="Откликнуться на заказ" style="width: 400px">
      <div v-if="selectedOrder">
        <p><strong>{{ selectedOrder.from_city }} → {{ selectedOrder.to_city }}</strong></p>
        <p v-if="selectedOrder.cargo_name">Товар: {{ selectedOrder.cargo_name }}</p>
        <p>Цена: {{ selectedOrder.price }} {{ selectedOrder.currency }}</p>
        <n-form-item label="Выберите транспорт" required>
          <n-select v-model:value="selectedVehicleId" :options="vehicleOptions" placeholder="Выберите ТС" />
        </n-form-item>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAcceptModal = false">Отмена</n-button>
          <n-button type="primary" :loading="accepting" @click="handleAccept">Откликнуться</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const { apiBase: API } = useApiBase()
const message = useMessage()
const loading = ref(true)
const accepting = ref(false)
const availableOrders = ref<any[]>([])
const vehicles = ref<any[]>([])
const showAcceptModal = ref(false)
const selectedOrder = ref<any>(null)
const selectedVehicleId = ref<string | null>(null)

const vehicleOptions = computed(() =>
  vehicles.value.map((v) => ({ label: `${v.plate_number} (${v.type})`, value: v.id }))
)

const columns: DataTableColumns<any> = [
  { title: 'Откуда', key: 'from_city', ellipsis: true },
  { title: 'Куда', key: 'to_city', ellipsis: true },
  { title: 'Товар', key: 'cargo_name', ellipsis: true },
  { title: 'Цена', key: 'price', width: 100, render: (row) => `${row.price} ${row.currency || 'TMT'}` },
  { title: '', key: 'actions', width: 140, render: (row) => h(NButton, { size: 'small', type: 'primary', onClick: () => openAcceptModal(row) }, () => 'Откликнуться') },
]

function openAcceptModal(order: any) {
  selectedOrder.value = order
  selectedVehicleId.value = null
  showAcceptModal.value = true
}

async function handleAccept() {
  if (!selectedOrder.value || !selectedVehicleId.value) {
    message.error('Выберите транспорт')
    return
  }
  accepting.value = true
  try {
    await $fetch(`${API}/cabinet/driver/orders/${selectedOrder.value.id}/respond`, {
      method: 'POST',
      credentials: 'include',
      body: { vehicle_id: selectedVehicleId.value },
    })
    message.success('Отклик отправлен. Ожидайте решения заказчика.')
    showAcceptModal.value = false
    navigateTo('/cabinet/driver/orders')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    accepting.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const [orders, veh] = await Promise.all([
      $fetch<any[]>(`${API}/cabinet/driver/orders/available`, { credentials: 'include' }),
      $fetch<any[]>(`${API}/cabinet/driver/vehicles`, { credentials: 'include' }),
    ])
    availableOrders.value = orders
    vehicles.value = veh
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
