<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/cabinet/driver/vehicles')">
      {{ t('common.backToList') }}
    </n-button>

    <n-card :title="t('driver.vehicles.addTitle')">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-form-item :label="t('driver.vehicles.plateNumber')" path="plate_number" required>
          <n-input v-model:value="form.plate_number" placeholder="01 A 12345" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.type')" path="type">
          <n-select v-model:value="form.type" :options="typeOptions" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.capacityTons')" path="capacity">
          <n-input-number v-model:value="form.capacity" :min="0.1" :precision="2" style="width: 100%" />
        </n-form-item>
        <n-form-item :label="t('driver.vehicles.volumeM3')" path="volume">
          <n-input-number v-model:value="form.volume" :min="0.1" :precision="2" style="width: 100%" />
        </n-form-item>
        <n-space>
          <n-button type="primary" :loading="creating" @click="handleCreate">{{ t('common.add') }}</n-button>
          <n-button @click="navigateTo('/cabinet/driver/vehicles')">{{ t('common.cancel') }}</n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t } = useI18n()
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

const typeOptions = computed(() => [
  { label: t('driver.vehicles.typeTruck'), value: 'truck' },
  { label: t('driver.vehicles.typeVan'), value: 'van' },
  { label: t('driver.vehicles.typeTent'), value: 'tent' },
  { label: t('driver.vehicles.typeRefrigerator'), value: 'refrigerator' },
])

const rules = computed(() => ({
  plate_number: { required: true, message: t('driver.vehicles.plateRequired'), trigger: 'blur' },
}))

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
    message.success(t('driver.vehicles.added'))
    navigateTo('/cabinet/driver/vehicles')
  } catch (e: any) {
    if (e?.data?.error) message.error(e.data.error)
  } finally {
    creating.value = false
  }
}
</script>
