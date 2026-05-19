<template>
  <div>
    <UiBackBtn to="/cabinet/driver" />

    <n-card style="margin-top: 12px;">
      <div class="rv-summary">
        <div class="rv-score">
          <div class="rv-num">{{ average.toFixed(1) }}</div>
          <StarRating :model-value="average" readonly :size="22" />
          <div class="rv-count">{{ total }} {{ t('myReviews.reviewsCount') }}</div>
        </div>
        <div class="rv-head">
          <h2 class="rv-title">{{ t('myReviews.title') }}</h2>
          <p class="rv-sub">{{ t('myReviews.subtitle') }}</p>
        </div>
      </div>
    </n-card>

    <div v-if="loading" style="padding: 40px; text-align: center;">
      <n-spin size="large" />
    </div>

    <n-empty
      v-else-if="list.length === 0"
      :description="t('myReviews.empty')"
      style="padding: 60px;"
    />

    <div v-else class="rv-list">
      <n-card
        v-for="r in list"
        :key="r.id"
        size="small"
        class="rv-item"
        hoverable
        @click="goToOrder(r.orderId)"
      >
        <div class="rv-item-top">
          <div>
            <div class="rv-order">
              {{ t('myReviews.orderLabel') }}
              <strong>#ORD{{ r.orderSeqNo || r.orderId.split('-')[0] }}</strong>
              <span v-if="r.orderTitle" class="rv-order-title">• {{ r.orderTitle }}</span>
            </div>
            <div class="rv-from">{{ t('myReviews.fromLabel') }}: {{ r.fromName || t('common.user') }}</div>
          </div>
          <StarRating :model-value="r.rating" readonly :size="18" />
        </div>
        <p v-if="r.comment" class="rv-comment">{{ r.comment }}</p>
        <div class="rv-date">{{ fmtDate(r.createdAt) }}</div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver' })

const { t } = useI18n()
const { apiBase: API } = useApiBase()

const loading = ref(true)
const list = ref<any[]>([])
const average = ref(0)
const total = ref(0)

function fmtDate(d: string) {
  return new Date(d).toLocaleString('ru-RU')
}

function goToOrder(id: string) {
  navigateTo(`/cabinet/driver/orders/${id}`)
}

async function load() {
  loading.value = true
  try {
    const data = await $fetch<any>(`${API}/cabinet/reviews/me`, { credentials: 'include' })
    list.value = data.reviews ?? []
    average.value = data.average ?? 0
    total.value = data.total ?? 0
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.rv-summary {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.rv-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 24px;
  border-right: 1px solid #eee;
}
.rv-num {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
  color: #f5a623;
}
.rv-count {
  font-size: 12px;
  color: #9ca3af;
}
.rv-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}
.rv-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}
.rv-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}
.rv-item {
  cursor: pointer;
  transition: transform 0.12s ease;
}
.rv-item:hover {
  transform: translateY(-1px);
}
.rv-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.rv-order {
  font-size: 14px;
  color: #374151;
}
.rv-order-title {
  color: #6b7280;
}
.rv-from {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 3px;
}
.rv-comment {
  margin: 10px 0 4px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  white-space: pre-wrap;
}
.rv-date {
  font-size: 12px;
  color: #9ca3af;
}
@media (max-width: 600px) {
  .rv-score { border-right: none; border-bottom: 1px solid #eee; padding-bottom: 14px; width: 100%; }
}
</style>
