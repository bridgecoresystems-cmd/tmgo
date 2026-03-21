<template>
  <div>
    <UiBackBtn to="/cabinet/driver/vehicles" />

    <n-h3 style="margin: 0 0 24px 0;">{{ t('driver.vehicles.addTractor') }}</n-h3>

    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" label-width="180">
      <!-- Section 1: Basic info -->
      <n-card :title="t('driver.vehicles.sectionBasic')" embedded class="mb-24">
        <n-form-item :label="t('driver.vehicles.type')" path="vehicleType" required>
          <n-select
            v-model:value="form.vehicleType"
            :options="vehicleTypeOptions"
            :placeholder="t('common.select')"
            style="max-width: 320px"
            @update:value="onVehicleTypeChange"
          />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.chassisType')" path="chassisType">
          <n-select
            v-model:value="form.chassisType"
            :options="chassisTypeOptions"
            clearable
            style="max-width: 320px"
          />
        </n-form-item>
        <n-form-item v-if="!useCustomMake" :label="t('driver.vehicles.brand')" path="makeId" required>
          <n-space vertical style="width: 100%">
            <n-select
              v-model:value="form.makeId"
              :options="makeOptions"
              filterable
              :placeholder="t('common.select')"
              style="max-width: 320px"
              @update:value="onMakeChange"
            />
            <n-button text type="primary" size="small" @click="useCustomMake = true">{{ t('driver.vehicles.customMakeHint') }}</n-button>
          </n-space>
        </n-form-item>
        <n-form-item v-else :label="t('driver.vehicles.brand')" required>
          <n-space vertical style="width: 100%">
            <n-input v-model:value="form.customMake" :placeholder="t('driver.vehicles.brand')" style="max-width: 320px" />
            <n-button text type="primary" size="small" @click="useCustomMake = false">{{ t('driver.vehicles.backToSelect') }}</n-button>
          </n-space>
        </n-form-item>
        <n-form-item v-if="!useCustomMake" :label="t('driver.vehicles.model')" path="modelId" required>
          <n-space vertical style="width: 100%">
            <n-select
              v-model:value="form.modelId"
              :options="modelOptions"
              filterable
              :placeholder="t('common.select')"
              :loading="modelsLoading"
              style="max-width: 320px"
            />
            <n-button text type="primary" size="small" @click="useCustomModel = true">{{ t('driver.vehicles.customModelHint') }}</n-button>
          </n-space>
        </n-form-item>
        <n-form-item v-else :label="t('driver.vehicles.model')" required>
          <n-space vertical style="width: 100%">
            <n-input v-model:value="form.customModel" :placeholder="t('driver.vehicles.model')" style="max-width: 320px" />
            <n-button text type="primary" size="small" @click="useCustomModel = false">{{ t('driver.vehicles.backToSelect') }}</n-button>
          </n-space>
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.year')" path="year">
          <n-input-number
            v-model:value="form.year"
            :min="1950"
            :max="currentYear"
            :placeholder="String(currentYear)"
            style="max-width: 120px"
          />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.color')" path="color" required>
          <n-select
            v-model:value="form.color"
            :options="colorOptions"
            :placeholder="t('common.select')"
            style="max-width: 200px"
          />
        </n-form-item>
      </n-card>

      <!-- Section 2: Registration -->
      <n-card :title="t('driver.vehicles.sectionRegistration')" embedded class="mb-24">
        <n-form-item :label="t('driver.vehicles.vin')" path="vin" required>
          <n-input
            v-model:value="form.vin"
            :placeholder="t('driver.vehicles.vinHint')"
            maxlength="17"
            show-count
            style="max-width: 280px"
          />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.chassisNumber')" path="chassisNumber">
          <n-input v-model:value="form.chassisNumber" style="max-width: 280px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.plateNumber')" path="plateNumber" required>
          <n-input v-model:value="form.plateNumber" placeholder="01 A 12345" style="max-width: 200px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.capacityTons')" path="capacityTons" required>
          <n-input-number
            v-model:value="form.capacityTons"
            :min="0.1"
            :max="200"
            :precision="2"
            style="max-width: 120px"
          >
            <template #suffix> {{ t('driver.vehicles.capacityTons').split('(')[1]?.replace(')', '') || 'т' }} </template>
          </n-input-number>
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.hasGps')" path="hasGps">
          <n-switch v-model:value="form.hasGps" />
        </n-form-item>
      </n-card>

      <!-- Section 3: Insurance -->
      <n-card :title="t('driver.vehicles.sectionInsurance')" embedded class="mb-24">
        <n-form-item :label="t('driver.vehicles.insurancePolicyNum')" path="insurancePolicyNum">
          <n-input v-model:value="form.insurancePolicyNum" style="max-width: 280px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.insuranceExpiresAt')" path="insuranceExpiresAt">
          <n-date-picker
            v-model:value="insuranceExpiresTs"
            type="date"
            clearable
            style="max-width: 200px"
            @update:value="(v: number | null) => { form.insuranceExpiresAt = v ? formatDateOnlyFromMs(v) : null }"
          />
        </n-form-item>
      </n-card>

      <!-- Section 4: Technical -->
      <n-card :title="t('driver.vehicles.sectionTechnical')" embedded class="mb-24">
        <n-form-item :label="t('driver.vehicles.axleConfig')" path="axleConfig">
          <n-select v-model:value="form.axleConfig" :options="axleConfigOptions" clearable style="max-width: 200px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.ownership')" path="ownership">
          <n-radio-group v-model:value="form.ownership">
            <n-space>
              <n-radio value="own">{{ t('driver.vehicles.ownershipOwn') }}</n-radio>
              <n-radio value="company">{{ t('driver.vehicles.ownershipCompany') }}</n-radio>
              <n-radio value="leased">{{ t('driver.vehicles.ownershipLeased') }}</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.fuelType')" path="fuelType">
          <n-select v-model:value="form.fuelType" :options="fuelTypeOptions" clearable style="max-width: 200px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.engineVolumeL')" path="engineVolumeL">
          <n-input-number v-model:value="form.engineVolumeL" :min="0" :precision="1" style="max-width: 120px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.powerHp')" path="powerHp">
          <n-input-number v-model:value="form.powerHp" :min="0" style="max-width: 120px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.fuelTank1L')" path="fuelTank1L">
          <n-input-number v-model:value="form.fuelTank1L" :min="0" style="max-width: 120px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.fuelTank2L')" path="fuelTank2L">
          <n-input-number v-model:value="form.fuelTank2L" :min="0" style="max-width: 120px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.transmission')" path="transmission">
          <n-select v-model:value="form.transmission" :options="transmissionOptions" clearable style="max-width: 200px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.euroClass')" path="euroClass">
          <n-select v-model:value="form.euroClass" :options="euroClassOptions" clearable style="max-width: 180px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.fuelConsumption')" path="fuelConsumptionPer100km">
          <n-input-number v-model:value="form.fuelConsumptionPer100km" :min="0" :precision="1" style="max-width: 120px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.fifthWheelCapacity')" path="fifthWheelCapacityKg">
          <n-input-number v-model:value="form.fifthWheelCapacityKg" :min="0" style="max-width: 140px" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.maxGrossWeight')" path="maxGrossWeightT">
          <n-input-number v-model:value="form.maxGrossWeightT" :min="0" :precision="2" style="max-width: 120px" />
        </n-form-item>
      </n-card>

      <n-space>
        <UiSaveBtn :loading="creating" @click="handleCreate" />
        <UiCancelBtn @click="navigateTo('/cabinet/driver/vehicles')" />
      </n-space>
    </n-form>
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
definePageMeta({ layout: 'cabinet-driver',  })

