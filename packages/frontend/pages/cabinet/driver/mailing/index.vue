<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <n-h3 style="margin: 0;">{{ t('driver.mailing.title') }}</n-h3>
      <n-button v-if="unreadCount > 0" secondary @click="handleMarkAllRead" :loading="markingAll">
        {{ t('driver.mailing.markAllRead') }}
      </n-button>
    </div>

    <n-tabs v-model:value="filterKey" type="segment" style="margin-bottom: 16px">
      <n-tab name="all">{{ t('driver.mailing.filterAll') }}</n-tab>
      <n-tab name="unread">
        <n-badge :value="unreadCount" type="error" :max="99">{{ t('driver.mailing.filterUnread') }}</n-badge>
      </n-tab>
      <n-tab name="read">{{ t('driver.mailing.filterRead') }}</n-tab>
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
            <div style="font-size: 13px; color: var(--n-text-color-3)">{{ t('driver.mailing.from') }} {{ msg.sender }}</div>
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

    <n-empty v-else :description="t('driver.mailing.noMessages')" style="padding: 60px 0" />
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver',  })

const { apiBase: API } = useApiBase()
const message = useMessage()
const messages = ref<any[]>([])
const loading = ref(true)
const markingAll = ref(false)
const filterKey = ref('all')

const unreadCount = computed(() => (Array.isArray(messages.value) ? messages.value : []).filter((m) => !m.is_read).length)

const filteredMessages = computed(() => {
  const list = Array.isArray(messages.value) ? messages.value : []
  if (filterKey.value === 'all') return list
  const isRead = filterKey.value === 'read'
  return list.filter((m) => m.is_read === isRead)
})

function truncate(text: string | undefined, max: number) {
  const t = text || ''
  return t.length > max ? t.slice(0, max) + '...' : t
}

function formatDate(s: string | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

async function loadMessages() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API || ''}/cabinet/mailing`, { credentials: 'include' })
    messages.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    message.error(e?.data?.message || e?.message || t('driver.mailing.loadError'))
    messages.value = []
  } finally {
    loading.value = false
  }
}

function openMessage(msg: any) {
  navigateTo(`/cabinet/driver/mailing/${msg.id}`)
}

async function handleMarkAllRead() {
  markingAll.value = true
  try {
    await $fetch(`${API || ''}/cabinet/mailing/read-all`, { method: 'POST', credentials: 'include' })
    ;(Array.isArray(messages.value) ? messages.value : []).forEach((m) => (m.is_read = true))
    message.success(t('driver.mailing.allRead'))
  } catch {
    message.error(t('common.error'))
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
