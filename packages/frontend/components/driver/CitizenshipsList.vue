<template>
  <div class="citizenships-list">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" style="margin-bottom: 16px">{{ error }}</n-alert>
      <n-space vertical>
        <div class="list-header">
          <n-button type="primary" size="small" @click="showAddModal = true">Добавить гражданство</n-button>
        </div>
        <n-empty v-if="!loading && list.length === 0" description="Нет гражданств" />
        <n-list v-else bordered>
          <n-list-item v-for="c in list" :key="c.id">
            <template #prefix>
              <n-tag :type="c.status === 'active' ? 'success' : 'default'" size="small">
                {{ c.status === 'active' ? 'Активно' : 'Отказ' }}
              </n-tag>
            </template>
            <n-thing>
              <template #header>{{ c.country }}</template>
              <template #description>
                <span v-if="c.acquired_at">С {{ c.acquired_at }}</span>
                <span v-if="c.revoked_at"> · Отказ {{ c.revoked_at }}</span>
              </template>
            </n-thing>
            <template #suffix>
              <n-popconfirm
                v-if="c.status === 'active'"
                positive-text="Отказаться"
                negative-text="Отмена"
                @positive-click="doRevoke(c.id)"
              >
                <template #trigger>
                  <n-button quaternary size="small" type="error">Отказаться</n-button>
                </template>
                Вы уверены, что хотите отказаться от гражданства {{ c.country }}?
              </n-popconfirm>
            </template>
          </n-list-item>
        </n-list>
      </n-space>
    </n-spin>

    <n-modal v-model:show="showAddModal" preset="card" title="Добавить гражданство" style="max-width: 400px">
      <n-form :model="addForm" label-placement="top">
        <n-form-item label="Страна" required>
          <n-select
            v-model:value="addForm.country"
            :options="citizenshipOptions"
            filterable
            placeholder="Выберите страну"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="Дата приобретения">
          <n-date-picker
            :value="addForm.acquired_at ? new Date(addForm.acquired_at).getTime() : null"
            type="date"
            clearable
            style="width: 100%"
            @update:value="(v: number | null) => { addForm.acquired_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddModal = false">Отмена</n-button>
          <n-button type="primary" :loading="adding" @click="doAdd">Добавить</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { citizenships } from '@tmgo/shared'

const { list, loading, error, fetch, add, revoke } = useDriverCitizenships()
const message = useMessage()
const showAddModal = ref(false)
const adding = ref(false)
const addForm = reactive({ country: '', acquired_at: null as string | null })

const citizenshipOptions = computed(() => {
  const activeCountries = new Set(
    list.value.filter((c) => c.status === 'active').map((c) => c.country)
  )
  return citizenships
    .filter((c) => !activeCountries.has(c))
    .map((c) => ({ label: c, value: c }))
})

async function doAdd() {
  if (!addForm.country?.trim()) {
    message.error('Укажите страну')
    return
  }
  adding.value = true
  try {
    await add({ country: addForm.country.trim(), acquired_at: addForm.acquired_at || undefined })
    message.success('Гражданство добавлено')
    showAddModal.value = false
    addForm.country = ''
    addForm.acquired_at = null
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    adding.value = false
  }
}

async function doRevoke(id: string) {
  try {
    await revoke(id)
    message.success('Гражданство отмечено как отказ')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  }
}

onMounted(() => fetch())

defineExpose({ fetch })
</script>

<style scoped>
.list-header {
  margin-bottom: 16px;
}
</style>
