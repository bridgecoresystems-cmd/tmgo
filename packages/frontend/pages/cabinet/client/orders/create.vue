<template>
  <div style="max-width: 800px; margin: 0 auto;">
    <UiBackBtn to="/cabinet/client/orders" />

    <n-card :title="t('client.orders.newOrder')" style="margin-top: 16px;">
      <n-steps :current="step" style="margin-bottom: 28px;">
        <n-step :title="t('client.orders.step1Title')" :description="t('client.orders.step1Desc')" />
        <n-step :title="t('client.orders.step2Title')" :description="t('client.orders.step2Desc')" />
      </n-steps>

      <!-- Step 1: Route + Dates + Price -->
      <div v-show="step === 1">
        <n-form ref="form1Ref" :model="form" label-placement="top">
          <n-form-item :label="t('client.orders.title')" path="title" required>
            <n-input
              v-model:value="form.title"
              :placeholder="t('client.orders.titlePlaceholder')"
            />
          </n-form-item>

          <n-divider title-placement="left">{{ t('client.orders.route') }}</n-divider>
          <n-grid :cols="2" :x-gap="16">
            <n-gi>
              <n-form-item :label="t('client.orders.fromCountry')" path="fromCountry" required>
                <n-select
                  v-model:value="form.fromCountry"
                  :options="countryOptions"
                  :placeholder="t('client.orders.selectCountry')"
                  filterable
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="t('client.orders.fromCity')" path="fromCity" required>
                <n-input v-model:value="form.fromCity" :placeholder="t('client.orders.cityPlaceholder')" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="t('client.orders.toCountry')" path="toCountry" required>
                <n-select
                  v-model:value="form.toCountry"
                  :options="countryOptions"
                  :placeholder="t('client.orders.selectCountry')"
                  filterable
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="t('client.orders.toCity')" path="toCity" required>
                <n-input v-model:value="form.toCity" :placeholder="t('client.orders.cityPlaceholder')" />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-divider title-placement="left">{{ t('client.orders.dates') }}</n-divider>
          <n-grid :cols="2" :x-gap="16">
            <n-gi>
              <n-form-item :label="t('client.orders.readyDate')" path="readyDate" required>
                <n-date-picker
                  v-model:value="readyDateMs"
                  type="date"
                  :placeholder="t('client.orders.selectDate')"
                  style="width: 100%"
                  :is-date-disabled="isPastDate"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="t('client.orders.deadlineDate')">
                <n-date-picker
                  v-model:value="deadlineDateMs"
                  type="date"
                  :placeholder="t('client.orders.selectDate')"
                  style="width: 100%"
                  clearable
                  :is-date-disabled="isPastDate"
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-divider title-placement="left">{{ t('client.orders.pricing') }}</n-divider>
          <n-grid :cols="2" :x-gap="16">
            <n-gi>
              <n-form-item :label="t('client.orders.price')">
                <n-input-number
                  v-model:value="form.price"
                  :min="0"
                  :precision="2"
                  :placeholder="t('client.orders.pricePlaceholder')"
                  style="width: 100%"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="t('client.orders.currency')">
                <n-select v-model:value="form.currency" :options="currencyOptions" style="width: 100%" />
              </n-form-item>
            </n-gi>
          </n-grid>
        </n-form>

        <div style="text-align: right; margin-top: 8px;">
          <n-button type="primary" :disabled="!canGoStep2" @click="step = 2">
            {{ t('common.next') }}
          </n-button>
        </div>
      </div>

      <!-- Step 2: Cargo -->
      <div v-show="step === 2">
        <n-form ref="form2Ref" :model="form" label-placement="top">
          <n-grid :cols="2" :x-gap="16">
            <n-gi :span="2">
              <n-form-item :label="t('client.orders.cargoType')" path="cargo.cargoType" required>
                <n-input
                  v-model:value="form.cargo.cargoType"
                  :placeholder="t('client.orders.cargoTypePlaceholder')"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="t('client.orders.weightKg')">
                <n-input-number v-model:value="form.cargo.weightKg" :min="0" :precision="2" style="width: 100%" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="t('client.orders.volumeM3')">
                <n-input-number v-model:value="form.cargo.volumeM3" :min="0" :precision="3" style="width: 100%" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="t('client.orders.packaging')">
                <n-select
                  v-model:value="form.cargo.packaging"
                  :options="packagingOptions"
                  clearable
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="t('client.orders.tempControlled')">
                <n-switch v-model:value="form.cargo.tempControlled" />
              </n-form-item>
            </n-gi>
            <template v-if="form.cargo.tempControlled">
              <n-gi>
                <n-form-item :label="t('client.orders.tempMin') + ' (°C)'">
                  <n-input-number v-model:value="form.cargo.tempMin" :precision="1" style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('client.orders.tempMax') + ' (°C)'">
                  <n-input-number v-model:value="form.cargo.tempMax" :precision="1" style="width: 100%" />
                </n-form-item>
              </n-gi>
            </template>
            <n-gi :span="2">
              <n-form-item :label="t('client.orders.cargoNotes')">
                <n-input
                  v-model:value="form.cargo.notes"
                  type="textarea"
                  :rows="3"
                  :placeholder="t('client.orders.cargoNotesPlaceholder')"
                />
              </n-form-item>
            </n-gi>
          </n-grid>
        </n-form>

        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
          <n-button @click="step = 1">{{ t('common.back') }}</n-button>
          <UiSaveBtn :loading="creating" :label="t('client.orders.createOrder')" @click="handleCreate" />
        </div>
      </div>

    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { dateOnlyToPickerMs } from '~/utils/dateOnly'

