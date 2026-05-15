<template>
  <div class="admin-orders">
    <div class="page-actions-top">
      <n-space>
        <n-input v-model:value="searchQuery" :placeholder="t('admin.ordersPage.searchPlaceholder')" clearable>
          <template #prefix>🔍</template>
        </n-input>
        <n-select
          v-model:value="statusFilter"
          :placeholder="t('admin.ordersPage.statusPlaceholder')"
          :options="statusOptions"
          style="width: 160px"
          clearable
        />
      </n-space>
      <n-button type="primary">
        <template #icon>➕</template>
        {{ t('admin.ordersPage.createOrder') }}
      </n-button>
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredOrders"
      :pagination="pagination"
      :bordered="false"
      class="mt-20"
    />

    <!-- Модалка деталей заказа -->
    <n-modal v-model:show="showDetailModal" preset="card" :title="t('admin.ordersPage.modalTitle')" style="width: 600px">
      <div v-if="selectedOrder">
        <n-descriptions label-placement="left" bordered :column="1">
          <n-descriptions-item :label="t('admin.ordersPage.labelOrderId')">#{{ selectedOrder.id }}</n-descriptions-item>
          <n-descriptions-item :label="t('admin.ordersPage.labelClient')">{{ selectedOrder.client }}</n-descriptions-item>
          <n-descriptions-item :label="t('admin.ordersPage.labelCarrier')">{{ selectedOrder.carrier || t('admin.ordersPage.notAssigned') }}</n-descriptions-item>
          <n-descriptions-item :label="t('admin.ordersPage.labelRoute')">{{ selectedOrder.route }}</n-descriptions-item>
          <n-descriptions-item :label="t('admin.ordersPage.labelCargo')">{{ selectedOrder.cargoType }} ({{ selectedOrder.weight }} т)</n-descriptions-item>
          <n-descriptions-item :label="t('admin.ordersPage.labelPrice')">{{ selectedOrder.price }} TMT</n-descriptions-item>
          <n-descriptions-item :label="t('admin.ordersPage.labelCreatedAt')">{{ selectedOrder.date }}</n-descriptions-item>
          <n-descriptions-item :label="t('admin.ordersPage.labelStatus')">
            <n-tag :type="getStatusType(selectedOrder.status)">{{ selectedOrder.status }}</n-tag>
          </n-descriptions-item>
        </n-descriptions>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { NTag, NButton, NSpace, useMessage, useDialog } from 'naive-ui'

definePageMeta({
  layout: 'admin'
})

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()
const { apiBase: API } = useApiBase()

const searchQuery = ref('')
const statusFilter = ref(null)
const showDetailModal = ref(false)
const selectedOrder = ref<any>(null)
const loading = ref(false)
const orders = ref<any[]>([])

async function fetchOrders() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/admin/orders`, { credentials: 'include' })
    orders.value = data
  } catch (e) {
    console.error('Failed to fetch orders', e)
    message.error(t('common.loadError'))
  } finally {
    loading.value = false
  }
}

async function deleteOrder(id: string) {
  dialog.warning({
    title: t('common.deleteConfirm'),
    content: `#${id.slice(0, 8)}`,
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await $fetch(`${API}/admin/orders/${id}`, { method: 'DELETE', credentials: 'include' })
        message.success(t('common.success'))
        fetchOrders()
      } catch (e) {
        message.error(t('common.error'))
      }
    }
  })
}

onMounted(() => {
  fetchOrders()
})

const statusOptions = computed(() => [
  { label: t('client.orders.status_published'), value: 'published' },
  { label: t('client.orders.status_negotiating'), value: 'negotiating' },
  { label: t('client.orders.status_in_transit'), value: 'in_transit' },
  { label: t('client.orders.status_completed'), value: 'completed' },
  { label: t('client.orders.status_cancelled'), value: 'cancelled' }
])

const getStatusType = (status: string) => {
  switch (status.toLowerCase()) {
    case 'in_transit':
    case 'pickup':
    case 'delivering':
    case 'в пути': return 'info'
    case 'completed':
    case 'delivered':
    case 'выполнен': return 'success'
    case 'pending':
    case 'published':
    case 'ожидание': return 'warning'
    case 'cancelled':
    case 'отменен': return 'error'
    default: return 'default'
  }
}

const getStatusLabel = (status: string) => {
  // Use client orders translations as they are the source of truth for statuses
  return t(`client.orders.status_${status.toLowerCase()}`, status)
}

const columns = computed(() => [
  { 
    title: t('admin.ordersPage.columnId'), 
    key: 'shortId', 
    width: 100,
    render(row: any) {
      return h('span', { style: 'font-family: monospace; font-weight: bold;' }, row.shortId)
    }
  },
  { title: t('admin.ordersPage.columnClient'), key: 'client' },
  { title: t('admin.ordersPage.columnRoute'), key: 'route' },
  {
    title: t('admin.ordersPage.columnStatus'),
    key: 'status',
    render(row: any) {
      return h(NTag, { type: getStatusType(row.status), round: true, size: 'small' }, { default: () => getStatusLabel(row.status) })
    }
  },
  { title: t('admin.ordersPage.columnAmount'), key: 'price', render(row: any) { return `${row.price} TMT` } },
  {
    title: t('admin.ordersPage.columnActions'),
    key: 'actions',
    render(row: any) {
      return h(NSpace, {}, {
        default: () => [
          h(NButton, { size: 'small', quaternary: true, onClick: () => viewDetails(row) }, { default: () => '👁️' }),
          h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => deleteOrder(row.id) }, { default: () => '🗑️' })
        ]
      })
    }
  }
])

const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    const matchesSearch = o.shortId.includes(searchQuery.value) || 
                         o.route.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         o.client.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !statusFilter.value || o.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const pagination = { pageSize: 10 }

const viewDetails = (order: any) => {
  selectedOrder.value = order
  showDetailModal.value = true
}
</script>

<style scoped>
.page-actions-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.admin-orders :deep(.n-data-table-th) {
  background-color: #fafafc;
  font-weight: 700;
}
</style>
