<template>
  <div>
    <n-alert v-if="loadError" type="error" closable style="margin-bottom: 16px">
      {{ loadError }}
      <template #footer>
        <n-button size="small" @click="loadOrders">{{ t('common.retry') }}</n-button>
      </template>
    </n-alert>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <n-h3 style="margin: 0;">{{ t('client.orders.title') }}</n-h3>
      <n-button type="primary" @click="navigateTo('/cabinet/client/orders/create')">
        + {{ t('common.create') }}
      </n-button>
    </div>

    <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
      <n-input
        v-model:value="search"
        :placeholder="t('client.orders.searchPlaceholder')"
        clearable
        style="width: 260px"
      />
      <n-select
        v-model:value="statusFilter"
        :options="statusOptions"
        :placeholder="t('common.status')"
        clearable
        style="width: 180px"
      />
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredOrders"
      :loading="loading"
      :pagination="{ pageSize: 15 }"
      striped
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => navigateTo(`/cabinet/client/orders/${row.id}`) })"
    />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'cabinet-client' })

const { t } = useI18n()
const { apiBase: API } = useApiBase()
const message = useMessage()

const loading = ref(true)
const loadError = ref<string | null>(null)
const orderList = ref<any[]>([])
const search = ref('')
const statusFilter = ref<string | null>(null)

const STATUS_TYPE: Record<string, string> = {
  draft: 'default',
  published: 'info',
  negotiating: 'warning',
  confirmed: 'info',
  pickup: 'info',
  in_transit: 'info',
  delivering: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'error',
  expired: 'error',
  disputed: 'error',
}

const statusOptions = computed(() => [
  { label: t('client.orders.statusDraft'), value: 'draft' },
  { label: t('client.orders.statusPublished'), value: 'published' },
  { label: t('client.orders.statusNegotiating'), value: 'negotiating' },
  { label: t('client.orders.statusConfirmed'), value: 'confirmed' },
  { label: t('client.orders.statusInTransit'), value: 'in_transit' },
  { label: t('client.orders.statusDelivered'), value: 'delivered' },
  { label: t('client.orders.statusCompleted'), value: 'completed' },
  { label: t('client.orders.statusCancelled'), value: 'cancelled' },
])

function statusLabel(status: string) {
  const key = `client.orders.status_${status}`
  const label = t(key)
  return label !== key ? label : status
}

const filteredOrders = computed(() => {
  let list = orderList.value
  if (statusFilter.value) list = list.filter(o => o.status === statusFilter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(o =>
      (o.title ?? '').toLowerCase().includes(q) ||
      (o.fromCity ?? '').toLowerCase().includes(q) ||
      (o.toCity ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

const columns = computed<DataTableColumns<any>>(() => [
  {
    title: t('admin.ordersPage.columnId'),
    key: 'id',
    width: 100,
    render: (row) => h('span', { style: 'font-weight: 600; font-family: monospace;' }, `ORD${row.seqNo || row.id.split('-')[0]}`),
  },
  {
    title: t('client.orders.route'),
    key: 'route',
    render: (row) => `${row.fromRegion ? row.fromRegion + ', ' : ''}${row.fromCity ?? '—'} → ${row.toRegion ? row.toRegion + ', ' : ''}${row.toCity ?? '—'}`,
  },
  {
    title: t('client.orders.cargoType'),
    key: 'cargoType',
    render: (row) => row.cargoType ?? row.cargo_type ?? '—',
    ellipsis: true,
  },
  {
    title: t('client.orders.readyDate'),
    key: 'readyDate',
    width: 110,
    render: (row) => row.readyDate ?? '—',
  },
  {
    title: t('common.price'),
    key: 'price',
    width: 110,
    render: (row) => row.price ? `${row.price} ${row.currency}` : t('client.orders.negotiable'),
  },
  {
    title: t('common.status'),
    key: 'status',
    width: 130,
    render: (row) => h(NTag, { type: (STATUS_TYPE[row.status] ?? 'default') as any, size: 'small', bordered: false },
      { default: () => statusLabel(row.status) }),
  },
  {
    title: t('common.date'),
    key: 'createdAt',
    width: 110,
    render: (row) => new Date(row.createdAt ?? row.created_at).toLocaleDateString('ru-RU'),
  },
])

async function loadOrders() {
  loadError.value = null
  loading.value = true
  try {
    const data = await $fetch<any>(`${API}/cabinet/orders/my`, { credentials: 'include' })
    orderList.value = (data.orders ?? data ?? []).map((item: any) => {
      const ord = item.orders ?? item.order ?? item
      return {
        ...ord,
        cargoType: item.cargoType ?? item.orderCargo?.cargoType ?? item.order_cargo?.cargoType ?? null,
        id: ord.id,
      }
    })
  } catch (e: any) {
    if (e?.data?.error === 'profile_required') {
      return navigateTo('/cabinet/client/verification')
    }
    const err = e?.data?.message || t('client.orders.loadOrdersError')
    loadError.value = err
    message.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)
</script>

<style scoped>
:deep(.n-data-table-tr:hover) {
  background-color: rgba(255, 107, 74, 0.06);
}
</style>
