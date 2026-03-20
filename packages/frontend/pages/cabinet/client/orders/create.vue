<template>
  <div>
    <UiBackBtn to="/cabinet/client/orders" />

    <n-card :title="t('client.orders.newOrder')">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-grid :cols="3" :x-gap="16">
          <n-gi>
            <n-form-item :label="t('common.from')" path="from_city_id" required>
              <n-select
                v-model:value="form.from_city_id"
                :options="cityOptions"
                :placeholder="t('client.orders.selectCity')"
                filterable
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item :label="t('common.to')" path="to_city_id" required>
              <n-select
                v-model:value="form.to_city_id"
                :options="cityOptions"
                :placeholder="t('client.orders.selectCity')"
                filterable
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item :label="t('client.orders.priceTmt')" path="price" required>
              <n-input-number v-model:value="form.price" :min="0.01" :precision="2" placeholder="0.00" style="width: 100%" />
            </n-form-item>
          </n-gi>
          <n-gi :span="3">
            <n-form-item :label="t('client.orders.cargoName')" path="cargo_name">
              <n-input v-model:value="form.cargo_name" :placeholder="t('client.orders.cargoNamePlaceholder')" />
            </n-form-item>
          </n-gi>
          <n-gi :span="3">
            <n-form-item :label="t('client.orders.cargoDescriptionLabel')" path="cargo_description">
              <n-input v-model:value="form.cargo_description" type="textarea" :placeholder="t('client.orders.cargoDescriptionPlaceholder')" :rows="3" />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-space>
          <UiSaveBtn :loading="creating" :label="t('client.orders.createOrder')" @click="handleCreate" />
          <UiCancelBtn @click="navigateTo('/cabinet/client/orders')" />
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t } = useI18n()
definePageMeta({ layout: 'cabinet-client',  })

const { apiBase: API } = useApiBase()
const message = useMessage()
const formRef = ref()
const creating = ref(false)
const allCities = ref<any[]>([])

const form = reactive({
  from_city_id: null as string | null,
  to_city_id: null as string | null,
  price: null as number | null,
  cargo_name: '' as string,
  cargo_description: '' as string,
})

const rules = computed(() => ({
  from_city_id: { required: true, message: t('client.orders.selectCityRequired'), trigger: 'blur' },
  to_city_id: { required: true, message: t('client.orders.selectCityRequired'), trigger: 'blur' },
  price: { required: true, type: 'number', min: 0.01, message: t('client.orders.enterPrice'), trigger: 'blur' },
}))

const cityOptions = computed(() =>
  allCities.value.map((c) => ({ label: c.name, value: c.id }))
)

async function loadCities() {
  try {
    allCities.value = await $fetch<any[]>(`${API}/cities`)
  } catch {
    message.error(t('client.orders.loadCitiesError'))
  }
}

async function handleCreate() {
  try {
    await formRef.value?.validate()
    creating.value = true
    await $fetch(`${API}/cabinet/orders`, {
      method: 'POST',
      credentials: 'include',
      body: {
        from_city_id: form.from_city_id,
        to_city_id: form.to_city_id,
        price: form.price,
        cargo_name: form.cargo_name || undefined,
        cargo_description: form.cargo_description || undefined,
      },
    })
    message.success(t('client.orders.orderCreated'))
    navigateTo('/cabinet/client/orders')
  } catch (e: any) {
    if (e?.data?.message) message.error(e.data.message)
  } finally {
    creating.value = false
  }
}

onMounted(loadCities)
</script>
