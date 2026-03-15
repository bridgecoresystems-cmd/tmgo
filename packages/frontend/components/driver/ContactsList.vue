<template>
  <div class="contacts-list">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" style="margin-bottom: 16px">{{ error }}</n-alert>
      <n-space vertical>
        <div class="list-header">
          <n-button type="primary" size="small" @click="showAddModal = true">Добавить контакт</n-button>
        </div>
        <n-empty v-if="!loading && list.length === 0" description="Нет дополнительных контактов" />
        <n-list v-else bordered>
          <n-list-item v-for="c in list" :key="c.id">
            <n-thing>
              <template #header>
                <n-space align="center">
                  <n-tag size="small">{{ c.contact_type === 'phone' ? 'Телефон' : 'Email' }}</n-tag>
                  <span>{{ c.value }}</span>
                  <span v-if="c.label" class="contact-label">({{ c.label }})</span>
                </n-space>
              </template>
            </n-thing>
            <template #suffix>
              <n-popconfirm
                positive-text="Удалить"
                negative-text="Отмена"
                @positive-click="doRemove(c.id)"
              >
                <template #trigger>
                  <n-button quaternary size="small" type="error">×</n-button>
                </template>
                Удалить контакт?
              </n-popconfirm>
            </template>
          </n-list-item>
        </n-list>
      </n-space>
    </n-spin>

    <n-modal v-model:show="showAddModal" preset="card" title="Добавить контакт" style="max-width: 400px">
      <n-form :model="addForm" label-placement="top">
        <n-form-item label="Тип" required>
          <n-select v-model:value="addForm.contact_type" :options="contactTypeOptions" />
        </n-form-item>
        <n-form-item label="Значение" required>
          <n-input v-model:value="addForm.value" :placeholder="addForm.contact_type === 'phone' ? '+993 65 12 34 56' : 'email@example.com'" />
        </n-form-item>
        <n-form-item label="Подпись (опционально)">
          <n-input v-model:value="addForm.label" placeholder="Рабочий, Домашний и т.д." />
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

const { list, loading, error, fetch, add, remove } = useDriverContacts()
const message = useMessage()
const showAddModal = ref(false)
const adding = ref(false)
const addForm = reactive({
  contact_type: 'phone' as 'phone' | 'email',
  value: '',
  label: '',
})
const contactTypeOptions = [
  { label: 'Телефон', value: 'phone' },
  { label: 'Email', value: 'email' },
]

async function doAdd() {
  if (!addForm.value?.trim()) {
    message.error('Укажите значение')
    return
  }
  adding.value = true
  try {
    await add({
      contact_type: addForm.contact_type,
      value: addForm.value.trim(),
      label: addForm.label?.trim() || undefined,
    })
    message.success('Контакт добавлен')
    showAddModal.value = false
    addForm.value = ''
    addForm.label = ''
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    adding.value = false
  }
}

async function doRemove(id: string) {
  try {
    await remove(id)
    message.success('Контакт удалён')
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
.contact-label {
  font-size: 12px;
  opacity: 0.8;
}
</style>
