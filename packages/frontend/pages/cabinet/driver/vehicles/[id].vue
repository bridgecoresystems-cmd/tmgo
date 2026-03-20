<template>
  <div class="vehicle-detail">
    <UiBackBtn to="/cabinet/driver/vehicles" />

    <n-spin :show="loading">
      <template v-if="!loading">
        <n-alert v-if="error" type="error" style="margin-bottom: 16px">
          {{ error }}
          <template #footer>
            <n-button size="small" @click="loadVehicle">{{ t('common.retry') }}</n-button>
          </template>
        </n-alert>

        <template v-else-if="vehicle">
          <!-- ── HERO CARD ───────────────────────────────────── -->
          <n-card class="hero-card" style="margin-bottom: 16px">
            <div class="hero-layout">
              <div class="hero-left">
                <!-- Тип ТС -->
                <n-tag v-if="vehicle.vehicleType" type="info" size="medium" round style="margin-bottom: 10px">
                  {{ vehicleTypeLabel }}
                </n-tag>

                <!-- Марка + Модель -->
                <div class="hero-title">
                  {{ vehicle.brand || vehicle.customMake || '—' }}
                  <span v-if="vehicle.model || vehicle.customModel" class="hero-model">
                    {{ vehicle.model || vehicle.customModel }}
                  </span>
                </div>

                <!-- Год · Цвет · Грузоподъёмность -->
                <div class="hero-meta">
                  <span v-if="vehicle.year">{{ vehicle.year }}</span>
                  <span v-if="vehicle.year && (vehicle.color || vehicle.capacityTons)" class="dot-sep">·</span>
                  <span v-if="vehicle.color" class="color-chip">
                    <span class="color-dot" :style="{ background: colorHex }"></span>
                    {{ colorLabel }}
                  </span>
                  <span v-if="vehicle.color && vehicle.capacityTons" class="dot-sep">·</span>
                  <span v-if="vehicle.capacityTons != null" style="font-weight:600">
                    {{ vehicle.capacityTons }} т
                  </span>
                </div>

                <!-- Госномер -->
                <div style="margin-top: 12px">
                  <n-tag type="default" size="large" style="font-family:monospace;font-weight:700;letter-spacing:2px;font-size:15px">
                    {{ vehicle.plateNumber }}
                  </n-tag>
                </div>
              </div>

              <div class="hero-right">
                <!-- GPS Badge -->
                <n-tag :type="vehicle.hasGps ? 'success' : 'default'" size="small" round style="margin-bottom: 12px">
                  {{ vehicle.hasGps ? '✓ GPS' : 'GPS —' }}
                </n-tag>

                <!-- Страхование -->
                <div v-if="vehicle.insuranceExpiresAt" style="text-align:right">
                  <n-tag :type="insuranceTagType" size="small" style="margin-bottom: 4px">
                    {{ insuranceExpiresLabel }}
                  </n-tag>
                  <div style="font-size:11px;color:#aaa">{{ t('driver.vehicles.insuranceExpiresAt') }}</div>
                </div>

                <!-- Кнопки действий -->
                <n-space style="margin-top: 16px; justify-content: flex-end">
                  <UiEditBtn v-if="!editMode" @click="editMode = true" />
                  <UiCancelBtn v-else size="small" :label="t('common.back')" @click="cancelEdit" />
                  <UiDeleteBtn
                    :label="t('driver.vehicles.deactivate')"
                    :confirm-text="t('driver.vehicles.deactivateConfirm')"
                    :disabled="editMode"
                    @confirm="handleDeactivate"
                  />
                </n-space>
              </div>
            </div>
          </n-card>

          <!-- ── VIEW MODE ───────────────────────────────────── -->
          <template v-if="!editMode">
            <!-- Section 1: Основная информация -->
            <n-card :title="t('driver.vehicles.sectionBasic')" embedded class="section-card">
              <n-grid :cols="2" :x-gap="24" :y-gap="8" responsive="screen" item-responsive>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.type') }}</div>
                    <div class="field-value">
                      <n-tag v-if="vehicle.vehicleType" type="info" size="small" round>{{ vehicleTypeLabel }}</n-tag>
                      <span v-else class="empty-val">—</span>
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.chassisType') }}</div>
                    <div class="field-value">{{ chassisTypeLabel }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.brand') }}</div>
                    <div class="field-value field-value--strong">{{ vehicle.brand || vehicle.customMake || '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.model') }}</div>
                    <div class="field-value field-value--strong">{{ vehicle.model || vehicle.customModel || '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.year') }}</div>
                    <div class="field-value">{{ vehicle.year || '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.color') }}</div>
                    <div class="field-value color-chip" v-if="vehicle.color">
                      <span class="color-dot" :style="{ background: colorHex }"></span>
                      {{ colorLabel }}
                    </div>
                    <span v-else class="empty-val">—</span>
                  </div>
                </n-gi>
              </n-grid>
            </n-card>

            <!-- Section 2: Регистрация -->
            <n-card :title="t('driver.vehicles.sectionRegistration')" embedded class="section-card">
              <n-grid :cols="2" :x-gap="24" :y-gap="8" responsive="screen" item-responsive>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.vin') }}</div>
                    <div class="field-value" style="font-family:monospace;letter-spacing:1px">
                      {{ vehicle.vin || '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.chassisNumber') }}</div>
                    <div class="field-value">{{ vehicle.chassisNumber || '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.plateNumber') }}</div>
                    <div class="field-value">
                      <n-tag type="default" size="small" style="font-family:monospace;font-weight:700;letter-spacing:1px">
                        {{ vehicle.plateNumber }}
                      </n-tag>
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.capacityTons') }}</div>
                    <div class="field-value field-value--strong">
                      {{ vehicle.capacityTons != null ? `${vehicle.capacityTons} т` : '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.hasGps') }}</div>
                    <div class="field-value">
                      <n-tag :type="vehicle.hasGps ? 'success' : 'default'" size="small" round>
                        {{ vehicle.hasGps ? '✓ ' + t('common.yes') : t('common.no') }}
                      </n-tag>
                    </div>
                  </div>
                </n-gi>
              </n-grid>
            </n-card>

            <!-- Section 3: Страхование -->
            <n-card :title="t('driver.vehicles.sectionInsurance')" embedded class="section-card">
              <n-grid :cols="2" :x-gap="24" :y-gap="8" responsive="screen" item-responsive>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.insurancePolicyNum') }}</div>
                    <div class="field-value">{{ vehicle.insurancePolicyNum || '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.insuranceExpiresAt') }}</div>
                    <div class="field-value">
                      <n-tag v-if="vehicle.insuranceExpiresAt" :type="insuranceTagType" size="small">
                        {{ insuranceExpiresLabel }}
                      </n-tag>
                      <span v-else class="empty-val">—</span>
                    </div>
                  </div>
                </n-gi>
              </n-grid>
            </n-card>

            <!-- Section 4: Технические параметры -->
            <n-card :title="t('driver.vehicles.sectionTechnical')" embedded class="section-card">
              <n-grid :cols="3" :x-gap="24" :y-gap="8" responsive="screen" item-responsive>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.axleConfig') }}</div>
                    <div class="field-value">
                      <n-tag v-if="vehicle.axleConfig" type="default" size="small">{{ axleConfigLabel }}</n-tag>
                      <span v-else class="empty-val">—</span>
                    </div>
                  </div>
                </n-gi>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.ownership') }}</div>
                    <div class="field-value">{{ ownershipLabel }}</div>
                  </div>
                </n-gi>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.fuelType') }}</div>
                    <div class="field-value">{{ fuelTypeLabel }}</div>
                  </div>
                </n-gi>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.engineVolumeL') }}</div>
                    <div class="field-value">
                      {{ vehicle.engineVolumeL != null ? `${vehicle.engineVolumeL} л` : '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.powerHp') }}</div>
                    <div class="field-value">
                      {{ vehicle.powerHp != null ? `${vehicle.powerHp} л.с.` : '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.transmission') }}</div>
                    <div class="field-value">{{ transmissionLabel }}</div>
                  </div>
                </n-gi>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.fuelTank1L') }}</div>
                    <div class="field-value">
                      {{ vehicle.fuelTank1L != null ? `${vehicle.fuelTank1L} л` : '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.fuelTank2L') }}</div>
                    <div class="field-value">
                      {{ vehicle.fuelTank2L != null ? `${vehicle.fuelTank2L} л` : '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.euroClass') }}</div>
                    <div class="field-value">
                      <n-tag v-if="vehicle.euroClass" type="success" size="small">{{ euroClassLabel }}</n-tag>
                      <span v-else class="empty-val">—</span>
                    </div>
                  </div>
                </n-gi>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.fuelConsumption') }}</div>
                    <div class="field-value">
                      {{ vehicle.fuelConsumptionPer100km != null ? `${vehicle.fuelConsumptionPer100km} л/100 км` : '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.fifthWheelCapacity') }}</div>
                    <div class="field-value">
                      {{ vehicle.fifthWheelCapacityKg != null ? `${vehicle.fifthWheelCapacityKg} кг` : '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="3 s:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.vehicles.maxGrossWeight') }}</div>
                    <div class="field-value">
                      {{ vehicle.maxGrossWeightT != null ? `${vehicle.maxGrossWeightT} т` : '—' }}
                    </div>
                  </div>
                </n-gi>
              </n-grid>
            </n-card>
          </template>

          <!-- ── EDIT MODE ───────────────────────────────────── -->
          <template v-else>
            <n-form ref="formRef" :model="form" label-placement="top">
              <!-- Section 1 -->
              <n-card :title="t('driver.vehicles.sectionBasic')" embedded class="section-card">
                <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.type')">
                      <n-select v-model:value="form.vehicleType" :options="vehicleTypeOptions" style="width:100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.chassisType')">
                      <n-select v-model:value="form.chassisType" :options="chassisTypeOptions" clearable style="width:100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.brand')">
                      <n-input :value="vehicle.brand || vehicle.customMake || ''" disabled />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.model')">
                      <n-input :value="vehicle.model || vehicle.customModel || ''" disabled />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.year')">
                      <n-input-number v-model:value="form.year" :min="1950" :max="currentYear" style="width:130px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.color')">
                      <n-select v-model:value="form.color" :options="colorOptions" style="width:200px" />
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </n-card>

              <!-- Section 2 -->
              <n-card :title="t('driver.vehicles.sectionRegistration')" embedded class="section-card">
                <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.vin')">
                      <n-input v-model:value="form.vin" maxlength="17" show-count style="width:100%;max-width:280px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.chassisNumber')">
                      <n-input v-model:value="form.chassisNumber" style="width:100%;max-width:280px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.plateNumber')" required>
                      <n-input v-model:value="form.plateNumber" style="width:100%;max-width:220px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.capacityTons')">
                      <n-input-number v-model:value="form.capacityTons" :min="0.1" :max="200" :precision="2" style="width:130px">
                        <template #suffix>т</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2">
                    <n-form-item :label="t('driver.vehicles.hasGps')">
                      <n-switch v-model:value="form.hasGps" />
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </n-card>

              <!-- Section 3 -->
              <n-card :title="t('driver.vehicles.sectionInsurance')" embedded class="section-card">
                <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.insurancePolicyNum')">
                      <n-input v-model:value="form.insurancePolicyNum" style="width:100%;max-width:280px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.vehicles.insuranceExpiresAt')">
                      <n-date-picker
                        v-model:value="insuranceExpiresTs"
                        type="date"
                        clearable
                        style="width:200px"
                        @update:value="(v: number | null) => { form.insuranceExpiresAt = v ? new Date(v).toISOString().slice(0, 10) : null }"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </n-card>

              <!-- Section 4 -->
              <n-card :title="t('driver.vehicles.sectionTechnical')" embedded class="section-card">
                <n-grid :cols="3" :x-gap="24" responsive="screen" item-responsive>
                  <n-gi span="3 s:1">
                    <n-form-item :label="t('driver.vehicles.axleConfig')">
                      <n-select v-model:value="form.axleConfig" :options="axleConfigOptions" clearable style="width:100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="3 s:1">
                    <n-form-item :label="t('driver.vehicles.fuelType')">
                      <n-select v-model:value="form.fuelType" :options="fuelTypeOptions" clearable style="width:100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="3 s:1">
                    <n-form-item :label="t('driver.vehicles.transmission')">
                      <n-select v-model:value="form.transmission" :options="transmissionOptions" clearable style="width:100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="3 s:1">
                    <n-form-item :label="t('driver.vehicles.engineVolumeL')">
                      <n-input-number v-model:value="form.engineVolumeL" :min="0" :precision="1" style="width:100%">
                        <template #suffix>л</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="3 s:1">
                    <n-form-item :label="t('driver.vehicles.powerHp')">
                      <n-input-number v-model:value="form.powerHp" :min="0" style="width:100%">
                        <template #suffix>л.с.</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="3 s:1">
                    <n-form-item :label="t('driver.vehicles.euroClass')">
                      <n-select v-model:value="form.euroClass" :options="euroClassOptions" clearable style="width:100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="3 s:1">
                    <n-form-item :label="t('driver.vehicles.fuelTank1L')">
                      <n-input-number v-model:value="form.fuelTank1L" :min="0" style="width:100%">
                        <template #suffix>л</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="3 s:1">
                    <n-form-item :label="t('driver.vehicles.fuelTank2L')">
                      <n-input-number v-model:value="form.fuelTank2L" :min="0" style="width:100%">
                        <template #suffix>л</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="3 s:1">
                    <n-form-item :label="t('driver.vehicles.fuelConsumption')">
                      <n-input-number v-model:value="form.fuelConsumptionPer100km" :min="0" :precision="1" style="width:100%">
                        <template #suffix>л/100</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="3 s:1">
                    <n-form-item :label="t('driver.vehicles.fifthWheelCapacity')">
                      <n-input-number v-model:value="form.fifthWheelCapacityKg" :min="0" style="width:100%">
                        <template #suffix>кг</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="3 s:1">
                    <n-form-item :label="t('driver.vehicles.maxGrossWeight')">
                      <n-input-number v-model:value="form.maxGrossWeightT" :min="0" :precision="2" style="width:100%">
                        <template #suffix>т</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="3">
                    <n-form-item :label="t('driver.vehicles.ownership')">
                      <n-radio-group v-model:value="form.ownership">
                        <n-space>
                          <n-radio value="own">{{ t('driver.vehicles.ownershipOwn') }}</n-radio>
                          <n-radio value="company">{{ t('driver.vehicles.ownershipCompany') }}</n-radio>
                          <n-radio value="leased">{{ t('driver.vehicles.ownershipLeased') }}</n-radio>
                        </n-space>
                      </n-radio-group>
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </n-card>

              <n-space style="margin-top: 4px">
                <UiSaveBtn :loading="saving" @click="handleSave" />
                <UiCancelBtn @click="cancelEdit" />
              </n-space>
            </n-form>
          </template>
        </template>

        <n-empty v-else :description="t('driver.vehicles.notFound')" />
      </template>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { VEHICLE_TYPES, CHASSIS_TYPES, AXLE_CONFIGS, VEHICLE_COLORS } from '@tmgo/shared'

