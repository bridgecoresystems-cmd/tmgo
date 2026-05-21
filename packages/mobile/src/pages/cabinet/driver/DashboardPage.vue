<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Package, CheckCircle, Clock, Search } from 'lucide-vue-next'
import { getDriverMyBids, getDriverAvailableOrders, BID_STATUS_COLOR, BID_STATUS_LABEL } from '@/api/cabinet'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user } = useAuth()

const loading  = ref(true)
const myBids   = ref<any[]>([])
const available = ref(0)

const stats = computed(() => ({
  total:    myBids.value.length,
  active:   myBids.value.filter(o => o.myBidStatus === 'pending').length,
  accepted: myBids.value.filter(o => o.myBidStatus === 'accepted').length,
}))

const recent = computed(() => myBids.value.slice(0, 3))

async function load() {
  loading.value = true
  try {
    const [bids, avail] = await Promise.all([
      getDriverMyBids(),
      getDriverAvailableOrders(),
    ])
    myBids.value  = bids
    available.value = avail.length
  } catch (e: any) {
    if (e?.message === 'session_expired') { router.replace('/login'); return }
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <p class="greeting">Кабинет водителя</p>
        <h1 class="username">{{ user.user?.name ?? 'Водитель' }}</h1>
      </div>
      <button class="search-fab" @click="router.push('/cabinet/driver/available')">
        <Search :size="22" />
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card" @click="router.push('/cabinet/driver/bids')">
        <div class="stat-icon blue"><Package :size="18" /></div>
        <div class="stat-val">{{ loading ? '—' : stats.total }}</div>
        <div class="stat-lbl">Всего ставок</div>
      </div>
      <div class="stat-card" @click="router.push('/cabinet/driver/bids')">
        <div class="stat-icon orange"><Clock :size="18" /></div>
        <div class="stat-val">{{ loading ? '—' : stats.active }}</div>
        <div class="stat-lbl">Ожидают</div>
      </div>
      <div class="stat-card" @click="router.push('/cabinet/driver/bids')">
        <div class="stat-icon green"><CheckCircle :size="18" /></div>
        <div class="stat-val">{{ loading ? '—' : stats.accepted }}</div>
        <div class="stat-lbl">Принятых</div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="section-title">Быстрые действия</div>
    <div class="actions-row">
      <button class="action-btn primary" @click="router.push('/cabinet/driver/available')">
        <Search :size="18" />
        <span>Найти груз {{ available > 0 ? `(${available})` : '' }}</span>
      </button>
      <button class="action-btn" @click="router.push('/cabinet/driver/bids')">
        <Package :size="18" />
        <span>Мои ставки</span>
      </button>
    </div>

    <!-- Recent bids -->
    <template v-if="!loading && recent.length > 0">
      <div class="section-row">
        <span class="section-title" style="margin-bottom:0">Последние ставки</span>
        <button class="see-all" @click="router.push('/cabinet/driver/bids')">Все →</button>
      </div>
      <div class="order-list">
        <div
          v-for="o in recent"
          :key="o.id"
          class="order-card"
          @click="router.push(`/cabinet/driver/orders/${o.id}`)"
        >
          <div class="order-route">
            <span class="dot from" /><span class="city">{{ o.fromCity }}</span>
            <div class="route-line" />
            <span class="dot to" /><span class="city">{{ o.toCity }}</span>
          </div>
          <div class="order-meta">
            <span class="order-title">{{ o.title }}</span>
            <span class="bid-badge"
              :style="{ background: BID_STATUS_COLOR[o.myBidStatus]+'18', color: BID_STATUS_COLOR[o.myBidStatus] }">
              {{ BID_STATUS_LABEL[o.myBidStatus] ?? o.myBidStatus }}
            </span>
          </div>
          <div class="order-sub">
            <span v-if="o.myBidAmount">Моя ставка: {{ o.myBidAmount }} {{ o.myBidCurrency }}</span>
            <span>{{ formatDate(o.readyDate) }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="loading" class="state-center"><div class="spinner" /></div>
    <div v-else-if="myBids.length === 0 && !loading" class="empty-state">
      <Package :size="44" style="color:#ddd" />
      <p style="color:#999;margin:0">Ставок пока нет</p>
      <button class="btn-find" @click="router.push('/cabinet/driver/available')">
        Найти груз
      </button>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 0 16px 24px; background: #f2f4f7; min-height: 100%; }

.page-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0 16px; }
.greeting { font-size: 0.8rem; color: #999; margin: 0; }
.username { font-size: 1.2rem; font-weight: 800; color: #1a1a1a; margin: 2px 0 0; }
.search-fab { width: 44px; height: 44px; background: var(--primary); color: white; border: none; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 20px; }
.stat-card { background: white; border-radius: 12px; padding: 14px 10px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,.06); cursor: pointer; }
.stat-icon { width: 34px; height: 34px; border-radius: 9px; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; }
.stat-icon.blue   { background: #e3f2fd; color: #1976d2; }
.stat-icon.orange { background: #fff3e0; color: #ef6c00; }
.stat-icon.green  { background: #e8f5e9; color: #2e7d32; }
.stat-val { font-size: 1.3rem; font-weight: 800; color: #1a1a1a; }
.stat-lbl { font-size: 0.68rem; color: #999; font-weight: 600; margin-top: 2px; }

.section-title { font-size: 0.78rem; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.section-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.see-all { background: none; border: none; color: var(--primary); font-size: 0.82rem; font-weight: 600; cursor: pointer; padding: 0; }

.actions-row { display: flex; gap: 10px; margin-bottom: 24px; }
.action-btn { flex: 1; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.88rem; font-weight: 700; cursor: pointer; border: none; background: white; color: var(--primary); box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.action-btn.primary { background: var(--primary); color: white; }

.order-list { display: flex; flex-direction: column; gap: 10px; }
.order-card { background: white; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 7px; box-shadow: 0 1px 4px rgba(0,0,0,.06); cursor: pointer; }
.order-route { display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot.from { background: var(--primary); }
.dot.to   { background: #d0021b; }
.city { font-size: 0.9rem; font-weight: 700; color: #222; }
.route-line { flex: 1; height: 1px; background: #e0e0e0; min-width: 8px; }
.order-meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.order-title { font-size: 0.8rem; color: #666; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bid-badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; flex-shrink: 0; }
.order-sub { display: flex; justify-content: space-between; font-size: 0.75rem; color: #aaa; }

.state-center { display: flex; justify-content: center; padding: 40px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e0e0e0; border-top-color: var(--primary); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 24px; text-align: center; }
.btn-find { background: var(--primary); color: white; border: none; border-radius: 10px; padding: 12px 28px; font-weight: 700; font-size: 0.9rem; cursor: pointer; }
</style>
