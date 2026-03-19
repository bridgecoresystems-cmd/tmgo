<template>
  <div>
    <UiBackBtn to="/cabinet/driver/orders" />

    <n-alert v-if="vehicles.length === 0" type="warning" style="margin-bottom: 16px">
      {{ t('driver.orders.addVehicleFirst') }}
      <template #footer>
        <n-button size="small" @click="navigateTo('/cabinet/driver/vehicles/create')">{{ t('driver.orders.addVehicle') }}</n-button>
      </template>
    </n-alert>

    <n-card :title="t('driver.orders.availableOrders')">
      <div v-if="loading" style="padding: 40px; text-align: center">
        <n-spin size="large" />
      </div>
      <div v-else-if="availableOrders.length === 0" style="padding: 40px; text-align: center">
        <n-empty :description="t('driver.orders.noAvailableOrders')" />
      </div>
      <n-data-table v-else :columns="columns" :data="availableOrders" :pagination="{ pageSize: 10 }" striped />
    </n-card>

    <n-modal v-model:show="showAcceptModal" preset="card" :title="t('driver.orders.respondToOrder')" style="width: 400px">
      <div v-if="selectedOrder">
        <p><strong>{{ selectedOrder.from_city }} → {{ selectedOrder.to_city }}</strong></p>
        <p v-if="selectedOrder.cargo_name">{{ t('driver.orders.cargo') }}: {{ selectedOrder.cargo_name }}</p>
        <p>{{ t('common.price') }}: {{ selectedOrder.price }} {{ selectedOrder.currency }}</p>
        <n-form-item :label="t('driver.orders.selectVehicle')" required>
          <n-select v-model:value="selectedVehicleId" :options="vehicleOptions" :placeholder="t('common.selectVehicle')" />
        </n-form-item>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAcceptModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" :loading="accepting" @click="handleAccept">{{ t('driver.orders.respond') }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const { t } = useI18n()
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

const columns = computed<DataTableColumns<any>>(() => [
  { title: t('common.from'), key: 'from_city', ellipsis: true },
  { title: t('common.to'), key: 'to_city', ellipsis: true },
  { title: t('driver.orders.cargo'), key: 'cargo_name', ellipsis: true },
  { title: t('common.price'), key: 'price', width: 100, render: (row) => `${row.price} ${row.currency || 'TMT'}` },
  { title: '', key: 'actions', width: 140, render: (row) => h(NButton, { size: 'small', type: 'primary', onClick: () => openAcceptModal(row) }, () => t('driver.orders.respond')) },
])

function openAcceptModal(order: any) {
  selectedOrder.value = order
  selectedVehicleId.value = null
  showAcceptModal.value = true
}

async function handleAccept() {
  if (!selectedOrder.value || !selectedVehicleId.value) {
    message.error(t('driver.orders.selectVehicleRequired'))
    return
  }
  accepting.value = true
  try {
    await $fetch(`${API}/cabinet/driver/orders/${selectedOrder.value.id}/respond`, {
      method: 'POST',
      credentials: 'include',
      body: { vehicle_id: selectedVehicleId.value },
    })
    message.success(t('driver.orders.responseSent'))
    showAcceptModal.value = false
    navigateTo('/cabinet/driver/orders')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.error'))
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
    availableOrders.value = Array.isArray(orders) ? orders : []
    vehicles.value = Array.isArray(veh) ? veh : []
  } catch (e: any) {
    message.error(e?.data?.error || t('common.loadError'))
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
