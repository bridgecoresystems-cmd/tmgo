<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <n-h3 style="margin: 0;">Мой транспорт</n-h3>
      <n-button type="primary" @click="navigateTo('/cabinet/driver/vehicles/create')">
        Добавить
      </n-button>
    </div>

    <n-data-table
      :columns="columns"
      :data="vehicleList"
      :loading="loading"
      :pagination="{ pageSize: 10 }"
      striped
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => navigateTo(`/cabinet/driver/vehicles/${row.id}`) })"
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
const vehicleList = ref<any[]>([])

const columns: DataTableColumns<any> = [
  { title: 'Тип', key: 'type', width: 120 },
  { title: 'Гос. номер', key: 'plate_number', ellipsis: true },
  { title: 'Грузоподъёмность', key: 'capacity', width: 140 },
  { title: 'Объём', key: 'volume', width: 100 },
]

async function loadVehicles() {
  loading.value = true
  try {
    vehicleList.value = await $fetch<any[]>(`${API}/cabinet/driver/vehicles`, { credentials: 'include' })
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка загрузки')
  } finally {
    loading.value = false
  }
}

onMounted(loadVehicles)
</script>
