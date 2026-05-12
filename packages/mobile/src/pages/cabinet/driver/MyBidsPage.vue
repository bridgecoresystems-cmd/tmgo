<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Package } from 'lucide-vue-next'
import { getDriverMyBids, BID_STATUS_LABEL, BID_STATUS_COLOR } from '@/api/cabinet'

const router = useRouter()

const loading = ref(true)
const orders  = ref<any[]>([])
const error   = ref('')
const tab     = ref<'all' | 'pending' | 'accepted'>('all')

const filtered = computed(() => {
  if (tab.value === 'all') return orders.value
  return orders.value.filter(o => o.myBidStatus === tab.value)
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    orders.value = await getDriverMyBids()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatWeight(w: string | null) {
  if (!w) return null
  const n = parseFloat(w)
  return n >= 1000 ? `${(n / 1000).toFixed(1)} т` : `${n} кг`
}

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="header">
      <button class="icon-btn" @click="router.back()"><ArrowLeft :size="22" /></button>
      <h1 class="title">Мои ставки</h1>
      <span v-if="!loading" class="count">{{ orders.length }}</span>
    </header>

    <div class="tabs">
      <button :class="['tab', { active: tab === 'all' }]"      @click="tab = 'all'">Все</button>
      <button :class="['tab', { active: tab === 'pending' }]"  @click="tab = 'pending'">Ожидают</button>
      <button :class="['tab', { active: tab === 'accepted' }]" @click="tab = 'accepted'">Принятые</button>
    </div>

    <div v-if="loading" class="state-center"><div class="spinner" /></div>

    <div v-else-if="error" class="state-center">
      <p class="error-text">{{ error }}</p>
      <button class="btn-retry" @click="load">Повторить</button>
    </div>

    <div v-else-if="filtered.length === 0" class="state-center">
      <Package :size="48" style="color:#ddd" />
      <p style="color:#999;margin:0">Ставок нет</p>
    </div>

    <div v-else class="list">
      <div
        v-for="o in filtered"
        :key="o.id"
        class="card"
        @click="router.push(`/cabinet/driver/orders/${o.id}`)"
      >
        <div class="route-row">
          <span class="dot from" />
          <span class="city">{{ o.fromCity }}</span>
          <span class="country">{{ o.fromCountry }}</span>
          <div class="route-line" />
          <span class="dot to" />
          <span class="city">{{ o.toCity }}</span>
          <span class="country">{{ o.toCountry }}</span>
        </div>

        <div class="meta-row">
          <span class="cargo-title">{{ o.title }}</span>
          <span
            class="bid-badge"
            :style="{ background: BID_STATUS_COLOR[o.myBidStatus] + '1a', color: BID_STATUS_COLOR[o.myBidStatus] }"
          >
            {{ BID_STATUS_LABEL[o.myBidStatus] ?? o.myBidStatus }}
          </span>
        </div>

        <div class="sub-row">
          <span v-if="o.weightKg" class="tag">⚖ {{ formatWeight(o.weightKg) }}</span>
          <span v-if="o.cargoType" class="tag">{{ o.cargoType }}</span>
          <span class="spacer" />
          <span v-if="o.myBidAmount" class="bid-amount">{{ o.myBidAmount }} {{ o.myBidCurrency }}</span>
          <span class="date">📅 {{ formatDate(o.readyDate) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { background: #f2f4f7; min-height: 100%; }

.header {
  background: white; display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; padding-top: calc(10px + var(--safe-area-top));
  border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10;
}
.icon-btn { background: none; border: none; color: #555; padding: 6px; cursor: pointer; display: flex; align-items: center; }
.title { flex: 1; font-size: 1rem; font-weight: 700; color: #1a1a1a; margin: 0; }
.count { font-size: 0.78rem; color: #aaa; background: #f0f0f0; padding: 2px 8px; border-radius: 10px; }

.tabs { display: flex; background: white; border-bottom: 1px solid #eee; padding: 0 16px; gap: 0; }
.tab { flex: 1; background: none; border: none; border-bottom: 2px solid transparent; padding: 11px 0; font-size: 0.82rem; font-weight: 600; color: #aaa; cursor: pointer; transition: all .15s; }
.tab.active { color: #18a058; border-bottom-color: #18a058; }

.state-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px 24px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e0e0e0; border-top-color: #18a058; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-text { color: #e53935; margin: 0; }
.btn-retry { background: #18a058; color: white; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 600; cursor: pointer; }

.list { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

.card { background: white; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.07); cursor: pointer; }

.route-row { display: flex; align-items: center; gap: 5px; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot.from { background: #1a5bc4; }
.dot.to   { background: #d0021b; }
.city { font-size: 0.9rem; font-weight: 700; color: #222; }
.country { font-size: 0.65rem; color: #bbb; text-transform: uppercase; }
.route-line { flex: 1; height: 1px; background: #eee; min-width: 10px; }

.meta-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.cargo-title { font-size: 0.8rem; color: #666; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bid-badge { font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 6px; flex-shrink: 0; }

.sub-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.tag { font-size: 0.7rem; color: #888; background: #f4f4f4; padding: 2px 7px; border-radius: 4px; }
.spacer { flex: 1; }
.bid-amount { font-size: 0.82rem; font-weight: 700; color: #18a058; }
.date { font-size: 0.72rem; color: #bbb; }
</style>