const { apiBase: API } = useApiBase()
const message = useMessage()
const formRef = ref()
const creating = ref(false)
const useCustomMake = ref(false)
const useCustomModel = ref(false)
const modelsLoading = ref(false)

const currentYear = new Date().getFullYear()

const makeOptions = ref<{ label: string; value: string }[]>([])
const modelOptions = ref<{ label: string; value: string }[]>([])

const form = reactive({
  vehicleType: '' as string,
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
  fuelTank1L: null as number | null,
  fuelTank2L: null as number | null,
  transmission: null as string | null,
  euroClass: null as string | null,
  fuelConsumptionPer100km: null as number | null,
  fifthWheelCapacityKg: null as number | null,
  maxGrossWeightT: null as number | null,
})

const insuranceExpiresTs = computed({
  get: () => (dateOnlyToPickerMs(form.insuranceExpiresAt)),
  set: () => {},
})

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
    label: v.label,
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

const rules = computed(() => ({
  vehicleType: { required: true, message: t('common.required'), trigger: 'blur' },
  plateNumber: { required: true, message: t('driver.vehicles.plateRequired'), trigger: 'blur' },
  vin: { required: true, message: t('common.required'), trigger: 'blur' },
  capacityTons: { required: true, type: 'number', message: t('common.required'), trigger: 'blur' },
  color: { required: true, message: t('common.required'), trigger: 'blur' },
  makeId: {
    required: !useCustomMake.value,
    message: t('common.required'),
    trigger: 'blur',
  },
  modelId: {
    required: !useCustomModel.value && !useCustomMake.value,
    message: t('common.required'),
    trigger: 'blur',
  },
}))

