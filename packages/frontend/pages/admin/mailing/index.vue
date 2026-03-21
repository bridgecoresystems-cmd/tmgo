<template>
  <div>
    <n-alert v-if="loadError" type="error" closable style="margin-bottom: 16px">
      {{ loadError }}
      <template #footer>
        <n-button size="small" @click="loadMessages">{{ t('admin.mailing.retry') }}</n-button>
      </template>
    </n-alert>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <n-h3 style="margin: 0;">{{ t('admin.mailing.title') }}</n-h3>
      <n-button type="primary" @click="showCreate = true">
        {{ t('admin.mailing.create') }}
      </n-button>
    </div>

    <n-data-table
      :columns="columns"
      :data="messages"
      :loading="loading"
      :pagination="{ pageSize: 10 }"
      striped
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => openDetail(row) })"
    />
  </div>

  <n-modal v-model:show="showCreate" preset="card" :title="t('admin.mailing.modalTitle')" style="width: 500px">
    <n-form ref="formRef" :model="form" :rules="rules">
      <n-form-item :label="t('admin.mailing.labelTitle')" path="title" required>
        <n-input v-model:value="form.title" :placeholder="t('admin.mailing.placeholderSubject')" />
      </n-form-item>
      <n-form-item :label="t('admin.mailing.labelRecipients')" path="recipient_type">
        <n-select v-model:value="form.recipient_type" :options="recipientOptions" />
      </n-form-item>
      <n-form-item :label="t('admin.mailing.labelText')" path="content" required>
        <n-input v-model:value="form.content" type="textarea" :placeholder="t('admin.mailing.placeholderText')" :rows="5" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <UiCancelBtn @click="showCreate = false" />
        <UiSaveBtn :loading="creating" :label="t('admin.mailing.createBtn')" @click="handleCreate" />
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, NButton, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'admin',  })

const { t } = useI18n()
const { apiBase: API } = useApiBase()
const message = useMessage()
const loading = ref(true)
const creating = ref(false)
const sending = ref<number | null>(null)
const messages = ref<any[]>([])
const loadError = ref<string | null>(null)
const showCreate = ref(false)
const formRef = ref()

const form = reactive({
  title: '',
  content: '',
  recipient_type: 'all',
})

const recipientOptions = computed(() => [
  { label: t('admin.mailing.recipientAll'), value: 'all' },
  { label: t('admin.mailing.recipientClient'), value: 'client' },
  { label: t('admin.mailing.recipientDriver'), value: 'driver' },
])

const rules = computed(() => ({
  title: { required: true, message: t('admin.mailing.validationTitle'), trigger: 'blur' },
  content: { required: true, message: t('admin.mailing.validationContent'), trigger: 'blur' },
}))

const columns = computed<DataTableColumns<any>>(() => [
  { title: t('admin.mailing.columnTitle'), key: 'title', ellipsis: true },
  {
    title: t('admin.mailing.columnRecipients'),
    key: 'recipient_type_display',
    width: 140,
  },
  {
    title: t('admin.mailing.columnStatus'),
    key: 'is_sent',
    width: 120,
    render: (row) => h(NTag, {
      type: row.is_sent ? 'success' : 'warning',
      size: 'small',
    }, () => row.is_sent ? t('admin.mailing.statusSent') : t('admin.mailing.statusDraft')),
  },
  {
    title: t('admin.mailing.columnRecipientsCount'),
    key: 'total_recipients',
    width: 100,
    render: (row) => row.total_recipients || '—',
  },
  {
    title: t('admin.mailing.columnCreatedAt'),
    key: 'created_at',
    width: 160,
    render: (row) => new Date(row.created_at).toLocaleString('ru-RU'),
  },
  {
    title: '',
    key: 'actions',
    width: 120,
    render: (row) => h('div', { style: 'display: flex; gap: 4px' }, [
      !row.is_sent && h(NButton, {
        size: 'small',
        type: 'primary',
        loading: sending.value === row.id,
        onClick: (e: Event) => {
          e.stopPropagation()
          handleSend(row.id)
        },
      }, () => t('admin.mailing.btnSend')),
      h(NButton, {
        size: 'small',
        quaternary: true,
        type: 'error',
        onClick: (e: Event) => {
          e.stopPropagation()
          handleDelete(row.id)
        },
      }, () => t('admin.mailing.btnDelete')),
    ]),
  },
])

async function loadMessages() {
  loadError.value = null
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API || ''}/admin/mailing`, { credentials: 'include' })
    messages.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    const err = e?.data?.message || e?.message || t('admin.mailing.loadError')
    loadError.value = err
    message.error(err)
    if (import.meta.dev) console.error('Admin mailing fetch failed:', e)
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  try {
    await formRef.value?.validate()
    creating.value = true
    await $fetch(`${API}/admin/mailing`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    })
    message.success(t('admin.mailing.created'))
    showCreate.value = false
    form.title = ''
    form.content = ''
    form.recipient_type = 'all'
    await loadMessages()
  } catch (e: any) {
    if (e?.data?.message) message.error(e.data.message)
  } finally {
    creating.value = false
  }
}

async function handleSend(id: number) {
  try {
    sending.value = id
    await $fetch(`${API}/admin/mailing/${id}/send`, { method: 'POST', credentials: 'include' })
    message.success(t('admin.mailing.sent'))
    await loadMessages()
  } catch (e: any) {
    message.error(t('admin.mailing.sendError'))
  } finally {
    sending.value = null
  }
}

async function handleDelete(id: number) {
  if (!confirm(t('admin.mailing.deleteConfirm'))) return
  try {
    await $fetch(`${API}/admin/mailing/${id}`, { method: 'DELETE', credentials: 'include' })
    message.success(t('admin.mailing.deleted'))
    await loadMessages()
  } catch {
    message.error(t('admin.mailing.deleteError'))
  }
}

function openDetail(row: any) {
  // Можно открыть модалку с деталями или отдельную страницу
  if (row.content) {
    // navigateTo(`/admin/mailing/${row.id}`)
  }
}

onMounted(loadMessages)
</script>
