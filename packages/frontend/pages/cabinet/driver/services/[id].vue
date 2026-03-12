<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/cabinet/driver/services')">← Назад к списку</n-button>

    <n-card v-if="service" title="Редактировать услугу">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-grid :cols="3" :x-gap="16">
          <n-gi>
            <n-form-item label="Откуда" path="from_city_id" required>
              <n-select v-model:value="form.from_city_id" :options="cityOptions" placeholder="Выберите город" filterable />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Куда" path="to_city_id" required>
              <n-select v-model:value="form.to_city_id" :options="cityOptions" placeholder="Выберите город" filterable />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Транспорт" path="vehicle_id" required>
              <n-select v-model:value="form.vehicle_id" :options="vehicleOptions" placeholder="Выберите ТС" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Цена (TMT)" path="price" required>
              <n-input-number v-model:value="form.price" :min="0.01" :precision="2" style="width: 100%" />
            </n-form-item>
          </n-gi>
          <n-gi :span="3">
            <n-form-item label="Описание услуги" path="description">
              <n-input v-model:value="form.description" type="textarea" placeholder="Опишите услугу" :rows="3" />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-space>
          <n-button type="primary" :loading="saving" @click="handleSave">Сохранить</n-button>
          <n-button @click="navigateTo('/cabinet/driver/services')">Отмена</n-button>
        </n-space>
      </n-form>
    </n-card>

    <div v-else-if="!loading" style="padding: 40px; text-align: center">
      <n-empty description="Услуга не найдена" />
    </div>
    <div v-else style="padding: 40px; text-align: center">
      <n-spin size="large" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const API = 'http://localhost:8000'
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

const rules = {
  from_city_id: { required: true, message: 'Выберите город', trigger: 'blur' },
  to_city_id: { required: true, message: 'Выберите город', trigger: 'blur' },
  vehicle_id: { required: true, message: 'Выберите транспорт', trigger: 'blur' },
  price: { required: true, type: 'number', min: 0.01, message: 'Введите цену', trigger: 'blur' },
}

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
    message.error(e?.data?.error || 'Ошибка загрузки')
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
    message.success('Услуга сохранена')
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
