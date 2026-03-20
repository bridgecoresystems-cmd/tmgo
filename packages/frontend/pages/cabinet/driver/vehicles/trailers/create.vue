<template>
  <div>
    <UiBackBtn to="/cabinet/driver/vehicles?tab=trailers" />
    <n-h3 style="margin:0 0 24px 0;">{{ t('driver.trailers.addTitle') }}</n-h3>

    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">

      <!-- Раздел 1: Основная информация -->
      <n-card :title="t('driver.trailers.sectionBasic')" embedded class="mb-24">
        <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
          <n-gi span="2">
            <n-form-item :label="t('driver.trailers.trailerType')" path="trailerType" required>
              <n-radio-group v-model:value="form.trailerType">
                <n-space>
                  <n-radio value="semi">{{ t('driver.trailers.trailerTypeSemi') }}</n-radio>
                  <n-radio value="drawbar">{{ t('driver.trailers.trailerTypeDrawbar') }}</n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.bodyType')" path="bodyType" required>
              <n-select
                v-model:value="form.bodyType"
                :options="bodyTypeOptions"
                :placeholder="t('common.select')"
                filterable
                style="width:100%"
              />
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.color')" path="color" required>
              <n-select v-model:value="form.color" :options="colorOptions" style="width:100%" />
            </n-form-item>
          </n-gi>
          <!-- Марка -->
          <n-gi span="2 m:1">
            <n-form-item v-if="!useCustomMake" :label="t('driver.trailers.brand')" path="makeId">
              <n-space vertical style="width:100%">
                <n-select v-model:value="form.makeId" :options="makeOptions" filterable :placeholder="t('common.select')" @update:value="onMakeChange" style="width:100%" />
                <n-button text type="primary" size="small" @click="useCustomMake = true">{{ t('driver.trailers.customMakeHint') }}</n-button>
              </n-space>
            </n-form-item>
            <n-form-item v-else :label="t('driver.trailers.brand')">
              <n-space vertical style="width:100%">
                <n-input v-model:value="form.customMake" :placeholder="t('driver.trailers.brand')" style="width:100%" />
                <n-button text type="primary" size="small" @click="useCustomMake = false">{{ t('driver.trailers.backToSelect') }}</n-button>
              </n-space>
            </n-form-item>
          </n-gi>
          <!-- Модель -->
          <n-gi span="2 m:1">
            <n-form-item v-if="!useCustomMake" :label="t('driver.trailers.model')" path="modelId">
              <n-space vertical style="width:100%">
                <n-select v-model:value="form.modelId" :options="modelOptions" filterable :loading="modelsLoading" :placeholder="t('common.select')" style="width:100%" />
                <n-button text type="primary" size="small" @click="useCustomModel = true">{{ t('driver.trailers.customModelHint') }}</n-button>
              </n-space>
            </n-form-item>
            <n-form-item v-else :label="t('driver.trailers.model')">
              <n-space vertical style="width:100%">
                <n-input v-model:value="form.customModel" :placeholder="t('driver.trailers.model')" style="width:100%" />
                <n-button text type="primary" size="small" @click="useCustomModel = false">{{ t('driver.trailers.backToSelect') }}</n-button>
              </n-space>
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.year')" path="year">
              <n-input-number v-model:value="form.year" :min="1950" :max="currentYear" style="width:130px" />
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-card>

      <!-- Раздел 2: Регистрация -->
      <n-card :title="t('driver.trailers.sectionRegistration')" embedded class="mb-24">
        <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.vin')" path="vin" required>
              <n-input v-model:value="form.vin" :placeholder="t('driver.trailers.vinHint')" maxlength="17" show-count style="max-width:280px" />
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.chassisNumber')" path="chassisNumber">
              <n-input v-model:value="form.chassisNumber" style="max-width:280px" />
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.plateNumber')" path="plateNumber" required>
              <n-input v-model:value="form.plateNumber" placeholder="01 A 12345" style="max-width:220px" />
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.capacityTons')" path="capacityTons" required>
              <n-input-number v-model:value="form.capacityTons" :min="0.1" :max="200" :precision="2" style="width:130px">
                <template #suffix>т</template>
              </n-input-number>
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.volumeM3')" path="volumeM3">
              <n-input-number v-model:value="form.volumeM3" :min="0" :precision="1" style="width:130px">
                <template #suffix>м³</template>
              </n-input-number>
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.axleCount')" path="axleCount">
              <n-input-number v-model:value="form.axleCount" :min="1" :max="10" style="width:100px" />
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.palletPlaces')" path="palletPlaces">
              <n-input-number v-model:value="form.palletPlaces" :min="0" style="width:100px" />
            </n-form-item>
          </n-gi>
          <n-gi span="2">
            <n-form-item :label="t('driver.trailers.hasGps')">
              <n-switch v-model:value="form.hasGps" />
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-card>

      <!-- Раздел 3: ADR -->
      <n-card :title="t('driver.trailers.sectionAdr')" embedded class="mb-24">
        <n-checkbox-group v-model:value="form.adrClasses">
          <n-grid :cols="2" :x-gap="12" :y-gap="8" responsive="screen" item-responsive>
            <n-gi v-for="cls in ADR_CLASSES" :key="cls.id" span="2 m:1">
              <n-checkbox :value="cls.id" :label="locale === 'en' ? cls.labelEn : cls.label" />
            </n-gi>
          </n-grid>
        </n-checkbox-group>
        <div v-if="form.adrClasses.length === 0" style="color:#aaa;font-size:13px;margin-top:8px">
          {{ t('driver.trailers.adrNone') }}
        </div>
      </n-card>

      <!-- Раздел 4: Температурный режим (только reefer/multi_temp) -->
      <n-card v-if="isMultiTemp" :title="t('driver.trailers.sectionTempRange')" embedded class="mb-24">
        <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.tempMinC')" path="tempMinC">
              <n-input-number v-model:value="form.tempMinC" :min="-40" :max="30" style="width:130px">
                <template #suffix>°C</template>
              </n-input-number>
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.tempMaxC')" path="tempMaxC">
              <n-input-number v-model:value="form.tempMaxC" :min="-40" :max="30" style="width:130px">
                <template #suffix>°C</template>
              </n-input-number>
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-card>

      <!-- Раздел 5: Страхование -->
      <n-card :title="t('driver.trailers.sectionInsurance')" embedded class="mb-24">
        <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.insurancePolicyNum')">
              <n-input v-model:value="form.insurancePolicyNum" style="max-width:280px" />
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.insuranceExpiresAt')">
              <n-date-picker
                v-model:value="insuranceTs"
                type="date" clearable style="max-width:200px"
                @update:value="(v: number | null) => { form.insuranceExpiresAt = v ? new Date(v).toISOString().slice(0,10) : null }"
              />
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-card>

      <!-- Раздел 6: Холодильный агрегат (только isReefer) -->
      <n-card v-if="isReefer" :title="t('driver.trailers.sectionRefUnit')" embedded class="mb-24">
        <n-alert type="info" style="margin-bottom:16px">{{ t('driver.trailers.refSectionHint') }}</n-alert>
        <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.refFuelType')" path="refFuelType" required>
              <n-select v-model:value="form.refFuelType" :options="refFuelTypeOptions" style="width:100%" />
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.refFuelTankL')" path="refFuelTankL" required>
              <n-input-number v-model:value="form.refFuelTankL" :min="0" style="width:130px">
                <template #suffix>л</template>
              </n-input-number>
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.refTransmission')" path="refTransmission" required>
              <n-select v-model:value="form.refTransmission" :options="refTransmissionOptions" style="width:100%" />
            </n-form-item>
          </n-gi>
          <n-gi span="2 m:1">
            <n-form-item :label="t('driver.trailers.refFuelConsumptionPh')" path="refFuelConsumptionPh" required>
              <n-input-number v-model:value="form.refFuelConsumptionPh" :min="0" :precision="1" style="width:130px">
                <template #suffix>л/ч</template>
              </n-input-number>
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-card>

      <!-- Раздел 7: Владение -->
      <n-card :title="t('driver.trailers.sectionOwnership')" embedded class="mb-24">
        <n-radio-group v-model:value="form.ownership">
          <n-space>
            <n-radio value="own">{{ t('driver.trailers.ownershipOwn') }}</n-radio>
            <n-radio value="company">{{ t('driver.trailers.ownershipCompany') }}</n-radio>
            <n-radio value="leased">{{ t('driver.trailers.ownershipLeased') }}</n-radio>
          </n-space>
        </n-radio-group>
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
import { VEHICLE_COLORS, TRAILER_BODY_TYPES, REEFER_BODY_TYPES, ADR_CLASSES } from '@tmgo/shared'

