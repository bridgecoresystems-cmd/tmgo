<template>
  <div>
    <n-h3 style="margin: 0 0 20px 0;">Оповещения</n-h3>
    <p v-if="!loading && alerts.length === 0" class="text-secondary">
      Нет срочных напоминаний. Все документы в порядке.
    </p>
    <n-spin v-else-if="loading" style="min-height: 120px; display: flex; align-items: center; justify-content: center;" />
    <div v-else class="alerts-grid">
      <n-card
        v-for="a in alerts"
        :key="a.id"
        :bordered="true"
        size="small"
        class="alert-card"
        :class="{ 'alert-card--expired': a.isExpired }"
      >
        <div class="alert-card__header">
          <n-tag :type="a.isExpired ? 'error' : 'warning'" size="small">
            {{ a.isExpired ? 'Истёк' : `Осталось ${a.daysLeft} дн.` }}
          </n-tag>
          <span class="alert-card__title">{{ a.title }}</span>
        </div>
        <div class="alert-card__date">
          Срок действия до: {{ formatDate(a.expiryDate) }}
        </div>
        <NuxtLink :to="alertLink(a)" class="alert-card__link">
          Добавить документ →
        </NuxtLink>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

useSeoMeta({ title: 'Оповещения — BridgeCore Systems' })

const { alerts, fetchAlerts } = useDriverAlerts()
const loading = ref(true)

function formatDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function alertLink(a: { type: string }): string {
  const tabMap: Record<string, string> = {
    passport: 'documents',
    license: 'documents',
    permission: 'documents',
    medical: 'documents',
  }
  const tab = tabMap[a.type] || 'documents'
  return `/cabinet/driver/add-documents?tab=${tab}`
}

onMounted(async () => {
  await fetchAlerts()
  loading.value = false
})
</script>

<style scoped>
.text-secondary {
  color: var(--n-text-color-3);
  margin: 0;
}
.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.alert-card {
  transition: box-shadow 0.2s;
}
.alert-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.alert-card--expired {
  border-color: var(--n-error-color);
}
.alert-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.alert-card__title {
  font-weight: 600;
  font-size: 15px;
}
.alert-card__date {
  font-size: 13px;
  color: var(--n-text-color-3);
  margin-bottom: 8px;
}
.alert-card__link {
  font-size: 13px;
  color: var(--n-primary-color);
  text-decoration: none;
}
.alert-card__link:hover {
  text-decoration: underline;
}
</style>
