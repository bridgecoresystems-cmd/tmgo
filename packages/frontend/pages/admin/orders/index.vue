<template>
  <div class="admin-orders">
    <div class="page-actions-top">
      <n-space>
        <n-input v-model:value="searchQuery" placeholder="Поиск по ID или маршруту..." clearable>
          <template #prefix>🔍</template>
        </n-input>
        <n-select
          v-model:value="statusFilter"
          placeholder="Статус"
          :options="statusOptions"
          style="width: 160px"
          clearable
        />
      </n-space>
      <n-button type="primary">
        <template #icon>➕</template>
        Создать заказ
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
    <n-modal v-model:show="showDetailModal" preset="card" title="Детали заказа" style="width: 600px">
      <div v-if="selectedOrder">
        <n-descriptions label-placement="left" bordered :column="1">
          <n-descriptions-item label="ID заказа">#{{ selectedOrder.id }}</n-descriptions-item>
          <n-descriptions-item label="Заказчик">{{ selectedOrder.client }}</n-descriptions-item>
          <n-descriptions-item label="Перевозчик">{{ selectedOrder.carrier || 'Не назначен' }}</n-descriptions-item>
          <n-descriptions-item label="Маршрут">{{ selectedOrder.route }}</n-descriptions-item>
          <n-descriptions-item label="Груз">{{ selectedOrder.cargoType }} ({{ selectedOrder.weight }} т)</n-descriptions-item>
          <n-descriptions-item label="Цена">{{ selectedOrder.price }} TMT</n-descriptions-item>
          <n-descriptions-item label="Дата создания">{{ selectedOrder.date }}</n-descriptions-item>
          <n-descriptions-item label="Статус">
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

const message = useMessage()
const searchQuery = ref('')
const statusFilter = ref(null)
const showDetailModal = ref(false)
const selectedOrder = ref<any>(null)

const statusOptions = [
  { label: 'В пути', value: 'В пути' },
  { label: 'Выполнен', value: 'Выполнен' },
  { label: 'Ожидание', value: 'Ожидание' },
  { label: 'Отменен', value: 'Отменен' }
]

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

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Заказчик', key: 'client' },
  { title: 'Маршрут', key: 'route' },
  {
    title: 'Статус',
    key: 'status',
    render(row: any) {
      return h(NTag, { type: getStatusType(row.status), round: true, size: 'small' }, { default: () => row.status })
    }
  },
  { title: 'Сумма', key: 'price', render(row: any) { return `${row.price} TMT` } },
  {
    title: 'Действия',
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
]

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
