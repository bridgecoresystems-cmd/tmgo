<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/cabinet/client/orders')">
      ← Назад к списку
    </n-button>

    <n-card title="Новый заказ">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-grid :cols="3" :x-gap="16">
          <n-gi>
            <n-form-item label="Откуда" path="from_city_id" required>
              <n-select
                v-model:value="form.from_city_id"
                :options="cityOptions"
                placeholder="Выберите город"
                filterable
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
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Цена (TMT)" path="price" required>
              <n-input-number v-model:value="form.price" :min="0.01" :precision="2" placeholder="0.00" style="width: 100%" />
            </n-form-item>
          </n-gi>
          <n-gi :span="3">
            <n-form-item label="Наименование товара" path="cargo_name">
              <n-input v-model:value="form.cargo_name" placeholder="Например: Мебель офисная" />
            </n-form-item>
          </n-gi>
          <n-gi :span="3">
            <n-form-item label="Описание товара" path="cargo_description">
              <n-input v-model:value="form.cargo_description" type="textarea" placeholder="Подробное описание груза" :rows="3" />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-space>
          <n-button type="primary" :loading="creating" @click="handleCreate">Создать заказ</n-button>
          <n-button @click="navigateTo('/cabinet/client/orders')">Отмена</n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet-client', middleware: 'cabinet-auth' })

const API = 'http://localhost:8000'
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
    message.success('Заказ создан')
    navigateTo('/cabinet/client/orders')
  } catch (e: any) {
    if (e?.data?.message) message.error(e.data.message)
  } finally {
    creating.value = false
  }
}

onMounted(loadCities)
</script>
