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
import { h, ref, computed } from 'vue'
import { NTag, NButton, NSpace, useMessage } from 'naive-ui'

definePageMeta({
  layout: 'admin'
})

const { t } = useI18n()
const message = useMessage()
const searchQuery = ref('')
const statusFilter = ref(null)
const showDetailModal = ref(false)
const selectedOrder = ref<any>(null)

const statusOptions = computed(() => [
  { label: t('admin.ordersPage.statusInTransit'), value: t('admin.ordersPage.statusInTransit') },
  { label: t('admin.ordersPage.statusDone'), value: t('admin.ordersPage.statusDone') },
  { label: t('admin.ordersPage.statusPending'), value: t('admin.ordersPage.statusPending') },
  { label: t('admin.ordersPage.statusCancelled'), value: t('admin.ordersPage.statusCancelled') }
])

const orders = [
  { id: '1024', client: 'ООО "ТрансЛогистик"', carrier: 'Аман Аманов', route: 'Ашхабад → Мары', status: 'В пути', price: '1,200', date: '12.03.2026', cargoType: 'Запчасти', weight: '2.5' },
  { id: '1023', client: 'ИП "Оразов"', carrier: 'Сердар С.', route: 'Балканабат → Туркменбаши', status: 'Выполнен', price: '850', date: '11.03.2026', cargoType: 'Продукты', weight: '1.2' },
  { id: '1022', client: 'ТЦ "Беркарар"', carrier: null, route: 'Дашогуз → Ашхабад', status: 'Ожидание', price: '2,100', date: '12.03.2026', cargoType: 'Одежда', weight: '0.8' },
  { id: '1021', client: 'Завод "Туркменнебит"', carrier: 'Ораз О.', route: 'Мары → Туркменабат', status: 'Отменен', price: '600', date: '10.03.2026', cargoType: 'Оборудование', weight: '5.0' },
  { id: '1020', client: 'ООО "СтройМастер"', carrier: 'Керим К.', route: 'Ашхабад → Дашогуз', status: 'Выполнен', price: '3,400', date: '09.03.2026', cargoType: 'Цемент', weight: '20.0' },
]

const getStatusType = (status: string) => {
  switch (status) {
    case 'В пути': return 'info'
    case 'Выполнен': return 'success'
    case 'Ожидание': return 'warning'
    case 'Отменен': return 'error'
    default: return 'default'
  }
}

const columns = computed(() => [
  { title: t('admin.ordersPage.columnId'), key: 'id', width: 80 },
  { title: t('admin.ordersPage.columnClient'), key: 'client' },
  { title: t('admin.ordersPage.columnRoute'), key: 'route' },
  {
    title: t('admin.ordersPage.columnStatus'),
    key: 'status',
    render(row: any) {
      return h(NTag, { type: getStatusType(row.status), round: true, size: 'small' }, { default: () => row.status })
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
          h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => message.info('Удаление #'+row.id) }, { default: () => '🗑️' })
        ]
      })
    }
  }
])

const filteredOrders = computed(() => {
  return orders.filter(o => {
    const matchesSearch = o.id.includes(searchQuery.value) || o.route.toLowerCase().includes(searchQuery.value.toLowerCase())
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
