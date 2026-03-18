<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <n-h3 style="margin: 0;">{{ t('driver.vehicles.title') }}</n-h3>
      <n-button type="primary" @click="navigateTo('/cabinet/driver/vehicles/create')">
        {{ t('common.add') }}
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

const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const { apiBase: API } = useApiBase()
const message = useMessage()
const loading = ref(true)
const vehicleList = ref<any[]>([])

const columns = computed<DataTableColumns<any>>(() => [
  { title: t('driver.vehicles.type'), key: 'type', width: 120 },
  { title: t('driver.vehicles.plateNumber'), key: 'plate_number', ellipsis: true },
  { title: t('driver.vehicles.capacity'), key: 'capacity', width: 140 },
  { title: t('driver.vehicles.volume'), key: 'volume', width: 100 },
])

async function loadVehicles() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/driver/vehicles`, { credentials: 'include' })
    vehicleList.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    message.error(e?.data?.error || t('common.loadError'))
  } finally {
    loading.value = false
  }
}

onMounted(loadVehicles)
</script>