const { t, locale } = useI18n()
definePageMeta({ layout: 'cabinet-driver',  })

const { apiBase: API } = useApiBase()
const message = useMessage()
const formRef = ref()
const creating = ref(false)
const modelsLoading = ref(false)
const useCustomMake = ref(false)
const useCustomModel = ref(false)
const currentYear = new Date().getFullYear()

const makeOptions = ref<{ label: string; value: string }[]>([])
const modelOptions = ref<{ label: string; value: string }[]>([])

const form = reactive({
  trailerType: 'semi' as 'semi' | 'drawbar',
  bodyType: null as string | null,
  color: null as string | null,
  makeId: null as string | null,
  modelId: null as string | null,
  customMake: null as string | null,
  customModel: null as string | null,
  year: null as number | null,
  vin: '',
  chassisNumber: '',
  plateNumber: '',
  capacityTons: null as number | null,
  volumeM3: null as number | null,
  axleCount: null as number | null,
  palletPlaces: null as number | null,
  adrClasses: [] as string[],
  tempMinC: null as number | null,
  tempMaxC: null as number | null,
  hasGps: false,
  insurancePolicyNum: '',
  insuranceExpiresAt: null as string | null,
  refFuelType: null as string | null,
  refFuelTankL: null as number | null,
  refTransmission: null as string | null,
  refFuelConsumptionPh: null as number | null,
  ownership: null as string | null,
})

