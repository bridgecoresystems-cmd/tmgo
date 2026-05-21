<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Plus, Package } from 'lucide-vue-next'
import { getMyOrders, STATUS_LABEL, STATUS_COLOR } from '@/api/cabinet'

const router = useRouter()
const route  = useRoute()

const loading  = ref(true)
const orders   = ref<any[]>([])
const error    = ref('')
const tab      = ref<'all' | 'active' | 'completed'>('all')

const filtered = computed(() => {
  if (tab.value === 'active')
    return orders.value.filter(o => ['published','negotiating','confirmed','pickup','in_transit','delivering'].includes(o.status))
  if (tab.value === 'completed')
    return orders.value.filter(o => o.status === 'completed')
  return orders.value
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    orders.value = await getMyOrders()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatWeight(w: string | null) {
  if (!w) return null
  const n = parseFloat(w)
  return n >= 1000 ? `${(n/1000).toFixed(1)} т` : `${n} кг`
}

onMounted(() => {
  if (route.query.status === 'active') tab.value = 'active'
  else if (route.query.status === 'completed') tab.value = 'completed'
  load()
})
</script>

<template>
  <div class="page">
    <!-- Header -->
    <header class="header">
      <button class="icon-btn" @click="router.back()"><ArrowLeft :size="22" /></button>
      <h1 class="title">Мои заказы</h1>
      <button class="icon-btn create-btn" @click="router.push('/cabinet/client/orders/create')">
        <Plus :size="22" />
      </button>
    </header>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="['tab', { active: tab === 'all' }]"       @click="tab = 'all'">Все</button>
      <button :class="['tab', { active: tab === 'active' }]"    @click="tab = 'active'">Активные</button>
      <button :class="['tab', { active: tab === 'completed' }]" @click="tab = 'completed'">Завершённые</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-center">
      <div class="spinner" /><p>Загрузка...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-center">
      <p class="error-text">{{ error }}</p>
      <button class="btn-action" @click="load">Повторить</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="state-center">
      <Package :size="44" style="color:#ddd" />
      <p style="color:#999;margin:0">Заказов нет</p>
      <button class="btn-action" @click="router.push('/cabinet/client/orders/create')">
        + Создать заказ
      </button>
    </div>

    <!-- List -->
    <div v-else class="list">
      <div
        v-for="o in filtered"
        :key="o.id"
        class="order-card"
        @click="router.push(`/cabinet/client/orders/${o.id}`)"
      >
        <!-- Route -->
        <div class="route-row">
          <div class="route-pt">
            <span class="dot from" />
            <span class="city">{{ o.fromCity }}</span>
            <span class="country">{{ o.fromCountry }}</span>
          </div>
          <div class="route-line" />
          <div class="route-pt">
            <span class="dot to" />
            <span class="city">{{ o.toCity }}</span>
            <span class="country">{{ o.toCountry }}</span>
          </div>
        </div>

        <!-- Title + status -->
        <div class="meta-row">
          <span class="order-title">{{ o.title }}</span>
          <span
            class="status-badge"
            :style="{ background: STATUS_COLOR[o.status]+'18', color: STATUS_COLOR[o.status] }"
          >{{ STATUS_LABEL[o.status] ?? o.status }}</span>
        </div>

        <!-- Tags -->
        <div class="tags-row">
          <span v-if="o.cargoType" class="tag">{{ o.cargoType }}</span>
          <span v-if="o.weightKg"  class="tag">⚖ {{ formatWeight(o.weightKg) }}</span>
          <span v-if="o.price"     class="tag">{{ o.price }} {{ o.currency }}</span>
          <span class="tag date">{{ formatDate(o.readyDate) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { background: #f2f4f7; min-height: 100%; }

.header {
  background: white; display: flex; align-items: center;
  padding: 10px 12px; padding-top: calc(10px + var(--safe-area-top));
  border-bottom: 1px solid #eee; gap: 8px; position: sticky; top: 0; z-index: 10;
}
.icon-btn { background: none; border: none; color: #555; padding: 6px; cursor: pointer; display: flex; align-items: center; }
.title { flex: 1; font-size: 1rem; font-weight: 700; color: #1a1a1a; margin: 0; }
.create-btn { color: var(--primary); }

.tabs {
  background: white; display: flex; border-bottom: 2px solid #eee;
  position: sticky; top: 53px; z-index: 9;
}
.tab {
  flex: 1; background: none; border: none; padding: 12px 8px;
  font-size: 0.78rem; font-weight: 700; color: #999;
  cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px;
}
.tab.active { color: var(--primary); border-bottom-color: var(--primary); }

.state-center {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 24px; text-align: center;
}
.spinner { width: 32px; height: 32px; border: 3px solid #e0e0e0; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-text { color: #e53935; margin: 0; }
.btn-action { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 600; cursor: pointer; }

.list { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

.order-card {
  background: white; border-radius: 12px;
  padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.07); cursor: pointer;
}
.route-row { display: flex; align-items: center; gap: 6px; }
.route-pt { display: flex; align-items: center; gap: 5px; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot.from { background: var(--primary); }
.dot.to   { background: #d0021b; }
.city { font-size: 0.95rem; font-weight: 700; color: #222; }
.country { font-size: 0.68rem; color: #aaa; text-transform: uppercase; }
.route-line { flex: 1; height: 1px; background: #eee; min-width: 12px; }

.meta-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.order-title { font-size: 0.82rem; color: #555; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-badge { font-size: 0.68rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; flex-shrink: 0; }

.tags-row { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { font-size: 0.72rem; font-weight: 500; color: #666; background: #f0f4fa; padding: 2px 8px; border-radius: 4px; }
.tag.date { color: #999; background: #f8f8f8; }
</style>
