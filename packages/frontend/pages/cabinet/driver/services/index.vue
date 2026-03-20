<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <n-h3 style="margin: 0;">{{ t('driver.services.title') }}</n-h3>
      <n-button type="primary" @click="navigateTo('/cabinet/driver/services/create')">{{ t('common.add') }}</n-button>
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

const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver',  })

const { apiBase: API } = useApiBase()
const message = useMessage()
const loading = ref(true)
const serviceList = ref<any[]>([])

const columns = computed<DataTableColumns<any>>(() => [
  { title: t('common.from'), key: 'from_city', ellipsis: true },
  { title: t('common.to'), key: 'to_city', ellipsis: true },
  { title: t('common.transport'), key: 'vehicle_plate', width: 120 },
  { title: t('common.description'), key: 'description', ellipsis: true },
  { title: t('common.price'), key: 'price', width: 100, render: (row) => `${row.price} ${row.currency || 'TMT'}` },
])

async function loadServices() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/driver/services`, { credentials: 'include' })
    serviceList.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    message.error(e?.data?.error || t('common.loadError'))
  } finally {
    loading.value = false
  }
}

onMounted(loadServices)
</script>

<style scoped>
:deep(.n-data-table-tr:hover) { background-color: rgba(255, 107, 74, 0.06); }
</style>
