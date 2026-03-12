<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/cabinet/driver/mailing')">
      ← Назад к списку
    </n-button>

    <div v-if="loading" style="padding: 40px; text-align: center">
      <n-spin size="large" />
    </div>

    <n-card v-else-if="msg" title="">
      <template #header>
        <n-h3 style="margin: 0">{{ msg.title }}</n-h3>
      </template>
      <div style="font-size: 14px; color: var(--n-text-color-3); margin-bottom: 16px">
        От: {{ msg.sender }} · {{ formatDate(msg.received_at) }}
      </div>
      <n-divider />
      <div style="white-space: pre-wrap; line-height: 1.6">{{ msg.content }}</div>
    </n-card>

    <n-empty v-else description="Сообщение не найдено" style="padding: 60px 0" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const { apiBase: API } = useApiBase()
const route = useRoute()
const messageId = parseInt(route.params.id as string)
const msg = ref<any>(null)
const loading = ref(true)

function formatDate(s: string) {
  return new Date(s).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  try {
    const all = await $fetch<any[]>(`${API}/cabinet/mailing`, { credentials: 'include' })
    const found = all.find((m) => m.id === messageId)
    if (found) {
      msg.value = found
      if (!found.is_read) {
        await $fetch(`${API}/cabinet/mailing/${messageId}/read`, {
          method: 'POST',
          credentials: 'include',
        })
      }
    }
  } catch {
    //
  } finally {
    loading.value = false
  }
})
</script>