async function loadMakes() {
  try {
    const list = await $fetch<any[]>(`${API}/cabinet/driver/vehicles/makes`, { credentials: 'include' })
    makeOptions.value = (Array.isArray(list) ? list : []).map((m) => ({ label: m.name, value: m.id }))
  } catch {
    makeOptions.value = []
  }
}

async function loadModels(makeId: string) {
  modelsLoading.value = true
  try {
    const list = await $fetch<any[]>(`${API}/cabinet/driver/vehicles/makes/${makeId}/models`, {
      credentials: 'include',
      query: { vehicleType: form.vehicleType || undefined },
    })
    modelOptions.value = (Array.isArray(list) ? list : []).map((m) => ({ label: m.name, value: m.id }))
  } catch {
    modelOptions.value = []
  } finally {
    modelsLoading.value = false
  }
}

function onVehicleTypeChange() {
  form.modelId = null
  if (form.makeId) loadModels(form.makeId)
}

function onMakeChange(makeId: string | null) {
  form.modelId = null
  modelOptions.value = []
  if (makeId) loadModels(makeId)
}

onMounted(loadMakes)

watch(useCustomMake, (v) => {
  if (v) {
    form.makeId = null
    form.modelId = null
    useCustomModel.value = true
  }
})

watch(useCustomModel, (v) => {
  if (v) form.modelId = null
})

async function handleCreate() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

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
    fuelTank1L: form.fuelTank1L ?? undefined,
    fuelTank2L: form.fuelTank2L ?? undefined,
    transmission: form.transmission || undefined,
    euroClass: form.euroClass || undefined,
    fuelConsumptionPer100km: form.fuelConsumptionPer100km ?? undefined,
    fifthWheelCapacityKg: form.fifthWheelCapacityKg ?? undefined,
    maxGrossWeightT: form.maxGrossWeightT ?? undefined,
    year: form.year ?? undefined,
  }
  if (useCustomMake.value) {
    body.customMake = form.customMake || undefined
  } else {
    body.makeId = form.makeId || undefined
  }
  if (useCustomModel.value || useCustomMake.value) {
    body.customModel = form.customModel || undefined
  } else {
    body.modelId = form.modelId || undefined
  }

  creating.value = true
  try {
    await $fetch(`${API}/cabinet/driver/vehicles`, {
      method: 'POST',
      credentials: 'include',
      body,
    })
    message.success(t('driver.vehicles.added'))
    navigateTo('/cabinet/driver/vehicles')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.mb-24 {
  margin-bottom: 24px;
}
</style>
