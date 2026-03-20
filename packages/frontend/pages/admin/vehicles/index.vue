<template>
  <div>
    <n-alert v-if="loadError" type="error" closable style="margin-bottom: 16px">
      {{ loadError }}
      <template #footer>
        <n-button size="small" @click="loadVehicles">{{ t('common.retry') }}</n-button>
      </template>
    </n-alert>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <n-h3 style="margin: 0;">{{ t('admin.vehicles.title') }}</n-h3>
      <n-space>
        <n-select
          v-model:value="statusFilter"
          :options="statusFilterOptions"
          :placeholder="t('admin.vehicles.statusPlaceholder')"
          clearable
          style="width: 180px"
        />
        <n-input v-model:value="search" :placeholder="t('admin.vehicles.searchPlaceholder')" style="width: 240px" clearable />
      </n-space>
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredVehicles"
      :loading="loading"
      :pagination="{ pageSize: 20 }"
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => navigateTo(`/admin/vehicles/${row.id}`) })"
      striped
    />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, NButton, NPopconfirm, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'admin',  })

const { t } = useI18n()
const { apiBase } = useApiBase()
const message = useMessage()
const search = ref('')
const statusFilter = ref<string | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)
const vehicles = ref<any[]>([])

const statusFilterOptions = computed(() => [
  { label: t('admin.vehicles.activeOnly'), value: 'active' },
  { label: t('admin.vehicles.inactiveOnly'), value: 'inactive' },
  { label: t('admin.vehicles.all'), value: 'all' },
])

const columns = computed<DataTableColumns>(() => [
  {
    title: t('admin.vehicles.columnPlate'),
    key: 'plateNumber',
    width: 120,
    ellipsis: true,
  },
  {
    title: t('admin.vehicles.columnType'),
    key: 'vehicleType',
    width: 120,
    render: (row) => row.vehicleType || '—',
  },
  {
    title: t('admin.vehicles.columnBrand'),
    key: 'brand',
    width: 120,
    render: (row) => row.brand || row.customMake || '—',
  },
  {
    title: t('admin.vehicles.columnModel'),
    key: 'model',
    width: 120,
    render: (row) => row.model || row.customModel || '—',
  },
  {
    title: t('admin.vehicles.columnOwner'),
    key: 'owner',
    ellipsis: true,
    render: (row) => {
      const o = row.owner
      if (!o) return '—'
      const name = o.driverName || o.name || o.email || '—'
      return h('span', { title: o.email }, name)
    },
  },
  {
    title: t('admin.vehicles.columnCapacity'),
    key: 'capacityTons',
    width: 90,
    render: (row) => (row.capacityTons != null ? `${row.capacityTons} т` : '—'),
  },
  {
    title: t('admin.vehicles.columnStatus'),
    key: 'isActive',
    width: 100,
    render: (row) =>
      h(NTag, {
        type: row.isActive ? 'success' : 'default',
        size: 'small',
      }, { default: () => row.isActive ? t('admin.vehicles.active') : t('admin.vehicles.inactive') }),
  },
  {
    title: '',
    key: 'actions',
    width: 120,
    render: (row) => {
      return h('div', { style: 'display: flex; align-items: center; gap: 4px;' }, [
        row.isActive
          ? h(NPopconfirm, {
              positiveText: t('common.yes'),
              negativeText: t('common.cancel'),
              onPositiveClick: () => handleDeactivate(row),
            }, {
              trigger: () => h(NButton, {
                quaternary: true,
                type: 'warning',
                size: 'small',
                onClick: (e: Event) => e.stopPropagation(),
              }, { default: () => t('admin.vehicles.deactivate') }),
              default: () => t('admin.vehicles.deactivateConfirm'),
            })
          : h(NPopconfirm, {
              positiveText: t('common.yes'),
              negativeText: t('common.cancel'),
              onPositiveClick: () => handleActivate(row),
            }, {
              trigger: () => h(NButton, {
                quaternary: true,
                type: 'success',
                size: 'small',
                onClick: (e: Event) => e.stopPropagation(),
              }, { default: () => t('admin.vehicles.activate') }),
              default: () => t('admin.vehicles.activateConfirm'),
            }),
      ])
    },
  },
])

const filteredVehicles = computed(() => {
  let list = Array.isArray(vehicles.value) ? vehicles.value : []
  if (statusFilter.value === 'active') list = list.filter((v) => v.isActive === true)
  else if (statusFilter.value === 'inactive') list = list.filter((v) => v.isActive === false)
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter(
    (v) =>
      v.plateNumber?.toLowerCase().includes(q) ||
      v.brand?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.customMake?.toLowerCase().includes(q) ||
      v.customModel?.toLowerCase().includes(q) ||
      v.vin?.toLowerCase().includes(q) ||
      v.owner?.driverName?.toLowerCase().includes(q) ||
      v.owner?.name?.toLowerCase().includes(q) ||
      v.owner?.email?.toLowerCase().includes(q)
  )
})

async function loadVehicles() {
  loadError.value = null
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (statusFilter.value === 'all') params.set('include_inactive', '1')
    else if (statusFilter.value === 'inactive') params.set('inactive_only', '1')
    if (search.value) params.set('search', search.value)
    const url = `${apiBase || ''}/admin/vehicles${params.toString() ? '?' + params.toString() : ''}`
    const data = await $fetch<any[]>(url, { credentials: 'include' })
    vehicles.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || t('admin.vehicles.loadError')
    loadError.value = msg
    message.error(loadError.value)
  } finally {
    loading.value = false
  }
}

async function handleActivate(row: { id: string }) {
  try {
    await $fetch(`${apiBase}/admin/vehicles/${row.id}/activate`, {
      method: 'POST',
      credentials: 'include',
    })
    message.success(t('admin.vehicles.activated'))
    loadVehicles()
  } catch (e: any) {
    message.error(e?.data?.error || e?.message || t('common.error'))
  }
}

async function handleDeactivate(row: { id: string }) {
  try {
    await $fetch(`${apiBase}/admin/vehicles/${row.id}/deactivate`, {
      method: 'POST',
      credentials: 'include',
    })
    message.success(t('admin.vehicles.deactivated'))
    loadVehicles()
  } catch (e: any) {
    message.error(e?.data?.error || e?.message || t('common.error'))
  }
}

onMounted(loadVehicles)
watch(statusFilter, loadVehicles)
</script>
