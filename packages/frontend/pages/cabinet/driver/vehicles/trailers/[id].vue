<template>
  <div class="trailer-detail">
    <UiBackBtn to="/cabinet/driver/vehicles?tab=trailers" />

    <n-spin :show="loading">
      <template v-if="!loading">
        <n-alert v-if="error" type="error" style="margin-bottom: 16px">
          {{ error }}
          <template #footer>
            <n-button size="small" @click="loadTrailer">{{ t('common.retry') }}</n-button>
          </template>
        </n-alert>

        <template v-else-if="trailer">
          <!-- ── ACTIVE COUPLING BANNER ──────────────────────── -->
          <n-alert v-if="activeCoupling" type="info" style="margin-bottom: 16px">
            <template #icon>⛓</template>
            {{ t('driver.trailers.activeCoupling') }}:
            <strong>{{ activeCoupling.tractor.brand }} {{ activeCoupling.tractor.model }}</strong>
            <n-tag size="small" style="font-family:monospace;font-weight:700;letter-spacing:1px;margin-left:8px">
              {{ activeCoupling.tractor.plateNumber }}
            </n-tag>
            <UiDeleteBtn
              style="margin-left: 12px"
              :danger="false"
              icon="unlink"
              :label="t('driver.couplings.decouple')"
              :confirm-text="t('driver.couplings.decoupleConfirm')"
              :loading="decoupling"
              @confirm="handleDecouple"
            />
          </n-alert>

          <!-- ── HERO CARD ───────────────────────────────────── -->
          <n-card class="hero-card" style="margin-bottom: 16px">
            <div class="hero-layout">
              <div class="hero-left">
                <!-- Тип кузова -->
                <n-tag v-if="trailer.bodyType" type="warning" size="medium" round style="margin-bottom: 6px;margin-right:6px">
                  {{ bodyTypeLabel }}
                </n-tag>
                <!-- Тип прицепа -->
                <n-tag type="default" size="small" round style="margin-bottom: 10px">
                  {{ trailerTypeLabel }}
                </n-tag>

                <!-- Марка + Модель -->
                <div class="hero-title">
                  {{ trailer.brand || trailer.customMake || '—' }}
                  <span v-if="trailer.model || trailer.customModel" class="hero-model">
                    {{ trailer.model || trailer.customModel }}
                  </span>
                </div>

                <!-- Год · Грузоподъёмность -->
                <div class="hero-meta">
                  <span v-if="trailer.year">{{ trailer.year }}</span>
                  <span v-if="trailer.year && trailer.capacityTons" class="dot-sep">·</span>
                  <span v-if="trailer.capacityTons != null" style="font-weight:600">
                    {{ trailer.capacityTons }} т
                  </span>
                  <span v-if="trailer.capacityTons && trailer.volumeM3" class="dot-sep">·</span>
                  <span v-if="trailer.volumeM3 != null">{{ trailer.volumeM3 }} м³</span>
                </div>

                <!-- Госномер -->
                <div style="margin-top: 12px">
                  <n-tag type="default" size="large" style="font-family:monospace;font-weight:700;letter-spacing:2px;font-size:15px">
                    {{ trailer.plateNumber }}
                  </n-tag>
                </div>
              </div>

              <div class="hero-right">
                <!-- GPS Badge -->
                <n-tag :type="trailer.hasGps ? 'success' : 'default'" size="small" round style="margin-bottom: 8px">
                  {{ trailer.hasGps ? '✓ GPS' : 'GPS —' }}
                </n-tag>

                <!-- ADR badge -->
                <n-tag
                  v-if="trailer.adrClasses && trailer.adrClasses.length > 0"
                  type="error"
                  size="small"
                  round
                  style="margin-bottom: 8px"
                >
                  ADR {{ trailer.adrClasses.join(', ') }}
                </n-tag>

                <!-- Страхование -->
                <div v-if="trailer.insuranceExpiresAt" style="text-align:right;margin-bottom: 8px">
                  <n-tag :type="insuranceTagType" size="small" style="margin-bottom: 4px">
                    {{ insuranceExpiresLabel }}
                  </n-tag>
                  <div style="font-size:11px;color:#aaa">{{ t('driver.trailers.insuranceExpiresAt') }}</div>
                </div>

                <!-- Кнопки действий -->
                <n-space style="margin-top: 8px; justify-content: flex-end">
                  <UiEditBtn v-if="!editMode" @click="editMode = true" />
                  <UiCancelBtn v-else size="small" :label="t('common.back')" @click="cancelEdit" />
                  <UiDeleteBtn
                    :label="t('driver.trailers.deactivate')"
                    :confirm-text="t('driver.trailers.deactivateConfirm')"
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
            <n-card :title="t('driver.trailers.sectionBasic')" embedded class="section-card">
              <n-grid :cols="2" :x-gap="24" :y-gap="8" responsive="screen" item-responsive>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.bodyType') }}</div>
                    <div class="field-value">
                      <n-tag v-if="trailer.bodyType" type="warning" size="small" round>{{ bodyTypeLabel }}</n-tag>
                      <span v-else class="empty-val">—</span>
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.trailerType') }}</div>
                    <div class="field-value">
                      <n-tag type="default" size="small">{{ trailerTypeLabel }}</n-tag>
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.brand') }}</div>
                    <div class="field-value field-value--strong">{{ trailer.brand || trailer.customMake || '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.model') }}</div>
                    <div class="field-value field-value--strong">{{ trailer.model || trailer.customModel || '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.year') }}</div>
                    <div class="field-value">{{ trailer.year || '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.color') }}</div>
                    <div class="field-value">{{ trailer.color || '—' }}</div>
                  </div>
                </n-gi>
              </n-grid>
            </n-card>

            <!-- Section 2: Регистрация -->
            <n-card :title="t('driver.trailers.sectionRegistration')" embedded class="section-card">
              <n-grid :cols="2" :x-gap="24" :y-gap="8" responsive="screen" item-responsive>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.vin') }}</div>
                    <div class="field-value" style="font-family:monospace;letter-spacing:1px">
                      {{ trailer.vin || '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.chassisNumber') }}</div>
                    <div class="field-value">{{ trailer.chassisNumber || '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.plateNumber') }}</div>
                    <div class="field-value">
                      <n-tag type="default" size="small" style="font-family:monospace;font-weight:700;letter-spacing:1px">
                        {{ trailer.plateNumber }}
                      </n-tag>
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.capacityTons') }}</div>
                    <div class="field-value field-value--strong">
                      {{ trailer.capacityTons != null ? `${trailer.capacityTons} т` : '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.volumeM3') }}</div>
                    <div class="field-value">
                      {{ trailer.volumeM3 != null ? `${trailer.volumeM3} м³` : '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.axleCount') }}</div>
                    <div class="field-value">{{ trailer.axleCount != null ? trailer.axleCount : '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.palletPlaces') }}</div>
                    <div class="field-value">{{ trailer.palletPlaces != null ? trailer.palletPlaces : '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.hasGps') }}</div>
                    <div class="field-value">
                      <n-tag :type="trailer.hasGps ? 'success' : 'default'" size="small" round>
                        {{ trailer.hasGps ? '✓ ' + t('common.yes') : t('common.no') }}
                      </n-tag>
                    </div>
                  </div>
                </n-gi>
              </n-grid>
            </n-card>

            <!-- Section 3: ADR -->
            <n-card :title="t('driver.trailers.sectionAdr')" embedded class="section-card">
              <div v-if="trailer.adrClasses && trailer.adrClasses.length > 0" style="display:flex;flex-wrap:wrap;gap:8px">
                <n-tag
                  v-for="cls in trailer.adrClasses"
                  :key="cls"
                  type="error"
                  size="small"
                >
                  {{ adrLabel(cls) }}
                </n-tag>
              </div>
              <span v-else class="empty-val">{{ t('driver.trailers.adrNone') }}</span>
            </n-card>

            <!-- Section 4: Температурный режим (conditional) -->
            <n-card v-if="isReefer" :title="t('driver.trailers.sectionTempRange')" embedded class="section-card">
              <n-grid :cols="2" :x-gap="24" :y-gap="8" responsive="screen" item-responsive>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.tempMinC') }}</div>
                    <div class="field-value field-value--strong">
                      {{ trailer.tempMinC != null ? `${trailer.tempMinC} °C` : '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.tempMaxC') }}</div>
                    <div class="field-value field-value--strong">
                      {{ trailer.tempMaxC != null ? `${trailer.tempMaxC} °C` : '—' }}
                    </div>
                  </div>
                </n-gi>
              </n-grid>
            </n-card>

            <!-- Section 5: Страхование -->
            <n-card :title="t('driver.trailers.sectionInsurance')" embedded class="section-card">
              <n-grid :cols="2" :x-gap="24" :y-gap="8" responsive="screen" item-responsive>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.insurancePolicyNum') }}</div>
                    <div class="field-value">{{ trailer.insurancePolicyNum || '—' }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.insuranceExpiresAt') }}</div>
                    <div class="field-value">
                      <n-tag v-if="trailer.insuranceExpiresAt" :type="insuranceTagType" size="small">
                        {{ insuranceExpiresLabel }}
                      </n-tag>
                      <span v-else class="empty-val">—</span>
                    </div>
                  </div>
                </n-gi>
              </n-grid>
            </n-card>

            <!-- Section 6: Холодильный агрегат (conditional) -->
            <n-card v-if="hasRefUnit" :title="t('driver.trailers.sectionRefUnit')" embedded class="section-card">
              <n-grid :cols="2" :x-gap="24" :y-gap="8" responsive="screen" item-responsive>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.refFuelType') }}</div>
                    <div class="field-value">{{ refFuelTypeLabel }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.refFuelTankL') }}</div>
                    <div class="field-value">
                      {{ trailer.refFuelTankL != null ? `${trailer.refFuelTankL} л` : '—' }}
                    </div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.refTransmission') }}</div>
                    <div class="field-value">{{ refTransmissionLabel }}</div>
                  </div>
                </n-gi>
                <n-gi span="2 m:1">
                  <div class="field-block">
                    <div class="field-label">{{ t('driver.trailers.refFuelConsumptionPh') }}</div>
                    <div class="field-value">
                      {{ trailer.refFuelConsumptionPh != null ? `${trailer.refFuelConsumptionPh} л/ч` : '—' }}
                    </div>
                  </div>
                </n-gi>
              </n-grid>
            </n-card>

            <!-- Section 7: Владение -->
            <n-card :title="t('driver.trailers.sectionOwnership')" embedded class="section-card">
              <div class="field-block">
                <div class="field-value">{{ ownershipLabel }}</div>
              </div>
            </n-card>
          </template>

          <!-- ── EDIT MODE ───────────────────────────────────── -->
          <template v-else>
            <n-form ref="formRef" :model="form" label-placement="top">
              <!-- Section 1: Основная -->
              <n-card :title="t('driver.trailers.sectionBasic')" embedded class="section-card">
                <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.bodyType')" required>
                      <n-select
                        v-model:value="form.bodyType"
                        :options="bodyTypeOptions"
                        filterable
                        style="width:100%"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.trailerType')" required>
                      <n-radio-group v-model:value="form.trailerType">
                        <n-space>
                          <n-radio value="semi">{{ t('driver.trailers.trailerTypeSemi') }}</n-radio>
                          <n-radio value="drawbar">{{ t('driver.trailers.trailerTypeDrawbar') }}</n-radio>
                        </n-space>
                      </n-radio-group>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.brand')">
                      <n-input :value="trailer.brand || trailer.customMake || ''" disabled />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.model')">
                      <n-input :value="trailer.model || trailer.customModel || ''" disabled />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.year')">
                      <n-input-number v-model:value="form.year" :min="1950" :max="currentYear" style="width:130px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.color')">
                      <n-input v-model:value="form.color" style="width:200px" />
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </n-card>

              <!-- Section 2: Регистрация -->
              <n-card :title="t('driver.trailers.sectionRegistration')" embedded class="section-card">
                <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.vin')">
                      <n-input v-model:value="form.vin" maxlength="17" show-count style="width:100%;max-width:280px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.chassisNumber')">
                      <n-input v-model:value="form.chassisNumber" style="width:100%;max-width:280px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.plateNumber')" required>
                      <n-input v-model:value="form.plateNumber" style="width:100%;max-width:220px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.capacityTons')">
                      <n-input-number v-model:value="form.capacityTons" :min="0.1" :max="200" :precision="2" style="width:130px">
                        <template #suffix>т</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.volumeM3')">
                      <n-input-number v-model:value="form.volumeM3" :min="0" :precision="1" style="width:130px">
                        <template #suffix>м³</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.axleCount')">
                      <n-input-number v-model:value="form.axleCount" :min="1" :max="10" style="width:100px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.palletPlaces')">
                      <n-input-number v-model:value="form.palletPlaces" :min="0" :max="60" style="width:100px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2">
                    <n-form-item :label="t('driver.trailers.hasGps')">
                      <n-switch v-model:value="form.hasGps" />
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </n-card>

              <!-- Section 3: ADR -->
              <n-card :title="t('driver.trailers.sectionAdr')" embedded class="section-card">
                <n-checkbox-group v-model:value="form.adrClasses">
                  <n-grid :cols="2" :x-gap="12" :y-gap="8" responsive="screen" item-responsive>
                    <n-gi v-for="cls in ADR_CLASSES" :key="cls.id" span="2 m:1">
                      <n-checkbox :value="cls.id">
                        {{ locale === 'en' ? cls.labelEn : cls.label }}
                      </n-checkbox>
                    </n-gi>
                  </n-grid>
                </n-checkbox-group>
              </n-card>

              <!-- Section 4: Температурный режим (conditional) -->
              <n-card v-if="formIsReefer" :title="t('driver.trailers.sectionTempRange')" embedded class="section-card">
                <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.tempMinC')">
                      <n-input-number v-model:value="form.tempMinC" :min="-40" :max="30" :precision="1" style="width:130px">
                        <template #suffix>°C</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.tempMaxC')">
                      <n-input-number v-model:value="form.tempMaxC" :min="-40" :max="30" :precision="1" style="width:130px">
                        <template #suffix>°C</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </n-card>

              <!-- Section 5: Страхование -->
              <n-card :title="t('driver.trailers.sectionInsurance')" embedded class="section-card">
                <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.insurancePolicyNum')">
                      <n-input v-model:value="form.insurancePolicyNum" style="width:100%;max-width:280px" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.insuranceExpiresAt')">
                      <n-date-picker
                        v-model:value="insuranceExpiresTs"
                        type="date"
                        clearable
                        style="width:200px"
                        @update:value="(v: number | null) => { form.insuranceExpiresAt = v ? formatDateOnlyFromMs(v) : null }"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </n-card>

              <!-- Section 6: Холодильный агрегат (conditional) -->
              <n-card v-if="formHasRefUnit" :title="t('driver.trailers.sectionRefUnit')" embedded class="section-card">
                <n-alert type="info" size="small" style="margin-bottom: 14px">
                  {{ t('driver.trailers.refSectionHint') }}
                </n-alert>
                <n-grid :cols="2" :x-gap="24" responsive="screen" item-responsive>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.refFuelType')">
                      <n-select v-model:value="form.refFuelType" :options="refFuelTypeOptions" clearable style="width:100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.refFuelTankL')">
                      <n-input-number v-model:value="form.refFuelTankL" :min="0" style="width:130px">
                        <template #suffix>л</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.refTransmission')">
                      <n-select v-model:value="form.refTransmission" :options="refTransmissionOptions" clearable style="width:100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi span="2 m:1">
                    <n-form-item :label="t('driver.trailers.refFuelConsumptionPh')">
                      <n-input-number v-model:value="form.refFuelConsumptionPh" :min="0" :precision="1" style="width:130px">
                        <template #suffix>л/ч</template>
                      </n-input-number>
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </n-card>

              <!-- Section 7: Владение -->
              <n-card :title="t('driver.trailers.sectionOwnership')" embedded class="section-card">
                <n-form-item :label="t('driver.trailers.ownership')">
                  <n-radio-group v-model:value="form.ownership">
                    <n-space>
                      <n-radio value="own">{{ t('driver.trailers.ownershipOwn') }}</n-radio>
                      <n-radio value="company">{{ t('driver.trailers.ownershipCompany') }}</n-radio>
                      <n-radio value="leased">{{ t('driver.trailers.ownershipLeased') }}</n-radio>
                    </n-space>
                  </n-radio-group>
                </n-form-item>
              </n-card>

              <n-space style="margin-top: 4px">
                <UiSaveBtn :loading="saving" @click="handleSave" />
                <UiCancelBtn @click="cancelEdit" />
              </n-space>
            </n-form>
          </template>
        </template>

        <n-empty v-else :description="t('driver.trailers.notFound')" />
      </template>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { TRAILER_BODY_TYPES, REEFER_BODY_TYPES, ADR_CLASSES } from '@tmgo/shared'

const { t, locale } = useI18n()
definePageMeta({ layout: 'cabinet-driver',  })

const route = useRoute()
const { apiBase: API } = useApiBase()
const message = useMessage()
const formRef = ref()
const loading = ref(true)
const saving = ref(false)
const decoupling = ref(false)
const error = ref<string | null>(null)
const trailer = ref<any>(null)
const activeCoupling = ref<any>(null)
const editMode = ref(false)
const currentYear = new Date().getFullYear()

// ── Options ────────────────────────────────────────────────────────
const bodyTypeOptions = computed(() =>
  TRAILER_BODY_TYPES.map((v) => ({
    label: locale.value === 'en' ? v.labelEn : v.label,
    value: v.id,
  }))
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
  { label: t('driver.trailers.transmissionRobotized'), value: 'robotized' },
])

// ── Display computed ───────────────────────────────────────────────
const bodyTypeLabel = computed(() => {
  const found = TRAILER_BODY_TYPES.find((x) => x.id === trailer.value?.bodyType)
  return found ? (locale.value === 'en' ? found.labelEn : found.label) : (trailer.value?.bodyType || '—')
})
const trailerTypeLabel = computed(() => {
  const tt = trailer.value?.trailerType
  if (tt === 'semi') return t('driver.trailers.trailerTypeSemi')
  if (tt === 'drawbar') return t('driver.trailers.trailerTypeDrawbar')
  return tt || '—'
})
const isReefer = computed(() => REEFER_BODY_TYPES.includes(trailer.value?.bodyType))
const hasRefUnit = computed(() => isReefer.value)
const ownershipLabel = computed(() => {
  const o = trailer.value?.ownership
  if (!o) return '—'
  if (o === 'own') return t('driver.trailers.ownershipOwn')
  if (o === 'company') return t('driver.trailers.ownershipCompany')
  if (o === 'leased') return t('driver.trailers.ownershipLeased')
  return o
})
const refFuelTypeLabel = computed(() => {
  const f = trailer.value?.refFuelType
  if (!f) return '—'
  if (f === 'diesel') return t('driver.trailers.fuelTypeDiesel')
  if (f === 'electric') return t('driver.trailers.fuelTypeElectric')
  return f.toUpperCase()
})
const refTransmissionLabel = computed(() => {
  const tr = trailer.value?.refTransmission
  if (!tr) return '—'
  if (tr === 'manual') return t('driver.trailers.transmissionManual')
  if (tr === 'automatic') return t('driver.trailers.transmissionAutomatic')
  if (tr === 'robotized') return t('driver.trailers.transmissionRobotized')
  return tr
})
const insuranceExpiresLabel = computed(() => {
  const d = trailer.value?.insuranceExpiresAt
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
})
const insuranceTagType = computed(() => {
  const d = trailer.value?.insuranceExpiresAt
  if (!d) return 'default'
  const ms = dateOnlyToPickerMs(String(d))
  if (ms == null) return 'default'
  const days = Math.ceil((ms - Date.now()) / 86400000)
  if (days < 0) return 'error'
  if (days < 30) return 'warning'
  return 'success'
})

function adrLabel(classId: string) {
  const found = ADR_CLASSES.find((c) => c.id === classId)
  return found ? (locale.value === 'en' ? found.labelEn : found.label) : classId
}

// ── Form ────────────────────────────────────────────────────────────
const form = reactive({
  bodyType: '' as string,
  trailerType: 'semi' as string,
  year: null as number | null,
  color: '',
  vin: '',
  chassisNumber: '',
  plateNumber: '',
  capacityTons: null as number | null,
  volumeM3: null as number | null,
  axleCount: null as number | null,
  palletPlaces: null as number | null,
  hasGps: false,
  adrClasses: [] as string[],
  tempMinC: null as number | null,
  tempMaxC: null as number | null,
  insurancePolicyNum: '',
  insuranceExpiresAt: null as string | null,
  refFuelType: null as string | null,
  refFuelTankL: null as number | null,
  refTransmission: null as string | null,
  refFuelConsumptionPh: null as number | null,
  ownership: null as string | null,
})

const formIsReefer = computed(() => REEFER_BODY_TYPES.includes(form.bodyType as any))
const formHasRefUnit = computed(() => formIsReefer.value)

const insuranceExpiresTs = computed({
  get: () => (dateOnlyToPickerMs(form.insuranceExpiresAt)),
  set: () => {},
})

watch(() => form.bodyType, (newVal) => {
  if (!REEFER_BODY_TYPES.includes(newVal as any)) {
    form.tempMinC = null
    form.tempMaxC = null
    form.refFuelType = null
    form.refFuelTankL = null
    form.refTransmission = null
    form.refFuelConsumptionPh = null
  }
})

function fillForm() {
  if (!trailer.value) return
  form.bodyType = trailer.value.bodyType || ''
  form.trailerType = trailer.value.trailerType || 'semi'
  form.year = trailer.value.year ? parseInt(trailer.value.year, 10) : null
  form.color = trailer.value.color || ''
  form.vin = trailer.value.vin || ''
  form.chassisNumber = trailer.value.chassisNumber || ''
  form.plateNumber = trailer.value.plateNumber || ''
  form.capacityTons = trailer.value.capacityTons != null ? Number(trailer.value.capacityTons) : null
  form.volumeM3 = trailer.value.volumeM3 != null ? Number(trailer.value.volumeM3) : null
  form.axleCount = trailer.value.axleCount ?? null
  form.palletPlaces = trailer.value.palletPlaces ?? null
  form.hasGps = trailer.value.hasGps ?? false
  form.adrClasses = Array.isArray(trailer.value.adrClasses) ? [...trailer.value.adrClasses] : []
  form.tempMinC = trailer.value.tempMinC != null ? Number(trailer.value.tempMinC) : null
  form.tempMaxC = trailer.value.tempMaxC != null ? Number(trailer.value.tempMaxC) : null
  form.insurancePolicyNum = trailer.value.insurancePolicyNum || ''
  form.insuranceExpiresAt = trailer.value.insuranceExpiresAt ? trailer.value.insuranceExpiresAt.slice(0, 10) : null
  form.refFuelType = trailer.value.refFuelType || null
  form.refFuelTankL = trailer.value.refFuelTankL != null ? Number(trailer.value.refFuelTankL) : null
  form.refTransmission = trailer.value.refTransmission || null
  form.refFuelConsumptionPh = trailer.value.refFuelConsumptionPh != null ? Number(trailer.value.refFuelConsumptionPh) : null
  form.ownership = trailer.value.ownership || null
}

function cancelEdit() {
  editMode.value = false
  fillForm()
}

// ── Loaders ─────────────────────────────────────────────────────────
async function loadTrailer() {
  loading.value = true
  error.value = null
  try {
    const [trailerData, couplingsData] = await Promise.all([
      $fetch<any>(`${API}/cabinet/driver/trailers/${route.params.id}`, { credentials: 'include' }),
      $fetch<any[]>(`${API}/cabinet/driver/couplings`, { credentials: 'include' }),
    ])
    if (trailerData?.error) {
      error.value = trailerData.error
      trailer.value = null
    } else {
      trailer.value = trailerData
      fillForm()
    }
    const couplings = Array.isArray(couplingsData) ? couplingsData : []
    activeCoupling.value = couplings.find((c: any) => c.trailer?.id === route.params.id) ?? null
  } catch (e: any) {
    error.value = e?.data?.error || t('common.loadError')
    trailer.value = null
  } finally {
    loading.value = false
  }
}

// ── Actions ─────────────────────────────────────────────────────────
async function handleSave() {
  if (!form.plateNumber) {
    message.warning(t('driver.trailers.plateRequired'))
    return
  }
  saving.value = true
  try {
    await $fetch(`${API}/cabinet/driver/trailers/${route.params.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        bodyType: form.bodyType || undefined,
        trailerType: form.trailerType || undefined,
        plateNumber: form.plateNumber,
        year: form.year ?? undefined,
        color: form.color || undefined,
        vin: form.vin || undefined,
        chassisNumber: form.chassisNumber || undefined,
        capacityTons: form.capacityTons ?? undefined,
        volumeM3: form.volumeM3 ?? undefined,
        axleCount: form.axleCount ?? undefined,
        palletPlaces: form.palletPlaces ?? undefined,
        hasGps: form.hasGps,
        adrClasses: form.adrClasses.length > 0 ? form.adrClasses : undefined,
        tempMinC: form.tempMinC ?? undefined,
        tempMaxC: form.tempMaxC ?? undefined,
        insurancePolicyNum: form.insurancePolicyNum || undefined,
        insuranceExpiresAt: form.insuranceExpiresAt || undefined,
        refFuelType: form.refFuelType || undefined,
        refFuelTankL: form.refFuelTankL ?? undefined,
        refTransmission: form.refTransmission || undefined,
        refFuelConsumptionPh: form.refFuelConsumptionPh ?? undefined,
        ownership: form.ownership || undefined,
      },
    })
    message.success(t('driver.trailers.saved'))
    editMode.value = false
    await loadTrailer()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally {
    saving.value = false
  }
}

async function handleDeactivate() {
  try {
    await $fetch(`${API}/cabinet/driver/trailers/${route.params.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    message.success(t('driver.trailers.deactivated'))
    navigateTo('/cabinet/driver/vehicles?tab=trailers')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  }
}

async function handleDecouple() {
  if (!activeCoupling.value) return
  decoupling.value = true
  try {
    await $fetch(`${API}/cabinet/driver/couplings/${activeCoupling.value.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    message.success(t('driver.couplings.decoupled'))
    activeCoupling.value = null
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally {
    decoupling.value = false
  }
}

watch(() => route.params.id, loadTrailer, { immediate: true })
</script>

<style scoped>
.trailer-detail {
  max-width: 960px;
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
