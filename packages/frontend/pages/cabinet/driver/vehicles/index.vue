<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <n-h3 style="margin:0;">{{ t('driver.vehicles.title') }}</n-h3>
    </div>

    <n-tabs v-model:value="activeTab" type="line" animated>
      <!-- ── ТЯГАЧИ ─────────────────────────────────────────── -->
      <n-tab-pane name="tractors" :tab="t('driver.vehicles.tabTractors')">
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
          <n-button type="primary" @click="navigateTo('/cabinet/driver/vehicles/create')">
            + {{ t('driver.vehicles.addTractor') }}
          </n-button>
        </div>

        <n-data-table
          :columns="tractorColumns"
          :data="vehicleList"
          :loading="vehiclesLoading"
          :pagination="vehicleList.length > 10 ? { pageSize: 10 } : false"
          striped
          :row-props="(row) => ({ style: 'cursor:pointer', onClick: () => navigateTo(`/cabinet/driver/vehicles/${row.id}`) })"
        />
        <n-empty v-if="!vehiclesLoading && vehicleList.length === 0" :description="t('driver.vehicles.noVehicles')" style="margin-top:32px">
          <template #extra>
            <n-button type="primary" @click="navigateTo('/cabinet/driver/vehicles/create')">
              {{ t('driver.vehicles.addTractor') }}
            </n-button>
          </template>
        </n-empty>
      </n-tab-pane>

      <!-- ── ПРИЦЕПЫ ────────────────────────────────────────── -->
      <n-tab-pane name="trailers" :tab="t('driver.vehicles.tabTrailers')">
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
          <n-button type="primary" @click="navigateTo('/cabinet/driver/vehicles/trailers/create')">
            + {{ t('driver.trailers.addTitle') }}
          </n-button>
        </div>

        <n-data-table
          :columns="trailerColumns"
          :data="trailerList"
          :loading="trailersLoading"
          :pagination="trailerList.length > 10 ? { pageSize: 10 } : false"
          striped
          :row-props="(row) => ({ style: 'cursor:pointer', onClick: () => navigateTo(`/cabinet/driver/vehicles/trailers/${row.id}`) })"
        />
        <n-empty v-if="!trailersLoading && trailerList.length === 0" :description="t('driver.trailers.noTrailers')" style="margin-top:32px">
          <template #extra>
            <n-button type="primary" @click="navigateTo('/cabinet/driver/vehicles/trailers/create')">
              {{ t('driver.trailers.addTitle') }}
            </n-button>
          </template>
        </n-empty>
      </n-tab-pane>

      <!-- ── СЦЕПКИ ─────────────────────────────────────────── -->
      <n-tab-pane name="couplings" :tab="t('driver.vehicles.tabCouplings')">
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
          <n-button type="primary" @click="showCouplingModal = true">
            + {{ t('driver.couplings.create') }}
          </n-button>
        </div>

        <n-spin :show="couplingsLoading">
          <div v-if="couplingList.length > 0" class="coupling-grid">
            <DriverCouplingWidget
              v-for="c in couplingList"
              :key="c.id"
              :coupling="c"
              @decoupled="loadCouplings"
            />
          </div>
          <n-empty v-else-if="!couplingsLoading" :description="t('driver.couplings.noCouplings')" style="margin-top:32px" />
        </n-spin>
      </n-tab-pane>
    </n-tabs>

    <!-- ── МОДАЛЬНОЕ ОКНО СОЗДАНИЯ СЦЕПКИ ─────────────────── -->
    <n-modal v-model:show="showCouplingModal" :title="t('driver.couplings.createModal')" preset="card" style="max-width:480px">
      <n-form ref="couplingFormRef" :model="couplingForm" label-placement="top">
        <n-form-item :label="t('driver.couplings.tractor')" path="tractorId" required>
          <n-select
            v-model:value="couplingForm.tractorId"
            :options="tractorOptions"
            :placeholder="t('driver.couplings.selectTractor')"
            filterable
          />
        </n-form-item>
        <n-form-item :label="t('driver.couplings.trailer')" path="trailerId" required>
          <n-select
            v-model:value="couplingForm.trailerId"
            :options="trailerOptions"
            :placeholder="t('driver.couplings.selectTrailer')"
            filterable
          />
        </n-form-item>
        <n-form-item :label="t('driver.couplings.notes')">
          <n-input v-model:value="couplingForm.notes" type="textarea" :rows="2" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCouplingModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" :loading="couplingCreating" @click="handleCreateCoupling">
            {{ t('driver.couplings.create') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { useMessage, NTag, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { VEHICLE_TYPES, VEHICLE_COLORS, TRAILER_BODY_TYPES } from '@tmgo/shared'

const { t, locale } = useI18n()
definePageMeta({ layout: 'cabinet-driver',  })

const { apiBase: API } = useApiBase()
const message = useMessage()

const route = useRoute()
const activeTab = ref((route.query.tab as string) || 'tractors')

// ── Data ───────────────────────────────────────────────────────────
const vehicleList  = ref<any[]>([])
const trailerList  = ref<any[]>([])
const couplingList = ref<any[]>([])
const vehiclesLoading  = ref(true)
const trailersLoading  = ref(true)
const couplingsLoading = ref(true)

// ── Coupling modal ─────────────────────────────────────────────────
const showCouplingModal = ref(false)
const couplingCreating  = ref(false)
const couplingFormRef   = ref()
const couplingForm = reactive({ tractorId: null as string | null, trailerId: null as string | null, notes: '' })

const COLOR_HEX: Record<string, string> = {
  white: '#f5f5f5', black: '#1a1a1a', silver: '#c0c0c0', gray: '#808080',
  red: '#e03131', blue: '#1971c2', green: '#2f9e44', yellow: '#f59f00',
  orange: '#e8590c', brown: '#7a4930', beige: '#d4b896', other: '#aaaaaa',
}

function getVehicleTypeLabel(id: string) {
  const found = VEHICLE_TYPES.find((v) => v.id === id)
  return found ? (locale.value === 'en' ? found.labelEn : found.label) : id
}
function getBodyTypeLabel(id: string) {
  const found = TRAILER_BODY_TYPES.find((v) => v.id === id)
  return found ? (locale.value === 'en' ? found.labelEn : found.label) : id
}
function getColorInfo(id: string | null) {
  return id ? VEHICLE_COLORS.find((c) => c.id === id) ?? null : null
}

// ── Tractor columns ────────────────────────────────────────────────
const tractorColumns = computed<DataTableColumns<any>>(() => [
  {
    title: t('driver.vehicles.type'), key: 'vehicleType', width: 200,
    render: (row) => row.vehicleType
      ? h(NTag, { type: 'info', size: 'small', round: true, style: 'white-space:normal;height:auto;padding:2px 8px' }, { default: () => getVehicleTypeLabel(row.vehicleType) })
      : h('span', { style: 'color:#aaa' }, '—'),
  },
  {
    title: `${t('driver.vehicles.brand')} / ${t('driver.vehicles.model')}`, key: 'brand', width: 180,
    render: (row) => {
      const brand = row.brand || row.customMake
      const model = row.model || row.customModel
      if (!brand && !model) return h('span', { style: 'color:#aaa' }, '—')
      return h(NSpace, { vertical: true, size: 2 }, { default: () => [
        brand ? h('span', { style: 'font-weight:600;font-size:13px' }, brand) : null,
        model ? h('span', { style: 'color:#888;font-size:12px' }, model) : null,
      ].filter(Boolean) })
    },
  },
  {
    title: t('driver.vehicles.plateNumber'), key: 'plateNumber', width: 130,
    render: (row) => h(NTag, { type: 'default', size: 'small', style: 'font-family:monospace;font-weight:700;letter-spacing:1px' }, { default: () => row.plateNumber }),
  },
  {
    title: t('driver.vehicles.color'), key: 'color', width: 130,
    render: (row) => {
      const info = getColorInfo(row.color)
      if (!info) return h('span', { style: 'color:#aaa' }, '—')
      return h(NSpace, { align: 'center', size: 6 }, { default: () => [
        h('span', { style: `display:inline-block;width:14px;height:14px;border-radius:50%;background:${COLOR_HEX[info.id] ?? '#aaa'};border:1px solid rgba(0,0,0,.15)` }),
        h('span', { style: 'font-size:13px' }, locale.value === 'en' ? info.labelEn : info.label),
      ]})
    },
  },
  {
    title: t('driver.vehicles.capacity'), key: 'capacityTons', width: 110,
    render: (row) => row.capacityTons != null ? h('span', { style: 'font-weight:600' }, `${row.capacityTons} т`) : h('span', { style: 'color:#aaa' }, '—'),
  },
  {
    title: t('driver.vehicles.year'), key: 'year', width: 70,
    render: (row) => row.year ? h('span', {}, row.year) : h('span', { style: 'color:#aaa' }, '—'),
  },
  {
    title: 'GPS', key: 'hasGps', width: 70,
    render: (row) => h(NTag, { type: row.hasGps ? 'success' : 'default', size: 'small', round: true }, { default: () => row.hasGps ? '✓' : '—' }),
  },
])

// ── Trailer columns ────────────────────────────────────────────────
const trailerColumns = computed<DataTableColumns<any>>(() => [
  {
    title: t('driver.trailers.bodyType'), key: 'bodyType', width: 200,
    render: (row) => row.bodyType
      ? h(NTag, { type: 'warning', size: 'small', round: true, style: 'white-space:normal;height:auto;padding:2px 8px' }, { default: () => getBodyTypeLabel(row.bodyType) })
      : h('span', { style: 'color:#aaa' }, '—'),
  },
  {
    title: t('driver.trailers.trailerType'), key: 'trailerType', width: 130,
    render: (row) => {
      const label = row.trailerType === 'semi' ? t('driver.trailers.trailerTypeSemi') : t('driver.trailers.trailerTypeDrawbar')
      return h(NTag, { type: 'default', size: 'small' }, { default: () => label })
    },
  },
  {
    title: `${t('driver.trailers.brand')} / ${t('driver.trailers.model')}`, key: 'brand', width: 180,
    render: (row) => {
      const brand = row.brand || row.customMake
      const model = row.model || row.customModel
      if (!brand && !model) return h('span', { style: 'color:#aaa' }, '—')
      return h(NSpace, { vertical: true, size: 2 }, { default: () => [
        brand ? h('span', { style: 'font-weight:600;font-size:13px' }, brand) : null,
        model ? h('span', { style: 'color:#888;font-size:12px' }, model) : null,
      ].filter(Boolean) })
    },
  },
  {
    title: t('driver.trailers.plateNumber'), key: 'plateNumber', width: 130,
    render: (row) => h(NTag, { type: 'default', size: 'small', style: 'font-family:monospace;font-weight:700;letter-spacing:1px' }, { default: () => row.plateNumber }),
  },
  {
    title: t('driver.trailers.capacityTons'), key: 'capacityTons', width: 110,
    render: (row) => row.capacityTons != null ? h('span', { style: 'font-weight:600' }, `${row.capacityTons} т`) : h('span', { style: 'color:#aaa' }, '—'),
  },
  {
    title: 'ADR', key: 'adrClasses', width: 100,
    render: (row) => {
      const classes: string[] = row.adrClasses ?? []
      if (!classes.length) return h('span', { style: 'color:#aaa' }, '—')
      return h(NTag, { type: 'error', size: 'small' }, { default: () => classes.join(', ') })
    },
  },
])

// ── Options for coupling modal ─────────────────────────────────────
const busyTractorIds = computed(() => new Set(couplingList.value.map((c) => c.tractor.id)))
const busyTrailerIds = computed(() => new Set(couplingList.value.map((c) => c.trailer.id)))

const tractorOptions = computed(() =>
  vehicleList.value.map((v) => ({
    label: `${v.brand || v.customMake || '?'} ${v.model || ''} — ${v.plateNumber}`,
    value: v.id,
    disabled: busyTractorIds.value.has(v.id),
  }))
)
const trailerOptions = computed(() =>
  trailerList.value.map((v) => ({
    label: `${getBodyTypeLabel(v.bodyType)} — ${v.plateNumber}`,
    value: v.id,
    disabled: busyTrailerIds.value.has(v.id),
  }))
)

// ── Loaders ────────────────────────────────────────────────────────
async function loadVehicles() {
  vehiclesLoading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/driver/vehicles`, { credentials: 'include' })
    vehicleList.value = Array.isArray(data) ? data : []
  } catch { vehicleList.value = [] } finally { vehiclesLoading.value = false }
}

async function loadTrailers() {
  trailersLoading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/driver/trailers`, { credentials: 'include' })
    trailerList.value = Array.isArray(data) ? data : []
  } catch { trailerList.value = [] } finally { trailersLoading.value = false }
}

async function loadCouplings() {
  couplingsLoading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/driver/couplings`, { credentials: 'include' })
    couplingList.value = Array.isArray(data) ? data : []
  } catch { couplingList.value = [] } finally { couplingsLoading.value = false }
}

async function handleCreateCoupling() {
  if (!couplingForm.tractorId || !couplingForm.trailerId) {
    message.warning(t('common.required'))
    return
  }
  couplingCreating.value = true
  try {
    await $fetch(`${API}/cabinet/driver/couplings`, {
      method: 'POST',
      credentials: 'include',
      body: { tractorId: couplingForm.tractorId, trailerId: couplingForm.trailerId, notes: couplingForm.notes || undefined },
    })
    message.success(t('driver.couplings.created'))
    showCouplingModal.value = false
    couplingForm.tractorId = null
    couplingForm.trailerId = null
    couplingForm.notes = ''
    await loadCouplings()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally { couplingCreating.value = false }
}

onMounted(() => {
  loadVehicles()
  loadTrailers()
  loadCouplings()
})
</script>

<style scoped>
.coupling-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}
</style>
