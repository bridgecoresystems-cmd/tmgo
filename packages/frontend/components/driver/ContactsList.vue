<template>
  <div class="contacts-list">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" style="margin-bottom: 16px">{{ error }}</n-alert>
      <n-space vertical>
        <div class="list-header">
          <n-button type="primary" size="small" @click="showAddModal = true">{{ t('driver.contacts.add') }}</n-button>
        </div>
        <n-empty v-if="!loading && list.length === 0" :description="t('driver.contacts.noItems')" />
        <n-list v-else bordered>
          <n-list-item v-for="c in list" :key="c.id">
            <n-thing>
              <template #header>
                <n-space align="center">
                  <n-tag size="small">{{ c.contact_type === 'phone' ? t('driver.contacts.typePhone') : t('driver.contacts.typeEmail') }}</n-tag>
                  <span>{{ c.value }}</span>
                  <span v-if="c.label" class="contact-label">({{ c.label }})</span>
                </n-space>
              </template>
            </n-thing>
            <template #suffix>
              <n-popconfirm
                :positive-text="t('common.delete')"
                :negative-text="t('common.cancel')"
                @positive-click="doRemove(c.id)"
              >
                <template #trigger>
                  <n-button quaternary size="small" type="error">×</n-button>
                </template>
                {{ t('driver.contacts.deleteConfirm') }}
              </n-popconfirm>
            </template>
          </n-list-item>
        </n-list>
      </n-space>
    </n-spin>

    <n-modal v-model:show="showAddModal" preset="card" :title="t('driver.contacts.addModal')" style="max-width: 400px">
      <n-form :model="addForm" label-placement="top">
        <n-form-item :label="t('driver.contacts.type')" required>
          <n-select v-model:value="addForm.contact_type" :options="contactTypeOptions" />
        </n-form-item>
        <n-form-item :label="t('driver.contacts.value')" required>
          <n-input v-model:value="addForm.value" :placeholder="addForm.contact_type === 'phone' ? '+993 65 12 34 56' : 'email@example.com'" />
        </n-form-item>
        <n-form-item :label="t('driver.contacts.label')">
          <n-input v-model:value="addForm.label" :placeholder="t('driver.contacts.labelPlaceholder')" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" :loading="adding" @click="doAdd">{{ t('common.add') }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t } = useI18n()
const { list, loading, error, fetch, add, remove } = useDriverContacts()
const message = useMessage()
const showAddModal = ref(false)
const adding = ref(false)
const addForm = reactive({
  contact_type: 'phone' as 'phone' | 'email',
  value: '',
  label: '',
})

const contactTypeOptions = computed(() => [
  { label: t('driver.contacts.typePhone'), value: 'phone' },
  { label: t('driver.contacts.typeEmail'), value: 'email' },
])

async function doAdd() {
  if (!addForm.value?.trim()) {
    message.error(t('driver.contacts.specifyValue'))
    return
  }
  adding.value = true
  try {
    await add({
      contact_type: addForm.contact_type,
      value: addForm.value.trim(),
      label: addForm.label?.trim() || undefined,
    })
    message.success(t('driver.contacts.added'))
    showAddModal.value = false
    addForm.value = ''
    addForm.label = ''
  } catch (e: any) {
    message.error(e?.data?.error || t('common.error'))
  } finally {
    adding.value = false
  }
}

async function doRemove(id: string) {
  try {
    await remove(id)
    message.success(t('driver.contacts.deleted'))
  } catch (e: any) {
    message.error(e?.data?.error || t('common.error'))
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
