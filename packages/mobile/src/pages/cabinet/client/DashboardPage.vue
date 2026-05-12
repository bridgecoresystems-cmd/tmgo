<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Package, Clock, CheckCircle, Plus, ChevronRight, AlertCircle } from 'lucide-vue-next'
import { getMyOrders, STATUS_LABEL, STATUS_COLOR } from '@/api/cabinet'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user } = useAuth()

const loading  = ref(true)
const orders   = ref<any[]>([])
const error    = ref('')

const stats = computed(() => ({
  total:     orders.value.length,
  active:    orders.value.filter(o => ['published','negotiating','confirmed','pickup','in_transit','delivering'].includes(o.status)).length,
  completed: orders.value.filter(o => o.status === 'completed').length,
}))

const recent = computed(() => orders.value.slice(0, 3))

const profileMissing = ref(false)

async function load() {
  loading.value = true
  try {
    orders.value = await getMyOrders()
  } catch (e: any) {
    if (e.message?.includes('profile_required') || e.message?.includes('404')) {
      profileMissing.value = true
    } else {
      error.value = e.message
    }
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
    <!-- Header -->
    <div class="page-header">
      <div>
        <p class="greeting">Добро пожаловать,</p>
        <h1 class="username">{{ user.user?.name ?? 'Клиент' }}</h1>
      </div>
      <button class="create-fab" @click="router.push('/cabinet/client/orders/create')">
        <Plus :size="22" />
      </button>
    </div>

    <!-- Profile missing banner -->
    <div v-if="profileMissing" class="banner banner-warn" @click="router.push('/cabinet/client/profile')">
      <AlertCircle :size="18" />
      <span>Заполните профиль компании для публикации заказов</span>
      <ChevronRight :size="16" />
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card" @click="router.push('/cabinet/client/orders')">
        <div class="stat-icon blue"><Package :size="18" /></div>
        <div class="stat-val">{{ loading ? '—' : stats.total }}</div>
        <div class="stat-lbl">Всего</div>
      </div>
      <div class="stat-card" @click="router.push('/cabinet/client/orders?status=active')">
        <div class="stat-icon orange"><Clock :size="18" /></div>
        <div class="stat-val">{{ loading ? '—' : stats.active }}</div>
        <div class="stat-lbl">Активных</div>
      </div>
      <div class="stat-card" @click="router.push('/cabinet/client/orders?status=completed')">
        <div class="stat-icon green"><CheckCircle :size="18" /></div>
        <div class="stat-val">{{ loading ? '—' : stats.completed }}</div>
        <div class="stat-lbl">Завершённых</div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="section-title">Быстрые действия</div>
    <div class="actions-row">
      <button class="action-btn primary" @click="router.push('/cabinet/client/orders/create')">
        <Plus :size="18" />
        <span>Новый заказ</span>
      </button>
      <button class="action-btn" @click="router.push('/cabinet/client/orders')">
        <Package :size="18" />
        <span>Мои заказы</span>
      </button>
    </div>

    <!-- Recent orders -->
    <div v-if="!loading && recent.length > 0">
      <div class="section-row">
        <span class="section-title" style="margin-bottom:0">Последние заказы</span>
        <button class="see-all" @click="router.push('/cabinet/client/orders')">Все →</button>
      </div>

      <div class="order-list">
        <div
          v-for="o in recent"
          :key="o.id"
          class="order-card"
          @click="router.push(`/cabinet/client/orders/${o.id}`)"
        >
          <div class="order-route">
            <span class="dot from" />
            <span class="city">{{ o.fromCity }}</span>
            <div class="route-line" />
            <span class="dot to" />
            <span class="city">{{ o.toCity }}</span>
          </div>
          <div class="order-meta">
            <span class="order-title">{{ o.title }}</span>
            <span
              class="status-badge"
              :style="{ background: STATUS_COLOR[o.status] + '18', color: STATUS_COLOR[o.status] }"
            >{{ STATUS_LABEL[o.status] ?? o.status }}</span>
          </div>
          <div class="order-date">Погрузка: {{ formatDate(o.readyDate) }}</div>
        </div>
      </div>
    </div>

    <!-- Loading / empty -->
    <div v-if="loading" class="state-center">
      <div class="spinner" />
    </div>
    <div v-else-if="!profileMissing && orders.length === 0" class="empty-state">
      <Package :size="44" class="empty-icon" />
      <p class="empty-title">Заказов пока нет</p>
      <button class="btn-create" @click="router.push('/cabinet/client/orders/create')">
        Создать первый заказ
      </button>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 0 16px 24px;
  background: #f2f4f7;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0 16px;
}
.greeting { font-size: 0.8rem; color: #999; margin: 0; }
.username { font-size: 1.2rem; font-weight: 800; color: #1a1a1a; margin: 2px 0 0; }

.create-fab {
  width: 44px; height: 44px;
  background: #1a5bc4; color: white;
  border: none; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
}

.banner {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; border-radius: 10px;
  font-size: 0.82rem; font-weight: 500;
  margin-bottom: 16px; cursor: pointer;
}
.banner-warn { background: #fff8e1; color: #e65100; }
.banner span:nth-child(2) { flex: 1; }

.stats-row {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 10px; margin-bottom: 20px;
}
.stat-card {
  background: white; border-radius: 12px;
  padding: 14px 10px; text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  cursor: pointer;
}
.stat-icon {
  width: 34px; height: 34px; border-radius: 9px;
  margin: 0 auto 8px;
  display: flex; align-items: center; justify-content: center;
}
.stat-icon.blue   { background: #e3f2fd; color: #1976d2; }
.stat-icon.orange { background: #fff3e0; color: #ef6c00; }
.stat-icon.green  { background: #e8f5e9; color: #2e7d32; }
.stat-val { font-size: 1.3rem; font-weight: 800; color: #1a1a1a; }
.stat-lbl { font-size: 0.68rem; color: #999; font-weight: 600; margin-top: 2px; }

.section-title { font-size: 0.78rem; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.section-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.see-all { background: none; border: none; color: #1a5bc4; font-size: 0.82rem; font-weight: 600; cursor: pointer; padding: 0; }

.actions-row { display: flex; gap: 10px; margin-bottom: 24px; }
.action-btn {
  flex: 1; height: 48px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 0.88rem; font-weight: 700; cursor: pointer; border: none;
  background: white; color: #1a5bc4; box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.action-btn.primary { background: #1a5bc4; color: white; }

.order-list { display: flex; flex-direction: column; gap: 10px; }
.order-card {
  background: white; border-radius: 12px;
  padding: 14px 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06);
  cursor: pointer; display: flex; flex-direction: column; gap: 6px;
}
.order-route { display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot.from { background: #1a5bc4; }
.dot.to   { background: #d0021b; }
.city { font-size: 0.9rem; font-weight: 700; color: #222; }
.route-line { flex: 1; height: 1px; background: #e0e0e0; min-width: 8px; }

.order-meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.order-title { font-size: 0.8rem; color: #666; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; flex-shrink: 0; }

.order-date { font-size: 0.75rem; color: #aaa; }

.state-center { display: flex; justify-content: center; padding: 40px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e0e0e0; border-top-color: #1a5bc4; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 24px; text-align: center; }
.empty-icon { color: #ddd; }
.empty-title { font-size: 0.95rem; color: #999; margin: 0; }
.btn-create { background: #1a5bc4; color: white; border: none; border-radius: 10px; padding: 12px 28px; font-weight: 700; font-size: 0.9rem; cursor: pointer; }
</style>