const insuranceTs = computed({
  get: () => form.insuranceExpiresAt ? new Date(form.insuranceExpiresAt).getTime() : null,
  set: () => {},
})

const isReefer = computed(() => form.bodyType !== null && REEFER_BODY_TYPES.includes(form.bodyType as any))
const isMultiTemp = computed(() => form.bodyType === 'reefer' || form.bodyType === 'multi_temp')

watch(() => form.bodyType, (newType) => {
  if (!REEFER_BODY_TYPES.includes(newType as any)) {
    form.refFuelType = null; form.refFuelTankL = null
    form.refTransmission = null; form.refFuelConsumptionPh = null
    form.tempMinC = null; form.tempMaxC = null
  }
})

watch(useCustomMake, (v) => {
  if (v) { form.makeId = null; form.modelId = null; useCustomModel.value = true }
})

const bodyTypeOptions = computed(() =>
  TRAILER_BODY_TYPES.map((v) => ({ label: locale.value === 'en' ? v.labelEn : v.label, value: v.id }))
)
const colorOptions = computed(() =>
  VEHICLE_COLORS.map((c) => ({ label: locale.value === 'en' ? c.labelEn : c.label, value: c.id }))
)
const refFuelTypeOptions = computed(() => [
  { label: t('driver.trailers.fuelTypeDiesel'), value: 'diesel' },
  { label: 'LPG', value: 'lpg' },
  { label: 'LNG', value: 'lng' },
  { label: t('driver.trailers.fuelTypeElectric'), value: 'electric' },
])
const refTransmissionOptions = computed(() => [
  { label: t('driver.trailers.transmissionManual'), value: 'manual' },
  { label: t('driver.trailers.transmissionAutomatic'), value: 'automatic' },
])

