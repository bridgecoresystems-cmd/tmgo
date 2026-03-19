<template>
  <div>
    <n-alert v-if="loadError" type="error" closable style="margin-bottom: 16px">
      {{ loadError }}
      <template #footer>
        <n-button size="small" @click="loadMessages">Повторить</n-button>
      </template>
    </n-alert>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <n-h3 style="margin: 0;">Рассылки</n-h3>
      <n-button type="primary" @click="showCreate = true">
        Создать рассылку
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

  <n-modal v-model:show="showCreate" preset="card" title="Создать рассылку" style="width: 500px">
    <n-form ref="formRef" :model="form" :rules="rules">
      <n-form-item label="Заголовок" path="title" required>
        <n-input v-model:value="form.title" placeholder="Тема сообщения" />
      </n-form-item>
      <n-form-item label="Получатели" path="recipient_type">
        <n-select v-model:value="form.recipient_type" :options="recipientOptions" />
      </n-form-item>
      <n-form-item label="Текст" path="content" required>
        <n-input v-model:value="form.content" type="textarea" placeholder="Текст рассылки" :rows="5" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <UiCancelBtn @click="showCreate = false" />
        <UiSaveBtn :loading="creating" :label="'Создать'" @click="handleCreate" />
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, NButton, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

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

const recipientOptions = [
  { label: 'Все (заказчики и перевозчики)', value: 'all' },
  { label: 'Только заказчики', value: 'client' },
  { label: 'Только перевозчики', value: 'driver' },
]

const rules = {
  title: { required: true, message: 'Введите заголовок', trigger: 'blur' },
  content: { required: true, message: 'Введите текст', trigger: 'blur' },
}

const recipientLabels: Record<string, string> = {
  all: 'Все',
  client: 'Заказчики',
  driver: 'Перевозчики',
}

const columns: DataTableColumns<any> = [
  { title: 'Заголовок', key: 'title', ellipsis: true },
  {
    title: 'Получатели',
    key: 'recipient_type_display',
    width: 140,
  },
  {
    title: 'Статус',
    key: 'is_sent',
    width: 120,
    render: (row) => h(NTag, {
      type: row.is_sent ? 'success' : 'warning',
      size: 'small',
    }, () => row.is_sent ? 'Отправлено' : 'Черновик'),
  },
  {
    title: 'Получателей',
    key: 'total_recipients',
    width: 100,
    render: (row) => row.total_recipients || '—',
  },
  {
    title: 'Создано',
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
      }, () => 'Отправить'),
      h(NButton, {
        size: 'small',
        quaternary: true,
        type: 'error',
        onClick: (e: Event) => {
          e.stopPropagation()
          handleDelete(row.id)
        },
      }, () => 'Удалить'),
    ]),
  },
]

async function loadMessages() {
  loadError.value = null
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API || ''}/admin/mailing`, { credentials: 'include' })
    messages.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    const err = e?.data?.message || e?.message || 'Ошибка загрузки'
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
    message.success('Рассылка создана')
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
    message.success('Рассылка отправлена')
    await loadMessages()
  } catch (e: any) {
    message.error('Ошибка отправки')
  } finally {
    sending.value = null
  }
}

async function handleDelete(id: number) {
  if (!confirm('Удалить рассылку?')) return
  try {
    await $fetch(`${API}/admin/mailing/${id}`, { method: 'DELETE', credentials: 'include' })
    message.success('Удалено')
    await loadMessages()
  } catch {
    message.error('Ошибка удаления')
  }
}

function openDetail(row: any) {
  // Можно открыть модалку с деталями или отдельную страницу
  // Пока просто показываем контент в alert для демо
  if (row.content) {
    // navigateTo(`/admin/mailing/${row.id}`)
  }
}

onMounted(loadMessages)
</script>
