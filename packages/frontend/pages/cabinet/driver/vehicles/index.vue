<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <n-h3 style="margin: 0;">{{ t('driver.vehicles.title') }}</n-h3>
      <n-button type="primary" @click="navigateTo('/cabinet/driver/vehicles/create')">
        + {{ t('driver.vehicles.addTractor') }}
      </n-button>
    </div>

    <n-data-table
      :columns="columns"
      :data="vehicleList"
      :loading="loading"
      :pagination="vehicleList.length > 10 ? { pageSize: 10 } : false"
      striped
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => navigateTo(`/cabinet/driver/vehicles/${row.id}`) })"
    />

    <n-empty
      v-if="!loading && vehicleList.length === 0"
      :description="t('driver.vehicles.noVehicles')"
      style="margin-top: 40px"
    >
      <template #extra>
        <n-button type="primary" @click="navigateTo('/cabinet/driver/vehicles/create')">
          {{ t('driver.vehicles.addTractor') }}
        </n-button>
      </template>
    </n-empty>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { useMessage, NTag, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { VEHICLE_TYPES, VEHICLE_COLORS } from '@tmgo/shared'

const { t, locale } = useI18n()
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const { apiBase: API } = useApiBase()
const message = useMessage()
const loading = ref(true)
const vehicleList = ref<any[]>([])

function getVehicleTypeLabel(id: string) {
  const found = VEHICLE_TYPES.find((v) => v.id === id)
  if (!found) return id
  return locale.value === 'en' ? found.labelEn : found.label
}

function getColorInfo(id: string | null) {
  if (!id) return null
  return VEHICLE_COLORS.find((c) => c.id === id) ?? null
}

const COLOR_HEX: Record<string, string> = {
  white: '#f5f5f5',
  black: '#1a1a1a',
  silver: '#c0c0c0',
  gray: '#808080',
  red: '#e03131',
  blue: '#1971c2',
  green: '#2f9e44',
  yellow: '#f59f00',
  orange: '#e8590c',
  brown: '#7a4930',
  beige: '#d4b896',
  other: '#aaa',
}

const columns = computed<DataTableColumns<any>>(() => [
  {
    title: t('driver.vehicles.type'),
    key: 'vehicleType',
    width: 200,
    render(row) {
      if (!row.vehicleType) return h('span', { style: 'color:#aaa' }, '—')
      return h(
        NTag,
        { type: 'info', size: 'small', round: true, style: 'max-width:190px;white-space:normal;height:auto;padding:2px 8px' },
        { default: () => getVehicleTypeLabel(row.vehicleType) }
      )
    },
  },
  {
    title: t('driver.vehicles.brand') + ' / ' + t('driver.vehicles.model'),
    key: 'brand',
    width: 180,
    render(row) {
      const brand = row.brand || row.customMake
      const model = row.model || row.customModel
      if (!brand && !model) return h('span', { style: 'color:#aaa' }, '—')
      return h(NSpace, { vertical: true, size: 2 }, {
        default: () => [
          brand ? h('span', { style: 'font-weight:600;font-size:13px' }, brand) : null,
          model ? h('span', { style: 'color:#888;font-size:12px' }, model) : null,
        ].filter(Boolean),
      })
    },
  },
  {
    title: t('driver.vehicles.plateNumber'),
    key: 'plateNumber',
    width: 130,
    render(row) {
      return h(
        NTag,
        { type: 'default', size: 'small', style: 'font-family:monospace;font-weight:700;letter-spacing:1px' },
        { default: () => row.plateNumber }
      )
    },
  },
  {
    title: t('driver.vehicles.color'),
    key: 'color',
    width: 130,
    render(row) {
      const info = getColorInfo(row.color)
      if (!info) return h('span', { style: 'color:#aaa' }, '—')
      const hex = COLOR_HEX[info.id] ?? '#aaa'
      return h(NSpace, { align: 'center', size: 6 }, {
        default: () => [
          h('span', {
            style: `display:inline-block;width:14px;height:14px;border-radius:50%;background:${hex};border:1px solid rgba(0,0,0,0.15);flex-shrink:0`,
          }),
          h('span', { style: 'font-size:13px' }, locale.value === 'en' ? info.labelEn : info.label),
        ],
      })
    },
  },
  {
    title: t('driver.vehicles.capacity'),
    key: 'capacityTons',
    width: 110,
    render(row) {
      if (row.capacityTons == null) return h('span', { style: 'color:#aaa' }, '—')
      return h('span', { style: 'font-weight:600' }, `${row.capacityTons} т`)
    },
  },
  {
    title: t('driver.vehicles.year'),
    key: 'year',
    width: 70,
    render(row) {
      return row.year ? h('span', {}, row.year) : h('span', { style: 'color:#aaa' }, '—')
    },
  },
  {
    title: 'GPS',
    key: 'hasGps',
    width: 70,
    render(row) {
      return h(
        NTag,
        {
          type: row.hasGps ? 'success' : 'default',
          size: 'small',
          round: true,
        },
        { default: () => (row.hasGps ? '✓' : '—') }
      )
    },
  },
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
