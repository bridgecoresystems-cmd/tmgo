<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <n-h3 style="margin: 0;">Мои заказы</n-h3>
      <n-button type="primary" @click="navigateTo('/cabinet/client/orders/create')">
        Создать
      </n-button>
    </div>

    <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
      <n-input
        v-model:value="search"
        placeholder="Поиск по маршруту или товару"
        clearable
        style="width: 280px"
      />
      <n-select
        v-model:value="statusFilter"
        :options="statusOptions"
        placeholder="Статус"
        clearable
        style="width: 160px"
      />
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredOrders"
      :loading="loading"
      :pagination="{ pageSize: 10 }"
      striped
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => navigateTo(`/cabinet/client/orders/${row.id}`) })"
    />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'cabinet-client', middleware: 'cabinet-auth' })

const API = 'http://localhost:8000'
const message = useMessage()
const loading = ref(true)
const orderList = ref<any[]>([])
const search = ref('')
const statusFilter = ref<string>('')

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидание',
  ACCEPTED: 'Принят',
  IN_TRANSIT: 'В пути',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
}

const statusOptions = [
  { label: 'Все', value: '' },
  ...Object.entries(statusLabels).map(([value, label]) => ({ label, value })),
]

const statusTypes: Record<string, any> = {
  PENDING: 'warning',
  ACCEPTED: 'info',
  IN_TRANSIT: 'info',
  DELIVERED: 'success',
  CANCELLED: 'error',
}

const filteredOrders = computed(() => {
  let list = orderList.value
  if (statusFilter.value) {
    list = list.filter((o) => o.status === statusFilter.value)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(
      (o) =>
        (o.from_city || '').toLowerCase().includes(q) ||
        (o.to_city || '').toLowerCase().includes(q) ||
        (o.cargo_name || '').toLowerCase().includes(q)
    )
  }
  return list
})

const columns: DataTableColumns<any> = [
  { title: 'Откуда', key: 'from_city', ellipsis: true },
  { title: 'Куда', key: 'to_city', ellipsis: true },
  {
    title: 'Товар',
    key: 'cargo_name',
    ellipsis: true,
    width: 140,
    render: (row) => h('span', { class: 'order-link' }, row.cargo_name || '—'),
  },
  {
    title: 'Цена',
    key: 'price',
    width: 100,
    render: (row) => `${row.price} ${row.currency || 'TMT'}`,
  },
  {
    title: 'Статус',
    key: 'status',
    width: 120,
    render: (row) => h(NTag, { type: statusTypes[row.status] || 'default', size: 'small' }, { default: () => statusLabels[row.status] || row.status }),
  },
  {
    title: 'Дата',
    key: 'created_at',
    width: 120,
    render: (row) => new Date(row.created_at).toLocaleDateString('ru-RU'),
  },
]

async function loadOrders() {
  loading.value = true
  try {
    orderList.value = await $fetch<any[]>(`${API}/cabinet/orders`, { credentials: 'include' })
  } catch {
    message.error('Ошибка загрузки заказов')
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)
</script>

<style scoped>
.order-link {
  color: #ff6b4a;
  cursor: pointer;
  text-decoration: none;
}
.order-link:hover {
  text-decoration: underline;
}
:deep(.n-data-table-tr:hover) {
  background-color: rgba(255, 107, 74, 0.06);
}
</style>
