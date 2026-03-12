<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo(`/cabinet/client/orders/${route.params.id}`)">
      ← Назад к заказу
    </n-button>

    <n-card title="Редактировать заказ">
      <div v-if="loading" style="padding: 40px; text-align: center">
        <n-spin size="large" />
      </div>

      <n-form v-else-if="order" ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-alert v-if="order.status !== 'PENDING'" type="warning" style="margin-bottom: 16px">
          Редактирование возможно только для заказов со статусом «Ожидание».
        </n-alert>

        <n-grid :cols="3" :x-gap="16">
          <n-gi>
            <n-form-item label="Откуда" path="from_city_id" required>
              <n-select
                v-model:value="form.from_city_id"
                :options="cityOptions"
                placeholder="Выберите город"
                filterable
                :disabled="order.status !== 'PENDING'"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Куда" path="to_city_id" required>
              <n-select
                v-model:value="form.to_city_id"
                :options="cityOptions"
                placeholder="Выберите город"
                filterable
                :disabled="order.status !== 'PENDING'"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Цена (TMT)" path="price" required>
              <n-input-number v-model:value="form.price" :min="0.01" :precision="2" placeholder="0.00" style="width: 100%" :disabled="order.status !== 'PENDING'" />
            </n-form-item>
          </n-gi>
          <n-gi :span="3">
            <n-form-item label="Наименование товара" path="cargo_name">
              <n-input v-model:value="form.cargo_name" placeholder="Например: Мебель офисная" :disabled="order.status !== 'PENDING'" />
            </n-form-item>
          </n-gi>
          <n-gi :span="3">
            <n-form-item label="Описание товара" path="cargo_description">
              <n-input v-model:value="form.cargo_description" type="textarea" placeholder="Подробное описание груза" :rows="3" :disabled="order.status !== 'PENDING'" />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-space v-if="order.status === 'PENDING'">
          <n-button type="primary" :loading="saving" @click="handleSave">Сохранить</n-button>
          <n-button @click="navigateTo(`/cabinet/client/orders/${route.params.id}`)">Отмена</n-button>
        </n-space>
      </n-form>

      <n-empty v-else description="Заказ не найден" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet-client', middleware: 'cabinet-auth' })

const { apiBase: API } = useApiBase()
const message = useMessage()
const route = useRoute()
const formRef = ref()
const loading = ref(true)
const saving = ref(false)
const order = ref<any>(null)
const allCities = ref<any[]>([])

const form = reactive({
  from_city_id: null as string | null,
  to_city_id: null as string | null,
  price: null as number | null,
  cargo_name: '' as string,
  cargo_description: '' as string,
})

const rules = {
  from_city_id: { required: true, message: 'Выберите город', trigger: 'blur' },
  to_city_id: { required: true, message: 'Выберите город', trigger: 'blur' },
  price: { required: true, type: 'number', min: 0.01, message: 'Введите цену', trigger: 'blur' },
}

const cityOptions = computed(() =>
  allCities.value.map((c) => ({ label: c.name, value: c.id }))
)

async function loadCities() {
  try {
    allCities.value = await $fetch<any[]>(`${API}/cities`)
  } catch {
    message.error('Ошибка загрузки городов')
  }
}

async function loadOrder() {
  loading.value = true
  try {
    order.value = await $fetch<any>(`${API}/cabinet/orders/${route.params.id}`, { credentials: 'include' })
    form.from_city_id = order.value.from_city_id
    form.to_city_id = order.value.to_city_id
    form.price = parseFloat(order.value.price) || null
    form.cargo_name = order.value.cargo_name || ''
    form.cargo_description = order.value.cargo_description || ''
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  try {
    await formRef.value?.validate()
    saving.value = true
    await $fetch(`${API}/cabinet/orders/${route.params.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        from_city_id: form.from_city_id,
        to_city_id: form.to_city_id,
        price: form.price,
        cargo_name: form.cargo_name || undefined,
        cargo_description: form.cargo_description || undefined,
      },
    })
    message.success('Заказ сохранён')
    navigateTo(`/cabinet/client/orders/${route.params.id}`)
  } catch (e: any) {
    if (e?.data?.error) message.error(e.data.error)
    else if (e?.data?.message) message.error(e.data.message)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadCities()
  await loadOrder()
})
</script>
