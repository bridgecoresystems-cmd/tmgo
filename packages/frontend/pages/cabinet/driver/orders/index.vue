<template>
  <div>
    <n-alert v-if="loadError" type="error" closable style="margin-bottom: 16px">
      {{ loadError }}
      <template #footer>
        <n-button size="small" @click="loadOrders">{{ t('common.retry') }}</n-button>
      </template>
    </n-alert>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <n-h3 style="margin: 0;">{{ t('driver.orders.title') }}</n-h3>
      <n-button type="primary" @click="navigateTo('/cabinet/driver/orders/available')">{{ t('driver.orders.takeOrder') }}</n-button>
    </div>
    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
      <n-input v-model:value="search" :placeholder="t('driver.orders.searchPlaceholder')" clearable style="width: 280px" />
      <n-select v-model:value="statusFilter" :options="statusOptions" :placeholder="t('common.status')" clearable style="width: 160px" />
    </div>
    <n-data-table
      :columns="columns"
      :data="filteredOrders"
      :loading="loading"
      :pagination="{ pageSize: 10 }"
      striped
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => navigateTo(`/cabinet/driver/orders/${row.id}`) })"
    />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const { apiBase: API } = useApiBase()
const message = useMessage()
const loading = ref(true)
const loadError = ref<string | null>(null)
const orderList = ref<any[]>([])
const search = ref('')
const statusFilter = ref<string>('')

const statusLabels = computed<Record<string, string>>(() => ({
  PENDING: t('driver.orders.statusPending'),
  ACCEPTED: t('driver.orders.statusAccepted'),
  IN_TRANSIT: t('driver.orders.statusInTransit'),
  DELIVERED: t('driver.orders.statusDelivered'),
  CANCELLED: t('driver.orders.statusCancelled'),
}))

const statusOptions = computed(() => [
  { label: t('driver.orders.statusAll'), value: '' },
  ...Object.entries(statusLabels.value).map(([v, l]) => ({ label: l, value: v })),
])

const statusTypes: Record<string, any> = { PENDING: 'warning', ACCEPTED: 'info', IN_TRANSIT: 'info', DELIVERED: 'success', CANCELLED: 'error' }

const filteredOrders = computed(() => {
  let list = Array.isArray(orderList.value) ? orderList.value : []
  if (statusFilter.value) list = list.filter((o) => o.status === statusFilter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((o) => (o.from_city || '').toLowerCase().includes(q) || (o.to_city || '').toLowerCase().includes(q) || (o.cargo_name || '').toLowerCase().includes(q))
  }
  return list
})

const columns = computed<DataTableColumns<any>>(() => [
  { title: t('common.from'), key: 'from_city', ellipsis: true },
  { title: t('common.to'), key: 'to_city', ellipsis: true },
  { title: t('driver.orders.cargo'), key: 'cargo_name', ellipsis: true, width: 140 },
  { title: t('driver.orders.vehicle'), key: 'vehicle_plate', width: 120 },
  { title: t('common.price'), key: 'price', width: 100, render: (row) => `${row.price} ${row.currency || 'TMT'}` },
  { title: t('common.status'), key: 'status', width: 120, render: (row) => h(NTag, { type: statusTypes[row.status] || 'default', size: 'small' }, { default: () => statusLabels.value[row.status] || row.status }) },
  { title: t('common.date'), key: 'created_at', width: 120, render: (row) => new Date(row.created_at).toLocaleDateString('ru-RU') },
])

async function loadOrders() {
  loadError.value = null
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API || ''}/cabinet/driver/orders`, { credentials: 'include' })
    orderList.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    const err = e?.data?.error || e?.data?.message || e?.message || t('common.loadError')
    loadError.value = err
    message.error(err)
    if (import.meta.dev) console.error('Driver orders fetch failed:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)
</script>

<style scoped>
:deep(.n-data-table-tr:hover) { background-color: rgba(255, 107, 74, 0.06); }
</style>
