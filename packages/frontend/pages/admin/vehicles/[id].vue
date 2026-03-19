<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/admin/vehicles')">
      {{ t('admin.vehicles.backToList') }}
    </n-button>

    <n-spin :show="loading">
      <template v-if="!loading">
        <n-alert v-if="error" type="error">
          {{ error }}
          <template #footer>
            <n-button size="small" @click="loadVehicle">{{ t('common.retry') }}</n-button>
          </template>
        </n-alert>

        <n-card v-else-if="vehicle" :title="t('admin.vehicles.vehicleTitle')">
          <template #header-extra>
            <n-space>
              <n-button v-if="!editMode" type="primary" @click="editMode = true">{{ t('admin.vehicles.editMode') }}</n-button>
              <n-button v-else @click="editMode = false">{{ t('admin.vehicles.viewMode') }}</n-button>
              <n-popconfirm
                v-if="vehicle.isActive"
                :positive-text="t('common.yes')"
                :negative-text="t('common.cancel')"
                @positive-click="handleDeactivate"
              >
                <template #trigger>
                  <n-button type="warning" :disabled="editMode">{{ t('admin.vehicles.deactivate') }}</n-button>
                </template>
                {{ t('admin.vehicles.deactivateConfirm') }}
              </n-popconfirm>
              <n-popconfirm
                v-else
                :positive-text="t('common.yes')"
                :negative-text="t('common.cancel')"
                @positive-click="handleActivate"
              >
                <template #trigger>
                  <n-button type="success" :disabled="editMode">{{ t('admin.vehicles.activate') }}</n-button>
                </template>
                {{ t('admin.vehicles.activateConfirm') }}
              </n-popconfirm>
            </n-space>
          </template>

          <!-- Owner block -->
          <n-card v-if="vehicle.owner" embedded size="small" style="margin-bottom: 20px;">
            <template #header>
              {{ t('admin.vehicles.owner') }}
            </template>
            <n-space>
              <span>{{ vehicle.owner.driverName || vehicle.owner.name || vehicle.owner.email }}</span>
              <n-button size="small" quaternary type="primary" @click="navigateTo(`/admin/users/${vehicle.owner.id}`)">
                {{ t('admin.vehicles.viewOwner') }}
              </n-button>
            </n-space>
          </n-card>

          <n-descriptions v-if="!editMode" :column="1" bordered label-placement="left" label-width="200">
            <n-descriptions-item :label="t('admin.vehicles.status')">
              <n-tag :type="vehicle.isActive ? 'success' : 'default'">
                {{ vehicle.isActive ? t('admin.vehicles.active') : t('admin.vehicles.inactive') }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.type')">{{ vehicleTypeLabel }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.chassisType')">{{ chassisTypeLabel }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.brand')">{{ vehicle.brand || vehicle.customMake || '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.model')">{{ vehicle.model || vehicle.customModel || '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.year')">{{ vehicle.year || '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.color')">{{ colorLabel }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.vin')">{{ vehicle.vin || '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.chassisNumber')">{{ vehicle.chassisNumber || '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.plateNumber')">{{ vehicle.plateNumber }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.capacityTons')">{{ vehicle.capacityTons != null ? `${vehicle.capacityTons} т` : '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.hasGps')">{{ vehicle.hasGps ? t('common.yes') : t('common.no') }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.insurancePolicyNum')">{{ vehicle.insurancePolicyNum || '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.insuranceExpiresAt')">{{ insuranceExpiresLabel }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.axleConfig')">{{ axleConfigLabel }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.ownership')">{{ ownershipLabel }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.fuelType')">{{ vehicle.fuelType || '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.engineVolumeL')">{{ vehicle.engineVolumeL != null ? `${vehicle.engineVolumeL}` : '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.powerHp')">{{ vehicle.powerHp ?? '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.transmission')">{{ transmissionLabel }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.euroClass')">{{ vehicle.euroClass || '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.fuelConsumption')">{{ vehicle.fuelConsumptionPer100km ?? '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.fifthWheelCapacity')">{{ vehicle.fifthWheelCapacityKg ?? '—' }}</n-descriptions-item>
            <n-descriptions-item :label="t('driver.vehicles.maxGrossWeight')">{{ vehicle.maxGrossWeightT ?? '—' }}</n-descriptions-item>
          </n-descriptions>

          <n-form v-else ref="formRef" :model="form" label-placement="top" label-width="180" style="max-width: 500px;">
            <n-form-item :label="t('driver.vehicles.type')">
              <n-select v-model:value="form.vehicleType" :options="vehicleTypeOptions" style="width: 100%" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.chassisType')">
              <n-select v-model:value="form.chassisType" :options="chassisTypeOptions" clearable style="width: 100%" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.brand')">
              <n-space vertical style="width: 100%">
                <n-select
                  v-if="!useCustomMake"
                  v-model:value="form.makeId"
                  :options="makeOptions"
                  filterable
                  clearable
                  :placeholder="t('common.select')"
                  style="width: 100%"
                  @update:value="onMakeChange"
                />
                <n-input v-else v-model:value="form.customMake" :placeholder="t('driver.vehicles.brand')" style="width: 100%" />
                <n-button text type="primary" size="small" @click="useCustomMake = !useCustomMake">
                  {{ useCustomMake ? t('driver.vehicles.backToSelect') : t('driver.vehicles.customMakeHint') }}
                </n-button>
              </n-space>
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.model')">
              <n-space vertical style="width: 100%">
                <n-select
                  v-if="!useCustomModel"
                  v-model:value="form.modelId"
                  :options="modelOptions"
                  filterable
                  clearable
                  :placeholder="t('common.select')"
                  :loading="modelsLoading"
                  style="width: 100%"
                />
                <n-input v-else v-model:value="form.customModel" :placeholder="t('driver.vehicles.model')" style="width: 100%" />
                <n-button text type="primary" size="small" @click="useCustomModel = !useCustomModel">
                  {{ useCustomModel ? t('driver.vehicles.backToSelect') : t('driver.vehicles.customModelHint') }}
                </n-button>
              </n-space>
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.year')">
              <n-input-number v-model:value="form.year" :min="1950" :max="currentYear" style="width: 120px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.color')">
              <n-select v-model:value="form.color" :options="colorOptions" style="width: 200px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.vin')">
              <n-input v-model:value="form.vin" maxlength="17" style="max-width: 280px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.chassisNumber')">
              <n-input v-model:value="form.chassisNumber" style="max-width: 280px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.plateNumber')" required>
              <n-input v-model:value="form.plateNumber" style="max-width: 200px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.capacityTons')">
              <n-input-number v-model:value="form.capacityTons" :min="0.1" :max="200" :precision="2" style="width: 120px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.hasGps')">
              <n-switch v-model:value="form.hasGps" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.insurancePolicyNum')">
              <n-input v-model:value="form.insurancePolicyNum" style="max-width: 280px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.insuranceExpiresAt')">
              <n-date-picker
                v-model:value="insuranceExpiresTs"
                type="date"
                clearable
                style="max-width: 200px"
                @update:value="(v: number | null) => { form.insuranceExpiresAt = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.axleConfig')">
              <n-select v-model:value="form.axleConfig" :options="axleConfigOptions" clearable style="width: 200px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.ownership')">
              <n-radio-group v-model:value="form.ownership">
                <n-space>
                  <n-radio value="own">{{ t('driver.vehicles.ownershipOwn') }}</n-radio>
                  <n-radio value="company">{{ t('driver.vehicles.ownershipCompany') }}</n-radio>
                  <n-radio value="leased">{{ t('driver.vehicles.ownershipLeased') }}</n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.fuelType')">
              <n-select v-model:value="form.fuelType" :options="fuelTypeOptions" clearable style="width: 200px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.engineVolumeL')">
              <n-input-number v-model:value="form.engineVolumeL" :min="0" :precision="1" style="width: 120px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.powerHp')">
              <n-input-number v-model:value="form.powerHp" :min="0" style="width: 120px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.transmission')">
              <n-select v-model:value="form.transmission" :options="transmissionOptions" clearable style="width: 200px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.euroClass')">
              <n-select v-model:value="form.euroClass" :options="euroClassOptions" clearable style="width: 180px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.fuelConsumption')">
              <n-input-number v-model:value="form.fuelConsumptionPer100km" :min="0" :precision="1" style="width: 120px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.fifthWheelCapacity')">
              <n-input-number v-model:value="form.fifthWheelCapacityKg" :min="0" style="width: 140px" />
            </n-form-item>
            <n-form-item :label="t('driver.vehicles.maxGrossWeight')">
              <n-input-number v-model:value="form.maxGrossWeightT" :min="0" :precision="2" style="width: 120px" />
            </n-form-item>
            <n-space>
              <n-button type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</n-button>
              <n-button @click="editMode = false">{{ t('common.cancel') }}</n-button>
            </n-space>
          </n-form>
        </n-card>

        <n-empty v-else :description="t('admin.vehicles.notFound')" />
      </template>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import {
  VEHICLE_TYPES,
  CHASSIS_TYPES,
  AXLE_CONFIGS,
  VEHICLE_COLORS,
} from '@tmgo/shared'

const { t, locale } = useI18n()
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const { apiBase: API } = useApiBase()
const message = useMessage()
const formRef = ref()
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const vehicle = ref<any>(null)
const editMode = ref(false)
const useCustomMake = ref(false)
const useCustomModel = ref(false)
const makeOptions = ref<{ label: string; value: string }[]>([])
const modelOptions = ref<{ label: string; value: string }[]>([])
const modelsLoading = ref(false)

const currentYear = new Date().getFullYear()

const vehicleTypeOptions = computed(() =>
  VEHICLE_TYPES.map((v) => ({
    label: locale.value === 'en' ? v.labelEn : v.label,
    value: v.id,
  }))
)
const chassisTypeOptions = computed(() =>
  CHASSIS_TYPES.map((v) => ({
    label: locale.value === 'en' ? v.labelEn : v.label,
    value: v.id,
  }))
)
const axleConfigOptions = computed(() =>
  AXLE_CONFIGS.map((v) => ({
    label: locale.value === 'en' ? v.labelEn : v.label,
    value: v.id,
  }))
)
const colorOptions = computed(() =>
  VEHICLE_COLORS.map((c) => ({
    label: locale.value === 'en' ? c.labelEn : c.label,
    value: c.id,
  }))
)
const fuelTypeOptions = computed(() => [
  { label: t('driver.vehicles.fuelTypeDiesel'), value: 'diesel' },
  { label: 'LPG', value: 'lpg' },
  { label: 'LNG', value: 'lng' },
  { label: t('driver.vehicles.fuelTypeElectric'), value: 'electric' },
  { label: t('driver.vehicles.fuelTypeHybrid'), value: 'hybrid' },
])
const transmissionOptions = computed(() => [
  { label: t('driver.vehicles.transmissionManual'), value: 'manual' },
  { label: t('driver.vehicles.transmissionAutomatic'), value: 'automatic' },
  { label: t('driver.vehicles.transmissionRobotized'), value: 'robotized' },
])
const euroClassOptions = [
  { label: 'Euro 3', value: 'euro3' },
  { label: 'Euro 4', value: 'euro4' },
  { label: 'Euro 5', value: 'euro5' },
  { label: 'Euro 6', value: 'euro6' },
]

const form = reactive({
  vehicleType: '',
  chassisType: null as string | null,
  makeId: null as string | null,
  modelId: null as string | null,
  customMake: null as string | null,
  customModel: null as string | null,
  year: null as number | null,
  color: null as string | null,
  vin: '',
  chassisNumber: '',
  plateNumber: '',
  capacityTons: null as number | null,
  hasGps: false,
  insurancePolicyNum: '',
  insuranceExpiresAt: null as string | null,
  axleConfig: null as string | null,
  ownership: null as string | null,
  fuelType: null as string | null,
  engineVolumeL: null as number | null,
  powerHp: null as number | null,
  transmission: null as string | null,
  euroClass: null as string | null,
  fuelConsumptionPer100km: null as number | null,
  fifthWheelCapacityKg: null as number | null,
  maxGrossWeightT: null as number | null,
})

const insuranceExpiresTs = computed({
  get: () => (form.insuranceExpiresAt ? new Date(form.insuranceExpiresAt).getTime() : null),
  set: () => {},
})

const vehicleTypeLabel = computed(() => {
  if (!vehicle.value?.vehicleType) return '—'
  const v = VEHICLE_TYPES.find((x) => x.id === vehicle.value.vehicleType)
  return v ? (locale.value === 'en' ? v.labelEn : v.label) : vehicle.value.vehicleType
})
const chassisTypeLabel = computed(() => {
  if (!vehicle.value?.chassisType) return '—'
  const v = CHASSIS_TYPES.find((x) => x.id === vehicle.value.chassisType)
  return v ? (locale.value === 'en' ? v.labelEn : v.label) : vehicle.value.chassisType
})
const axleConfigLabel = computed(() => {
  if (!vehicle.value?.axleConfig) return '—'
  const v = AXLE_CONFIGS.find((x) => x.id === vehicle.value.axleConfig)
  return v ? (locale.value === 'en' ? v.labelEn : v.label) : vehicle.value.axleConfig
})
const colorLabel = computed(() => {
  if (!vehicle.value?.color) return '—'
  const v = VEHICLE_COLORS.find((x) => x.id === vehicle.value.color)
  return v ? (locale.value === 'en' ? v.labelEn : v.label) : vehicle.value.color
})
const ownershipLabel = computed(() => {
  const o = vehicle.value?.ownership
  if (!o) return '—'
  if (o === 'own') return t('driver.vehicles.ownershipOwn')
  if (o === 'company') return t('driver.vehicles.ownershipCompany')
  if (o === 'leased') return t('driver.vehicles.ownershipLeased')
  return o
})
const transmissionLabel = computed(() => {
  const tr = vehicle.value?.transmission
  if (!tr) return '—'
  if (tr === 'manual') return t('driver.vehicles.transmissionManual')
  if (tr === 'automatic') return t('driver.vehicles.transmissionAutomatic')
  if (tr === 'robotized') return t('driver.vehicles.transmissionRobotized')
  return tr
})
const insuranceExpiresLabel = computed(() => {
  const d = vehicle.value?.insuranceExpiresAt
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
})

async function loadMakes() {
  try {
    const list = await $fetch<any[]>(`${API}/admin/vehicles/makes`, { credentials: 'include' })
    makeOptions.value = (Array.isArray(list) ? list : []).map((m) => ({ label: m.name, value: m.id }))
  } catch {
    makeOptions.value = []
  }
}

async function loadModels(makeId: string | null) {
  if (!makeId) {
    modelOptions.value = []
    return
  }
  modelsLoading.value = true
  try {
    const params = form.vehicleType ? `?vehicleType=${encodeURIComponent(form.vehicleType)}` : ''
    const list = await $fetch<any[]>(`${API}/admin/vehicles/makes/${makeId}/models${params}`, {
      credentials: 'include',
    })
    modelOptions.value = (Array.isArray(list) ? list : []).map((m) => ({ label: m.name, value: m.id }))
  } catch {
    modelOptions.value = []
  } finally {
    modelsLoading.value = false
  }
}

function onMakeChange(makeId: string | null) {
  form.modelId = null
  loadModels(makeId)
}

function fillForm() {
  if (!vehicle.value) return
  form.vehicleType = vehicle.value.vehicleType || ''
  form.chassisType = vehicle.value.chassisType || null
  form.makeId = vehicle.value.makeId || null
  form.modelId = vehicle.value.modelId || null
  form.customMake = vehicle.value.customMake || null
  form.customModel = vehicle.value.customModel || null
  form.year = vehicle.value.year ? parseInt(vehicle.value.year, 10) : null
  form.color = vehicle.value.color || null
  form.vin = vehicle.value.vin || ''
  form.chassisNumber = vehicle.value.chassisNumber || ''
  form.plateNumber = vehicle.value.plateNumber || ''
  form.capacityTons = vehicle.value.capacityTons != null ? Number(vehicle.value.capacityTons) : null
  form.hasGps = vehicle.value.hasGps ?? false
  form.insurancePolicyNum = vehicle.value.insurancePolicyNum || ''
  form.insuranceExpiresAt = vehicle.value.insuranceExpiresAt ? vehicle.value.insuranceExpiresAt.slice(0, 10) : null
  form.axleConfig = vehicle.value.axleConfig || null
  form.ownership = vehicle.value.ownership || null
  form.fuelType = vehicle.value.fuelType || null
  form.engineVolumeL = vehicle.value.engineVolumeL != null ? Number(vehicle.value.engineVolumeL) : null
  form.powerHp = vehicle.value.powerHp ?? null
  form.transmission = vehicle.value.transmission || null
  form.euroClass = vehicle.value.euroClass || null
  form.fuelConsumptionPer100km = vehicle.value.fuelConsumptionPer100km != null ? Number(vehicle.value.fuelConsumptionPer100km) : null
  form.fifthWheelCapacityKg = vehicle.value.fifthWheelCapacityKg ?? null
  form.maxGrossWeightT = vehicle.value.maxGrossWeightT != null ? Number(vehicle.value.maxGrossWeightT) : null
  useCustomMake.value = !!vehicle.value.customMake && !vehicle.value.makeId
  useCustomModel.value = !!vehicle.value.customModel && !vehicle.value.modelId
  if (vehicle.value.makeId) loadModels(vehicle.value.makeId)
}

async function loadVehicle() {
  loading.value = true
  error.value = null
  try {
    await loadMakes()
    const data = await $fetch<any>(`${API}/admin/vehicles/${route.params.id}`, { credentials: 'include' })
    if (data?.error) {
      error.value = data.error
      vehicle.value = null
    } else {
      vehicle.value = data
      fillForm()
    }
  } catch (e: any) {
    error.value = e?.data?.error || t('common.loadError')
    vehicle.value = null
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    const body: Record<string, unknown> = {
      plateNumber: form.plateNumber,
      vehicleType: form.vehicleType || undefined,
      vin: form.vin || undefined,
      chassisNumber: form.chassisNumber || undefined,
      chassisType: form.chassisType || undefined,
      color: form.color || undefined,
      capacityTons: form.capacityTons ?? undefined,
      hasGps: form.hasGps,
      insurancePolicyNum: form.insurancePolicyNum || undefined,
      insuranceExpiresAt: form.insuranceExpiresAt || undefined,
      axleConfig: form.axleConfig || undefined,
      ownership: form.ownership || undefined,
      fuelType: form.fuelType || undefined,
      engineVolumeL: form.engineVolumeL ?? undefined,
      powerHp: form.powerHp ?? undefined,
      transmission: form.transmission || undefined,
      euroClass: form.euroClass || undefined,
      fuelConsumptionPer100km: form.fuelConsumptionPer100km ?? undefined,
      fifthWheelCapacityKg: form.fifthWheelCapacityKg ?? undefined,
      maxGrossWeightT: form.maxGrossWeightT ?? undefined,
      year: form.year ?? undefined,
    }
    if (useCustomMake.value) {
      body.customMake = form.customMake
      body.makeId = null
      body.modelId = null
      body.customModel = form.customModel
    } else if (useCustomModel.value) {
      body.makeId = form.makeId
      body.modelId = null
      body.customModel = form.customModel
    } else {
      body.makeId = form.makeId
      body.modelId = form.modelId
      body.customMake = null
      body.customModel = null
    }
    await $fetch(`${API}/admin/vehicles/${route.params.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body,
    })
    message.success(t('admin.vehicles.saved'))
    editMode.value = false
    await loadVehicle()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally {
    saving.value = false
  }
}

async function handleActivate() {
  try {
    await $fetch(`${API}/admin/vehicles/${route.params.id}/activate`, {
      method: 'POST',
      credentials: 'include',
    })
    message.success(t('admin.vehicles.activated'))
    await loadVehicle()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  }
}

async function handleDeactivate() {
  try {
    await $fetch(`${API}/admin/vehicles/${route.params.id}/deactivate`, {
      method: 'POST',
      credentials: 'include',
    })
    message.success(t('admin.vehicles.deactivated'))
    await loadVehicle()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  }
}

watch(() => route.params.id, loadVehicle, { immediate: true })
</script>
