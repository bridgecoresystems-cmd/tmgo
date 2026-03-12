<template>
  <div style="max-width: 560px;">
    <n-h3>Добавить город</n-h3>

    <n-form :model="form" :rules="rules" ref="formRef" label-placement="top">
      <n-grid :cols="2" :x-gap="16">
        <n-gi>
          <n-form-item label="Название" path="name">
            <n-input v-model:value="form.name" placeholder="Ashgabat" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="Название (рус)" path="nameRu">
            <n-input v-model:value="form.nameRu" placeholder="Ашхабад" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="Регион" path="region">
            <n-input v-model:value="form.region" placeholder="Ahal" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="Страна" path="country">
            <n-input v-model:value="form.country" placeholder="TM" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="Порядок сортировки" path="sortOrder">
            <n-input-number v-model:value="form.sortOrder" :min="0" style="width: 100%;" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="Статус" path="isActive">
            <n-switch v-model:value="form.isActive">
              <template #checked>Активен</template>
              <template #unchecked>Скрыт</template>
            </n-switch>
          </n-form-item>
        </n-gi>
      </n-grid>

      <n-space style="margin-top: 8px;">
        <n-button type="primary" :loading="loading" @click="handleSubmit">Сохранить</n-button>
        <n-button quaternary @click="navigateTo('/admin/cities')">Отмена</n-button>
      </n-space>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { apiBase } = useApiBase()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const form = reactive({
  name: '',
  nameRu: '',
  region: '',
  country: 'TM',
  sortOrder: 0,
  isActive: true,
})

const rules: FormRules = {
  name: [{ required: true, message: 'Введите название', trigger: 'blur' }],
}

async function handleSubmit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await $fetch(`${apiBase}/admin/cities`, {
      method: 'POST',
      body: form,
    })
    message.success('Город добавлен')
    navigateTo('/admin/cities')
  } catch {
    message.error('Ошибка сохранения')
  } finally {
    loading.value = false
  }
}
</script>