const rules = computed(() => ({
  trailerType: { required: true, message: t('common.required'), trigger: 'change' },
  bodyType:    { required: true, message: t('common.required'), trigger: 'blur' },
  color:       { required: true, message: t('common.required'), trigger: 'blur' },
  plateNumber: { required: true, message: t('driver.trailers.plateRequired'), trigger: 'blur' },
  vin:         { required: true, message: t('common.required'), trigger: 'blur' },
  capacityTons:{ required: true, type: 'number', message: t('common.required'), trigger: 'blur' },
}))

async function loadMakes() {
  try {
    const list = await $fetch<any[]>(`${API}/cabinet/driver/vehicles/makes`, { credentials: 'include' })
    makeOptions.value = (Array.isArray(list) ? list : []).map((m) => ({ label: m.name, value: m.id }))
  } catch { makeOptions.value = [] }
}

async function loadModels(makeId: string) {
  modelsLoading.value = true
  try {
    const list = await $fetch<any[]>(`${API}/cabinet/driver/vehicles/makes/${makeId}/models`, { credentials: 'include' })
    modelOptions.value = (Array.isArray(list) ? list : []).map((m) => ({ label: m.name, value: m.id }))
  } catch { modelOptions.value = [] } finally { modelsLoading.value = false }
}

function onMakeChange(makeId: string | null) {
  form.modelId = null; modelOptions.value = []
  if (makeId) loadModels(makeId)
}

onMounted(loadMakes)

async function handleCreate() {
  try { await formRef.value?.validate() } catch { return }

  if (isReefer.value && (!form.refFuelType || !form.refFuelTankL || !form.refTransmission || !form.refFuelConsumptionPh)) {
    message.warning(t('driver.trailers.refSectionHint'))
    return
  }

  creating.value = true
  try {
    const body: Record<string, unknown> = {
      trailerType: form.trailerType,
      bodyType: form.bodyType,
      plateNumber: form.plateNumber,
      color: form.color,
      vin: form.vin || undefined,
      chassisNumber: form.chassisNumber || undefined,
      capacityTons: form.capacityTons,
      volumeM3: form.volumeM3 ?? undefined,
      year: form.year ?? undefined,
      axleCount: form.axleCount ?? undefined,
      palletPlaces: form.palletPlaces ?? undefined,
      adrClasses: form.adrClasses.length ? form.adrClasses : undefined,
      tempMinC: form.tempMinC ?? undefined,
      tempMaxC: form.tempMaxC ?? undefined,
      hasGps: form.hasGps,
      insurancePolicyNum: form.insurancePolicyNum || undefined,
      insuranceExpiresAt: form.insuranceExpiresAt || undefined,
      refFuelType: form.refFuelType || undefined,
      refFuelTankL: form.refFuelTankL ?? undefined,
      refTransmission: form.refTransmission || undefined,
      refFuelConsumptionPh: form.refFuelConsumptionPh ?? undefined,
      ownership: form.ownership || undefined,
    }
    if (useCustomMake.value) { body.customMake = form.customMake || undefined }
    else { body.makeId = form.makeId || undefined }
    if (useCustomModel.value || useCustomMake.value) { body.customModel = form.customModel || undefined }
    else { body.modelId = form.modelId || undefined }

    await $fetch(`${API}/cabinet/driver/trailers`, { method: 'POST', credentials: 'include', body })
    message.success(t('driver.trailers.added'))
    navigateTo('/cabinet/driver/vehicles')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally { creating.value = false }
}
</script>

<style scoped>
.mb-24 { margin-bottom: 24px; }
</style>
