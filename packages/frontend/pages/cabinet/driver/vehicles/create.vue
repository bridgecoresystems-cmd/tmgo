<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/cabinet/driver/vehicles')">
      ← Назад к списку
    </n-button>

    <n-card title="Добавить транспорт">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-form-item label="Гос. номер" path="plate_number" required>
          <n-input v-model:value="form.plate_number" placeholder="01 A 12345" />
        </n-form-item>
        <n-form-item label="Тип" path="type">
          <n-select v-model:value="form.type" :options="typeOptions" />
        </n-form-item>
        <n-form-item label="Грузоподъёмность (т)" path="capacity">
          <n-input-number v-model:value="form.capacity" :min="0.1" :precision="2" style="width: 100%" />
        </n-form-item>
        <n-form-item label="Объём (м³)" path="volume">
          <n-input-number v-model:value="form.volume" :min="0.1" :precision="2" style="width: 100%" />
        </n-form-item>
        <n-space>
          <n-button type="primary" :loading="creating" @click="handleCreate">Добавить</n-button>
          <n-button @click="navigateTo('/cabinet/driver/vehicles')">Отмена</n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const { apiBase: API } = useApiBase()
const message = useMessage()
const formRef = ref()
const creating = ref(false)

const form = reactive({
  plate_number: '',
  type: 'truck',
  capacity: 1,
  volume: 1,
})

const typeOptions = [
  { label: 'Грузовик', value: 'truck' },
  { label: 'Фургон', value: 'van' },
  { label: 'Тент', value: 'tent' },
  { label: 'Рефрижератор', value: 'refrigerator' },
]

const rules = {
  plate_number: { required: true, message: 'Введите гос. номер', trigger: 'blur' },
}

async function handleCreate() {
  try {
    await formRef.value?.validate()
    creating.value = true
    await $fetch(`${API}/cabinet/driver/vehicles`, {
      method: 'POST',
      credentials: 'include',
      body: {
        plate_number: form.plate_number,
        type: form.type,
        capacity: form.capacity,
        volume: form.volume,
      },
    })
    message.success('Транспорт добавлен')
    navigateTo('/cabinet/driver/vehicles')
  } catch (e: any) {
    if (e?.data?.error) message.error(e.data.error)
  } finally {
    creating.value = false
  }
}
</script>
