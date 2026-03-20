<template>
  <div>
    <UiBackBtn to="/cabinet/driver/services" />

    <n-card v-if="service" :title="t('driver.services.editService')">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-grid :cols="3" :x-gap="16">
          <n-gi>
            <n-form-item :label="t('common.from')" path="from_city_id" required>
              <n-select v-model:value="form.from_city_id" :options="cityOptions" :placeholder="t('driver.services.selectCity')" filterable />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item :label="t('common.to')" path="to_city_id" required>
              <n-select v-model:value="form.to_city_id" :options="cityOptions" :placeholder="t('driver.services.selectCity')" filterable />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item :label="t('common.transport')" path="vehicle_id" required>
              <n-select v-model:value="form.vehicle_id" :options="vehicleOptions" :placeholder="t('common.selectVehicle')" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item :label="t('driver.services.priceTmt')" path="price" required>
              <n-input-number v-model:value="form.price" :min="0.01" :precision="2" style="width: 100%" />
            </n-form-item>
          </n-gi>
          <n-gi :span="3">
            <n-form-item :label="t('driver.services.serviceDescription')" path="description">
              <n-input v-model:value="form.description" type="textarea" :placeholder="t('driver.services.descriptionPlaceholder')" :rows="3" />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-space>
          <UiSaveBtn :loading="saving" @click="handleSave" />
          <UiCancelBtn @click="navigateTo('/cabinet/driver/services')" />
        </n-space>
      </n-form>
    </n-card>

    <div v-else-if="!loading" style="padding: 40px; text-align: center">
      <n-empty :description="t('driver.services.serviceNotFound')" />
    </div>
    <div v-else style="padding: 40px; text-align: center">
      <n-spin size="large" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver',  })

const { apiBase: API } = useApiBase()
const message = useMessage()
const route = useRoute()
const formRef = ref()
const loading = ref(true)
const saving = ref(false)
const service = ref<any>(null)
const allCities = ref<any[]>([])
const vehicles = ref<any[]>([])

const form = reactive({
  from_city_id: null as string | null,
  to_city_id: null as string | null,
  vehicle_id: null as string | null,
  price: null as number | null,
  description: '' as string,
})

const rules = computed(() => ({
  from_city_id: { required: true, message: t('driver.services.selectCityRequired'), trigger: 'blur' },
  to_city_id: { required: true, message: t('driver.services.selectCityRequired'), trigger: 'blur' },
  vehicle_id: { required: true, message: t('driver.services.selectVehicleRequired'), trigger: 'blur' },
  price: { required: true, type: 'number', min: 0.01, message: t('driver.services.enterPrice'), trigger: 'blur' },
}))

const cityOptions = computed(() => allCities.value.map((c) => ({ label: c.name, value: c.id })))
const vehicleOptions = computed(() => vehicles.value.map((v) => ({ label: `${v.plate_number} (${v.type})`, value: v.id })))

async function loadData() {
  try {
    const [citiesData, veh] = await Promise.all([
      $fetch<any[]>(`${API}/cities`),
      $fetch<any[]>(`${API}/cabinet/driver/vehicles`, { credentials: 'include' }),
    ])
    allCities.value = citiesData
    vehicles.value = veh
  } catch (e: any) {
    message.error(e?.data?.error || t('common.loadError'))
  }
}

async function loadService() {
  loading.value = true
  try {
    service.value = await $fetch<any>(`${API}/cabinet/driver/services/${route.params.id}`, { credentials: 'include' })
    form.from_city_id = service.value.from_city_id
    form.to_city_id = service.value.to_city_id
    form.vehicle_id = service.value.vehicle_id
    form.price = parseFloat(service.value.price) || null
    form.description = service.value.description || ''
  } catch {
    service.value = null
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  try {
    await formRef.value?.validate()
    saving.value = true
    await $fetch(`${API}/cabinet/driver/services/${route.params.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        from_city_id: form.from_city_id,
        to_city_id: form.to_city_id,
        vehicle_id: form.vehicle_id,
        price: form.price,
        description: form.description || undefined,
      },
    })
    message.success(t('driver.services.serviceSaved'))
    navigateTo('/cabinet/driver/services')
  } catch (e: any) {
    if (e?.data?.error) message.error(e.data.error)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadData()
  await loadService()
})
</script>
