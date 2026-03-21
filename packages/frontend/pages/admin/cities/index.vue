<template>
  <div class="admin-cities">
    <n-alert v-if="loadError" type="error" closable style="margin-bottom: 16px">
      {{ loadError }}
      <template #footer>
        <n-button size="small" @click="fetchCities">{{ t('admin.citiesPage.retry') }}</n-button>
      </template>
    </n-alert>
    <n-card :title="t('admin.citiesPage.directionManagement')" class="shadow-sm">
      <template #header-extra>
        <n-button type="primary" @click="showAddModal = true">
          {{ t('admin.citiesPage.addCity') }}
        </n-button>
      </template>

      <n-tabs type="line" animated>
        <n-tab-pane name="from" :tab="t('admin.citiesPage.fromTab')">
          <n-data-table :columns="columns" :data="fromCities" :bordered="false" />
        </n-tab-pane>
        <n-tab-pane name="to" :tab="t('admin.citiesPage.toTab')">
          <n-data-table :columns="columns" :data="toCities" :bordered="false" />
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <n-modal v-model:show="showAddModal" preset="card" :title="t('admin.citiesPage.addNewCity')" style="width: 400px">
      <n-form :model="newCity">
        <n-form-item :label="t('admin.citiesPage.cityName')">
          <n-input v-model:value="newCity.name" :placeholder="t('admin.citiesPage.cityNamePlaceholder')" />
        </n-form-item>
        <n-form-item :label="t('admin.citiesPage.directionType')">
          <n-select v-model:value="newCity.type" :options="typeOptions" />
        </n-form-item>
        <n-button type="primary" block @click="handleAddCity" :loading="loading">
          {{ t('admin.citiesPage.save') }}
        </n-button>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { NButton, NSpace, useMessage } from 'naive-ui'

definePageMeta({ layout: 'admin' })
const { t } = useI18n()
const { apiBase } = useApiBase()
const message = useMessage()
const loading = ref(false)
const loadError = ref<string | null>(null)
const showAddModal = ref(false)
const allCities = ref<any[]>([])

const newCity = reactive({
  name: '',
  type: 'BOTH'
})

const typeOptions = computed(() => [
  { label: t('admin.citiesPage.typeAll'), value: 'BOTH' },
  { label: t('admin.citiesPage.typeFrom'), value: 'FROM' },
  { label: t('admin.citiesPage.typeTo'), value: 'TO' }
])

const fetchCities = async () => {
  loadError.value = null
  try {
    const data = await $fetch(`${apiBase || ''}/admin/cities`, { credentials: 'include' })
    allCities.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    const err = e?.data?.message || e?.message || t('admin.citiesPage.loadError')
    loadError.value = err
    message.error(err)
    if (import.meta.dev) console.error('Admin cities fetch failed:', e)
  }
}

const handleAddCity = async () => {
  loading.value = true
  try {
    await $fetch(`${apiBase}/admin/cities`, {
      method: 'POST',
      body: {
        name: newCity.name,
        type: newCity.type,
        isActive: true
      }
    })
    message.success(t('admin.citiesPage.cityAdded'))
    showAddModal.value = false
    newCity.name = ''
    await fetchCities()
  } catch (e) {
    message.error(t('admin.citiesPage.addError'))
  } finally {
    loading.value = false
  }
}

const deleteCity = async (id: string) => {
  try {
    await $fetch(`${apiBase}/admin/cities/${id}`, { method: 'DELETE' })
    message.success(t('admin.citiesPage.deleted'))
    await fetchCities()
  } catch (e) {
    message.error(t('admin.citiesPage.deleteError'))
  }
}

const fromCities = computed(() => (Array.isArray(allCities.value) ? allCities.value : []).filter(c => c.type === 'FROM' || c.type === 'BOTH'))
const toCities = computed(() => (Array.isArray(allCities.value) ? allCities.value : []).filter(c => c.type === 'TO' || c.type === 'BOTH'))

const columns = computed(() => [
  { title: t('admin.citiesPage.columnName'), key: 'name' },
  { title: t('admin.citiesPage.columnType'), key: 'type' },
  {
    title: t('admin.citiesPage.columnActions'),
    key: 'actions',
    render(row: any) {
      return h(NButton, { size: 'small', type: 'error', quaternary: true, onClick: () => deleteCity(row.id) }, { default: () => '🗑️' })
    }
  }
])

onMounted(fetchCities)
</script>
