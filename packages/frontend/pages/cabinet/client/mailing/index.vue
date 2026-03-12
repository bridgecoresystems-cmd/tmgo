<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <n-h3 style="margin: 0;">Рассылки</n-h3>
      <n-button v-if="unreadCount > 0" secondary @click="handleMarkAllRead" :loading="markingAll">
        Прочитать все
      </n-button>
    </div>

    <n-tabs v-model:value="filterKey" type="segment" style="margin-bottom: 16px">
      <n-tab name="all">Все</n-tab>
      <n-tab name="unread">
        <n-badge :value="unreadCount" type="error" :max="99">Непрочитанные</n-badge>
      </n-tab>
      <n-tab name="read">Прочитанные</n-tab>
    </n-tabs>

    <div v-if="loading" style="padding: 40px; text-align: center">
      <n-spin size="large" />
    </div>

    <div v-else-if="filteredMessages.length > 0" style="display: flex; flex-direction: column; gap: 12px">
      <n-card
        v-for="msg in filteredMessages"
        :key="msg.id"
        hoverable
        :class="{ 'unread-card': !msg.is_read }"
        style="cursor: pointer; border-radius: 12px"
        @click="openMessage(msg)"
      >
        <div style="display: flex; justify-content: space-between; align-items: flex-start">
          <div>
            <div style="font-weight: 600; margin-bottom: 4px">{{ msg.title }}</div>
            <div style="font-size: 13px; color: var(--n-text-color-3)">От: {{ msg.sender }}</div>
            <div style="font-size: 14px; margin-top: 8px; color: var(--n-text-color-2)">
              {{ truncate(msg.content, 100) }}
            </div>
          </div>
          <div style="font-size: 12px; color: var(--n-text-color-3)">
            {{ formatDate(msg.received_at) }}
          </div>
        </div>
      </n-card>
    </div>

    <n-empty v-else description="Сообщений пока нет" style="padding: 60px 0" />
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet-client', middleware: 'cabinet-auth' })

const API = 'http://localhost:8000'
const message = useMessage()
const messages = ref<any[]>([])
const loading = ref(true)
const markingAll = ref(false)
const filterKey = ref('all')

const unreadCount = computed(() => messages.value.filter((m) => !m.is_read).length)

const filteredMessages = computed(() => {
  if (filterKey.value === 'all') return messages.value
  const isRead = filterKey.value === 'read'
  return messages.value.filter((m) => m.is_read === isRead)
})

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '...' : text
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

async function loadMessages() {
  loading.value = true
  try {
    messages.value = await $fetch<any[]>(`${API}/cabinet/mailing`, { credentials: 'include' })
  } catch {
    message.error('Ошибка загрузки')
  } finally {
    loading.value = false
  }
}

function openMessage(msg: any) {
  navigateTo(`/cabinet/client/mailing/${msg.id}`)
}

async function handleMarkAllRead() {
  markingAll.value = true
  try {
    await $fetch(`${API}/cabinet/mailing/read-all`, { method: 'POST', credentials: 'include' })
    messages.value.forEach((m) => (m.is_read = true))
    message.success('Все прочитано')
  } catch {
    message.error('Ошибка')
  } finally {
    markingAll.value = false
  }
}

onMounted(loadMessages)
</script>

<style scoped>
.unread-card {
  border-left: 4px solid #ff6b4a;
}
</style>
