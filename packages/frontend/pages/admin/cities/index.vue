<template>
  <div class="admin-cities">
    <n-card title="Управление направлениями" class="shadow-sm">
      <template #header-extra>
        <n-button type="primary" @click="showAddModal = true">
          Добавить город
        </n-button>
      </template>

      <n-tabs type="line" animated>
        <n-tab-pane name="from" tab="Откуда (Пункт отправления)">
          <n-data-table :columns="columns" :data="fromCities" :bordered="false" />
        </n-tab-pane>
        <n-tab-pane name="to" tab="Куда (Пункт назначения)">
          <n-data-table :columns="columns" :data="toCities" :bordered="false" />
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <n-modal v-model:show="showAddModal" preset="card" title="Добавить новый город" style="width: 400px">
      <n-form :model="newCity">
        <n-form-item label="Название города">
          <n-input v-model:value="newCity.name" placeholder="Напр. Ашхабад" />
        </n-form-item>
        <n-form-item label="Тип направления">
          <n-select v-model:value="newCity.type" :options="typeOptions" />
        </n-form-item>
        <n-button type="primary" block @click="handleAddCity" :loading="loading">
          Сохранить
        </n-button>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { NButton, NSpace, useMessage } from 'naive-ui'

definePageMeta({ layout: 'admin' })
const { apiBase } = useApiBase()
const message = useMessage()
const loading = ref(false)
const showAddModal = ref(false)
const allCities = ref<any[]>([])

const newCity = reactive({
  name: '',
  type: 'BOTH'
})

const typeOptions = [
  { label: 'Везде', value: 'BOTH' },
  { label: 'Только Откуда', value: 'FROM' },
  { label: 'Только Куда', value: 'TO' }
]

const fetchCities = async () => {
  try {
    const data = await $fetch(`${apiBase}/admin/cities`)
    allCities.value = data as any[]
  } catch (e) {
    message.error('Ошибка при загрузке городов')
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
    message.success('Город добавлен')
    showAddModal.value = false
    newCity.name = ''
    await fetchCities()
  } catch (e) {
    message.error('Ошибка при добавлении')
  } finally {
    loading.value = false
  }
}

const deleteCity = async (id: string) => {
  try {
    await $fetch(`${apiBase}/admin/cities/${id}`, { method: 'DELETE' })
    message.success('Удалено')
    await fetchCities()
  } catch (e) {
    message.error('Ошибка удаления')
  }
}

const fromCities = computed(() => allCities.value.filter(c => c.type === 'FROM' || c.type === 'BOTH'))
const toCities = computed(() => allCities.value.filter(c => c.type === 'TO' || c.type === 'BOTH'))

const columns = [
  { title: 'Название', key: 'name' },
  { title: 'Тип', key: 'type' },
  {
    title: 'Действия',
    key: 'actions',
    render(row: any) {
      return h(NButton, { size: 'small', type: 'error', quaternary: true, onClick: () => deleteCity(row.id) }, { default: () => '🗑️' })
    }
  }
]

onMounted(fetchCities)
</script>
