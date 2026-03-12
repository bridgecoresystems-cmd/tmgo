<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <n-h3 style="margin: 0;">Услуги перевозчиков</n-h3>
    </div>

    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
      <n-input v-model:value="search" placeholder="Поиск по маршруту" clearable style="width: 280px" />
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredServices"
      :loading="loading"
      :pagination="{ pageSize: 10 }"
      striped
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => navigateTo(`/cabinet/client/services/${row.id}`) })"
    />
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'cabinet-client', middleware: 'cabinet-auth' })

const { apiBase: API } = useApiBase()
const message = useMessage()
const loading = ref(true)
const serviceList = ref<any[]>([])
const search = ref('')

const filteredServices = computed(() => {
  const list = Array.isArray(serviceList.value) ? serviceList.value : []
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter(
    (s) =>
      (s.from_city || '').toLowerCase().includes(q) ||
      (s.to_city || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
  )
})

const columns: DataTableColumns<any> = [
  { title: 'Откуда', key: 'from_city', ellipsis: true },
  { title: 'Куда', key: 'to_city', ellipsis: true },
  { title: 'Транспорт', key: 'vehicle_plate', width: 120 },
  { title: 'Описание', key: 'description', ellipsis: true },
  { title: 'Цена', key: 'price', width: 100, render: (row) => `${row.price} ${row.currency || 'TMT'}` },
]

async function loadServices() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/client/services`, { credentials: 'include' })
    serviceList.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
  } finally {
    loading.value = false
  }
}

onMounted(loadServices)
</script>

<style scoped>
:deep(.n-data-table-tr:hover) {
  background-color: rgba(255, 107, 74, 0.06);
}
</style>