definePageMeta({ layout: 'cabinet-client' })

const { t } = useI18n()
const { apiBase: API } = useApiBase()
const { COUNTRY_LIST } = useCountryConfig()
const message = useMessage()

const step = ref(1)
const creating = ref(false)
const form1Ref = ref()
const form2Ref = ref()

const readyDateMs = ref<number | null>(null)
const deadlineDateMs = ref<number | null>(null)

const form = reactive({
  title: '',
  fromCountry: null as string | null,
  fromCity: '',
  toCountry: null as string | null,
  toCity: '',
  price: null as number | null,
  currency: 'USD',
  cargo: {
    cargoType: '',
    weightKg: null as number | null,
    volumeM3: null as number | null,
    packaging: null as string | null,
    tempControlled: false,
    tempMin: null as number | null,
    tempMax: null as number | null,
    notes: '',
  },
})

const countryOptions = computed(() =>
  COUNTRY_LIST.map(c => ({ label: `${c.flag} ${c.name}`, value: c.code }))
)

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'TMT', value: 'TMT' },
  { label: 'RUB', value: 'RUB' },
]

const packagingOptions = computed(() => [
  { label: t('client.orders.packagingBulk'), value: 'bulk' },
  { label: t('client.orders.packagingBoxes'), value: 'boxes' },
  { label: t('client.orders.packagingPallets'), value: 'pallets' },
  { label: t('client.orders.packagingContainer'), value: 'container' },
  { label: t('client.orders.packagingOther'), value: 'other' },
])

const canGoStep2 = computed(() =>
  form.title && form.fromCountry && form.fromCity && form.toCountry && form.toCity && readyDateMs.value
)

function isPastDate(ts: number) {
  return ts < Date.now() - 24 * 60 * 60 * 1000
}

function msToDateString(ms: number | null): string | undefined {
  if (!ms) return undefined
  return new Date(ms).toISOString().split('T')[0]
}

async function handleCreate() {
  if (!form.cargo.cargoType) {
    message.warning(t('client.orders.cargoTypeRequired'))
    return
  }
  creating.value = true
  try {
    const data = await $fetch<any>(`${API}/cabinet/orders`, {
      method: 'POST',
      credentials: 'include',
      body: {
        title: form.title,
        fromCountry: form.fromCountry,
        fromCity: form.fromCity,
        toCountry: form.toCountry,
        toCity: form.toCity,
        readyDate: msToDateString(readyDateMs.value)!,
        deadlineDate: msToDateString(deadlineDateMs.value),
        price: form.price ?? undefined,
        currency: form.currency,
        cargo: {
          cargoType: form.cargo.cargoType,
          weightKg: form.cargo.weightKg ?? undefined,
          volumeM3: form.cargo.volumeM3 ?? undefined,
          packaging: form.cargo.packaging ?? undefined,
          tempControlled: form.cargo.tempControlled,
          tempMin: form.cargo.tempControlled ? (form.cargo.tempMin ?? undefined) : undefined,
          tempMax: form.cargo.tempControlled ? (form.cargo.tempMax ?? undefined) : undefined,
          notes: form.cargo.notes || undefined,
        },
      },
    })
    if (data.error === 'profile_required') {
      message.warning(t('client.orders.profileRequired'))
      navigateTo('/cabinet/client/verification')
      return
    }
    message.success(t('client.orders.orderCreated'))
    navigateTo(`/cabinet/client/orders/${data.order.id}`)
  } catch (e: any) {
    if (e?.data?.error === 'profile_required') {
      message.warning(t('client.orders.profileRequired'))
      navigateTo('/cabinet/client/verification')
    } else {
      message.error(e?.data?.message ?? t('common.error'))
    }
  } finally {
    creating.value = false
  }
}
</script>
