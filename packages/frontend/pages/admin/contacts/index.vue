<template>
  <div class="admin-contacts">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <n-h2 style="margin: 0;">{{ t('admin.adminIndex.contactMessages') }}</n-h2>
    </div>
    <n-card class="shadow-sm">
      <n-data-table
        :columns="columns"
        :data="messages"
        :loading="loading"
        :pagination="{ pageSize: 15 }"
        :scroll-x="1030"
        striped
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted } from 'vue'
import { NTag, NButton, NSpace, useMessage } from 'naive-ui'

definePageMeta({
  layout: 'admin'
})

const { t } = useI18n()
const { apiBase: API } = useApiBase()
const message = useMessage()

const messages = ref<any[]>([])
const loading = ref(false)

async function fetchMessages() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/admin/contacts`, { credentials: 'include' })
    messages.value = data
  } catch (e) {
    console.error(e)
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function updateStatus(id: string, status: string) {
  try {
    await $fetch(`${API}/admin/contacts/${id}/status`, {
      method: 'PATCH',
      body: { status },
      credentials: 'include'
    })
    message.success(t('common.success'))
    fetchMessages()
  } catch (e) {
    message.error(t('common.error'))
  }
}

onMounted(fetchMessages)

const columns = [
  { 
    title: t('contactsPage.nameLabel'), 
    key: 'name',
    width: 150
  },
  { 
    title: t('contactsPage.emailLabel'), 
    key: 'email',
    width: 200
  },
  { 
    title: t('contactsPage.messageLabel'), 
    key: 'message',
    render(row: any) {
      return h('div', { style: 'white-space: pre-wrap;' }, row.message)
    }
  },
  { 
    title: t('common.status'), 
    key: 'status',
    width: 120,
    render(row: any) {
      const type = row.status === 'new' ? 'warning' : (row.status === 'read' ? 'success' : 'default')
      const labels: Record<string, string> = {
        new: 'Новое',
        read: 'Прочитано',
        archived: 'Архив'
      }
      return h(NTag, { 
        type,
        size: 'small',
        round: true,
        bordered: false
      }, { default: () => labels[row.status] || row.status })
    }
  },
  { 
    title: t('common.date'), 
    key: 'createdAt',
    width: 160,
    render(row: any) {
      return new Date(row.createdAt).toLocaleString('ru-RU')
    }
  },
  {
    title: t('admin.ordersPage.columnActions'),
    key: 'actions',
    width: 200,
    render(row: any) {
      return h(NSpace, {}, {
        default: () => [
          row.status === 'new' ? h(NButton, { 
            size: 'small', 
            onClick: () => updateStatus(row.id, 'read') 
          }, { default: () => 'Прочитано' }) : null,
          row.status !== 'archived' ? h(NButton, { 
            size: 'small', 
            type: 'error',
            quaternary: true,
            onClick: () => updateStatus(row.id, 'archived') 
          }, { default: () => 'В архив' }) : null
        ]
      })
    }
  }
]
</script>

<style scoped>
.shadow-sm {
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}
</style>
