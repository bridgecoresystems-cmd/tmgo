<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <n-h3 style="margin: 0;">Мои услуги</n-h3>
      <n-button type="primary" @click="navigateTo('/cabinet/driver/services/create')">Добавить</n-button>
    </div>
    <n-data-table
      :columns="columns"
      :data="serviceList"
      :loading="loading"
      :pagination="{ pageSize: 10 }"
      striped
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => navigateTo(`/cabinet/driver/services/${row.id}`) })"
    />
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const API = 'http://localhost:8000'
const message = useMessage()
const loading = ref(true)
const serviceList = ref<any[]>([])

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
    serviceList.value = await $fetch<any[]>(`${API}/cabinet/driver/services`, { credentials: 'include' })
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
  } finally {
    loading.value = false
  }
}

onMounted(loadServices)
</script>

<style scoped>
:deep(.n-data-table-tr:hover) { background-color: rgba(255, 107, 74, 0.06); }
</style>
