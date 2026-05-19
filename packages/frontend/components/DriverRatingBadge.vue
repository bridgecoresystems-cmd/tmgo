<template>
  <button class="drb" :title="t('myReviews.title')" @click="navigateTo('/cabinet/driver/reviews')">
    <component :is="StarIcon" class="drb-star" />
    <span class="drb-val">{{ average.toFixed(1) }}</span>
    <span v-if="total > 0" class="drb-count">({{ total }})</span>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Star as StarIcon } from '@vicons/ionicons5'

const { t } = useI18n()
const { apiBase: API } = useApiBase()

const average = ref(0)
const total = ref(0)

onMounted(async () => {
  try {
    const data = await $fetch<any>(`${API}/cabinet/reviews/me`, { credentials: 'include' })
    average.value = data.average ?? 0
    total.value = data.total ?? 0
  } catch {
    // silent — badge просто покажет 0.0
  }
})
</script>

<style scoped>
.drb {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid #ffe0d4;
  border-radius: 999px;
  background: #fff6f3;
  cursor: pointer;
  transition: background 0.15s, transform 0.12s;
}
.drb:hover {
  background: #ffe9e0;
  transform: translateY(-1px);
}
.drb-star {
  width: 16px;
  height: 16px;
  color: #f5a623;
}
.drb-val {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a1a;
}
.drb-count {
  font-size: 12px;
  color: #9ca3af;
}
</style>