const { t, locale } = useI18n()
definePageMeta({ layout: 'cabinet-driver',  })

const route = useRoute()
const { apiBase: API } = useApiBase()
const message = useMessage()
const formRef = ref()
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const vehicle = ref<any>(null)
const editMode = ref(false)
const currentYear = new Date().getFullYear()

const COLOR_HEX: Record<string, string> = {
  white: '#f5f5f5', black: '#1a1a1a', silver: '#c0c0c0', gray: '#808080',
  red: '#e03131', blue: '#1971c2', green: '#2f9e44', yellow: '#f59f00',
  orange: '#e8590c', brown: '#7a4930', beige: '#d4b896', other: '#aaaaaa',
}

// ── Options ────────────────────────────────────────
const vehicleTypeOptions = computed(() =>
  VEHICLE_TYPES.map((v) => ({ label: locale.value === 'en' ? v.labelEn : v.label, value: v.id }))
)
const chassisTypeOptions = computed(() =>
  CHASSIS_TYPES.map((v) => ({ label: locale.value === 'en' ? v.labelEn : v.label, value: v.id }))
)
const axleConfigOptions = computed(() =>
  AXLE_CONFIGS.map((v) => ({ label: v.label, value: v.id }))
)
const colorOptions = computed(() =>
  VEHICLE_COLORS.map((c) => ({ label: locale.value === 'en' ? c.labelEn : c.label, value: c.id }))
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

// ── Display computed ───────────────────────────────
const vehicleTypeLabel = computed(() => {
  const found = VEHICLE_TYPES.find((x) => x.id === vehicle.value?.vehicleType)
  return found ? (locale.value === 'en' ? found.labelEn : found.label) : (vehicle.value?.vehicleType || '—')
})
const chassisTypeLabel = computed(() => {
  if (!vehicle.value?.chassisType) return '—'
  const found = CHASSIS_TYPES.find((x) => x.id === vehicle.value.chassisType)
  return found ? (locale.value === 'en' ? found.labelEn : found.label) : vehicle.value.chassisType
})
const axleConfigLabel = computed(() => {
  if (!vehicle.value?.axleConfig) return '—'
  const found = AXLE_CONFIGS.find((x) => x.id === vehicle.value.axleConfig)
  return found ? found.label : vehicle.value.axleConfig
})
const colorLabel = computed(() => {
  if (!vehicle.value?.color) return '—'
  const found = VEHICLE_COLORS.find((x) => x.id === vehicle.value.color)
  return found ? (locale.value === 'en' ? found.labelEn : found.label) : vehicle.value.color
})
const colorHex = computed(() => COLOR_HEX[vehicle.value?.color ?? ''] ?? '#aaa')
const ownershipLabel = computed(() => {
  const o = vehicle.value?.ownership
  if (!o) return '—'
  if (o === 'own') return t('driver.vehicles.ownershipOwn')
  if (o === 'company') return t('driver.vehicles.ownershipCompany')
  if (o === 'leased') return t('driver.vehicles.ownershipLeased')
  return o
})
const fuelTypeLabel = computed(() => {
  const f = vehicle.value?.fuelType
  if (!f) return '—'
  const map: Record<string, () => string> = {
    diesel: () => t('driver.vehicles.fuelTypeDiesel'),
    electric: () => t('driver.vehicles.fuelTypeElectric'),
    hybrid: () => t('driver.vehicles.fuelTypeHybrid'),
    lpg: () => 'LPG',
    lng: () => 'LNG',
  }
  return map[f]?.() ?? f
})
const transmissionLabel = computed(() => {
  const tr = vehicle.value?.transmission
  if (!tr) return '—'
  if (tr === 'manual') return t('driver.vehicles.transmissionManual')
  if (tr === 'automatic') return t('driver.vehicles.transmissionAutomatic')
  if (tr === 'robotized') return t('driver.vehicles.transmissionRobotized')
  return tr
})
const euroClassLabel = computed(() => {
  const ec = vehicle.value?.euroClass
  if (!ec) return '—'
  return ec.replace('euro', 'Euro ')
})
const insuranceExpiresLabel = computed(() => {
  const d = vehicle.value?.insuranceExpiresAt
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
})
const insuranceTagType = computed(() => {
  const d = vehicle.value?.insuranceExpiresAt
  if (!d) return 'default'
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (days < 0) return 'error'
  if (days < 30) return 'warning'
  return 'success'
})

// ── Form ───────────────────────────────────────────
const form = reactive({
  vehicleType: '',
  chassisType: null as string | null,
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
  get: () => (form.insuranceExpiresAt ? new Date(form.insuranceExpiresAt).getTime() : null),
  set: () => {},
})

function fillForm() {
  if (!vehicle.value) return
  form.vehicleType = vehicle.value.vehicleType || ''
  form.chassisType = vehicle.value.chassisType || null
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
  form.fuelTank1L = vehicle.value.fuelTank1L ?? null
  form.fuelTank2L = vehicle.value.fuelTank2L ?? null
  form.transmission = vehicle.value.transmission || null
  form.euroClass = vehicle.value.euroClass || null
  form.fuelConsumptionPer100km = vehicle.value.fuelConsumptionPer100km != null ? Number(vehicle.value.fuelConsumptionPer100km) : null
  form.fifthWheelCapacityKg = vehicle.value.fifthWheelCapacityKg ?? null
  form.maxGrossWeightT = vehicle.value.maxGrossWeightT != null ? Number(vehicle.value.maxGrossWeightT) : null
}

function cancelEdit() {
  editMode.value = false
  fillForm()
}

async function loadVehicle() {
  loading.value = true
  error.value = null
  try {
    const data = await $fetch<any>(`${API}/cabinet/driver/vehicles/${route.params.id}`, { credentials: 'include' })
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
    await $fetch(`${API}/cabinet/driver/vehicles/${route.params.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
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
      },
    })
    message.success(t('driver.vehicles.saved'))
    editMode.value = false
    await loadVehicle()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally {
    saving.value = false
  }
}

async function handleDeactivate() {
  try {
    await $fetch(`${API}/cabinet/driver/vehicles/${route.params.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    message.success(t('driver.vehicles.deactivated'))
    navigateTo('/cabinet/driver/vehicles')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  }
}

watch(() => route.params.id, loadVehicle, { immediate: true })
</script>

<style scoped>
.vehicle-detail {
  max-width: 960px;
}

.hero-card {
  background: linear-gradient(135deg, var(--n-color) 0%, var(--n-color) 100%);
}

.hero-layout {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.hero-left {
  flex: 1;
  min-width: 0;
}

.hero-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.hero-title {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 6px;
}

.hero-model {
  font-size: 16px;
  font-weight: 400;
  color: var(--n-text-color-3);
  margin-left: 6px;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--n-text-color-2);
  font-size: 14px;
}

.dot-sep {
  color: var(--n-text-color-3);
  margin: 0 2px;
}

.color-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.color-dot {
  display: inline-block;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.section-card {
  margin-bottom: 16px;
}

.field-block {
  padding: 4px 0 12px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: #2080f0;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.field-value {
  font-size: 14px;
  color: var(--n-text-color);
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 22px;
}

.field-value--strong {
  font-weight: 600;
  font-size: 15px;
}

.empty-val {
  color: var(--n-text-color-3);
}
</style>
