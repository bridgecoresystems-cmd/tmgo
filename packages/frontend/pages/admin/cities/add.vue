<template>
  <div style="max-width: 560px;">
    <n-h3>{{ $t('admin.citiesPage.addCity') }}</n-h3>

    <n-form :model="form" :rules="rules" ref="formRef" label-placement="top">
      <n-grid :cols="2" :x-gap="16">
        <n-gi>
          <n-form-item :label="$t('admin.citiesPage.labelName')" path="name">
            <n-input v-model:value="form.name" placeholder="Ashgabat" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item :label="$t('admin.citiesPage.labelNameRu')" path="nameRu">
            <n-input v-model:value="form.nameRu" placeholder="Ашхабад" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item :label="$t('admin.citiesPage.labelRegion')" path="region">
            <n-input v-model:value="form.region" placeholder="Ahal" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item :label="$t('admin.citiesPage.labelCountry')" path="country">
            <n-input v-model:value="form.country" placeholder="TM" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item :label="$t('admin.citiesPage.labelSortOrder')" path="sortOrder">
            <n-input-number v-model:value="form.sortOrder" :min="0" style="width: 100%;" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item :label="$t('admin.citiesPage.labelStatus')" path="isActive">
            <n-switch v-model:value="form.isActive">
              <template #checked>{{ $t('admin.citiesPage.statusActive') }}</template>
              <template #unchecked>{{ $t('admin.citiesPage.statusHidden') }}</template>
            </n-switch>
          </n-form-item>
        </n-gi>
      </n-grid>

      <n-space style="margin-top: 8px;">
        <n-button type="primary" :loading="loading" @click="handleSubmit">{{ $t('admin.citiesPage.save') }}</n-button>
        <n-button quaternary @click="navigateTo('/admin/cities')">{{ $t('admin.citiesPage.cancel') }}</n-button>
      </n-space>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

definePageMeta({ layout: 'admin',  })

const { t } = useI18n()
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

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('admin.citiesPage.nameRequired'), trigger: 'blur' }],
}))

async function handleSubmit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await $fetch(`${apiBase}/admin/cities`, {
      method: 'POST',
      body: form,
    })
    message.success(t('admin.citiesPage.cityAdded'))
    navigateTo('/admin/cities')
  } catch {
    message.error(t('admin.citiesPage.saveError'))
  } finally {
    loading.value = false
  }
}
</script>
