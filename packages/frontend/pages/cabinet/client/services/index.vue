<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <n-h3 style="margin: 0;">{{ t('client.services.title') }}</n-h3>
    </div>

    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
      <n-input v-model:value="search" :placeholder="t('client.services.searchPlaceholder')" clearable style="width: 280px" />
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

const { t } = useI18n()
definePageMeta({ layout: 'cabinet-client',  })

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

const columns = computed<DataTableColumns<any>>(() => [
  { title: t('common.from'), key: 'from_city', ellipsis: true },
  { title: t('common.to'), key: 'to_city', ellipsis: true },
  { title: t('client.services.transport'), key: 'vehicle_plate', width: 120 },
  { title: t('client.services.description'), key: 'description', ellipsis: true },
  { title: t('client.services.price'), key: 'price', width: 100, render: (row) => `${row.price} ${row.currency || 'TMT'}` },
])

async function loadServices() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/client/services`, { credentials: 'include' })
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
:deep(.n-data-table-tr:hover) {
  background-color: rgba(255, 107, 74, 0.06);
}
</style>
