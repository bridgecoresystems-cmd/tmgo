<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, SlidersHorizontal, Package, MapPin } from 'lucide-vue-next'
import { searchOrders, type Order } from '@/api/orders'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref('')
const orders = ref<Order[]>([])
const total = ref(0)

const q = route.query
const fromCity = computed(() => (q.fromCity as string) || '')
const toCity = computed(() => (q.toCity as string) || '')
const fromCountry = computed(() => (q.fromCountry as string) || '')
const toCountry = computed(() => (q.toCountry as string) || '')

const routeLabel = computed(() => {
  const from = [fromCountry.value, fromCity.value].filter(Boolean).join(' ') || '—'
  const to = [toCountry.value, toCity.value].filter(Boolean).join(' ') || '—'
  if (fromCity.value || fromCountry.value || toCity.value || toCountry.value) return `${from} → ${to}`
  return 'Все грузы'
})

const activeFilters = computed(() => {
  const f: string[] = []
  if (q.cargoType) f.push(q.cargoType as string)
  if (q.weightMin || q.weightMax) f.push(`${q.weightMin || '0'}–${q.weightMax || '∞'} кг`)
  if (q.volumeMin || q.volumeMax) f.push(`${q.volumeMin || '0'}–${q.volumeMax || '∞'} м³`)
  if (q.packaging) f.push(q.packaging as string)
  if (q.readyFrom) f.push(`с ${q.readyFrom}`)
  return f
})

function formatWeight(w: string | null) {
  if (!w) return ''
  const n = parseFloat(w)
  return n >= 1000 ? `${(n / 1000).toFixed(1)} т` : `${n} кг`
}

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await searchOrders({
      fromCity: fromCity.value || undefined,
      fromCountry: fromCountry.value || undefined,
      toCity: toCity.value || undefined,
      toCountry: toCountry.value || undefined,
      cargoType: (q.cargoType as string) || undefined,
      weightMin: q.weightMin ? Number(q.weightMin) : undefined,
      weightMax: q.weightMax ? Number(q.weightMax) : undefined,
      volumeMin: q.volumeMin ? Number(q.volumeMin) : undefined,
      volumeMax: q.volumeMax ? Number(q.volumeMax) : undefined,
      packaging: (q.packaging as string) || undefined,
      readyFrom: (q.readyFrom as string) || undefined,
    })
    orders.value = res.orders
    total.value = res.total
  } catch (e) {
    error.value = 'Не удалось загрузить грузы'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="results-layout">
    <!-- Header -->
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <ArrowLeft :size="22" />
      </button>
      <div class="header-info">
        <h1 class="header-title">{{ routeLabel }}</h1>
        <span class="header-sub" v-if="!loading">{{ total }} грузов</span>
      </div>
      <button class="filter-btn" @click="router.back()">
        <SlidersHorizontal :size="20" />
      </button>
    </header>

    <!-- Active filters strip -->
    <div v-if="activeFilters.length > 0" class="filter-strip">
      <span v-for="f in activeFilters" :key="f" class="filter-chip">{{ f }}</span>
      <button class="filter-edit" @click="router.back()">изменить</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-center">
      <div class="spinner"></div>
      <p>Ищем грузы...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-center">
      <p class="error-text">{{ error }}</p>
      <button class="btn-retry" @click="onMounted">Повторить</button>
    </div>

    <!-- Empty -->
    <div v-else-if="orders.length === 0" class="state-center">
      <Package :size="48" class="empty-icon" />
      <p class="empty-title">Грузов не найдено</p>
      <p class="empty-sub">Попробуйте изменить параметры поиска</p>
      <button class="btn-back" @click="router.back()">Изменить поиск</button>
    </div>

    <!-- Results -->
    <div v-else class="results-list">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
      >
        <!-- Route -->
        <div class="route-row">
          <div class="route-point">
            <span class="dot dot-from"></span>
            <span class="city">{{ order.fromCity }}</span>
            <span class="country">{{ order.fromCountry }}</span>
          </div>
          <div class="route-line"></div>
          <div class="route-point">
            <span class="dot dot-to"></span>
            <span class="city">{{ order.toCity }}</span>
            <span class="country">{{ order.toCountry }}</span>
          </div>
        </div>

        <!-- Cargo info -->
        <div class="cargo-row">
          <span class="cargo-type" v-if="order.cargoType">{{ order.cargoType }}</span>
          <span class="cargo-weight" v-if="order.weightKg">{{ formatWeight(order.weightKg) }}</span>
          <span class="cargo-volume" v-if="order.volumeM3">{{ order.volumeM3 }} м³</span>
        </div>

        <!-- Date -->
        <div class="date-row">
          <MapPin :size="13" class="date-icon" />
          <span class="date-text">Погрузка: {{ formatDate(order.readyDate) }}</span>
          <span class="status-badge" :class="order.status">
            {{ order.status === 'published' ? 'Открытый' : 'В переговорах' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f2f4f7;
}

.header {
  background: white;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  padding-top: calc(12px + var(--safe-area-top));
  border-bottom: 1px solid #e0e0e0;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn, .filter-btn {
  background: none;
  border: none;
  color: #555;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 1rem;
  font-weight: 700;
  color: #222;
}

.header-sub {
  font-size: 0.75rem;
  color: #999;
}

.state-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  gap: 12px;
  text-align: center;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e0e0e0;
  border-top-color: #1a5bc4;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon { color: #ccc; }
.empty-title { font-size: 1rem; font-weight: 600; color: #444; }
.empty-sub { font-size: 0.85rem; color: #999; }
.error-text { color: #e53935; font-size: 0.9rem; }

.btn-retry, .btn-back {
  background: #1a5bc4;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

.results-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-card {
  background: white;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.route-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.route-point {
  display: flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-from { background: #1a5bc4; }
.dot-to { background: #d0021b; }

.city {
  font-size: 0.95rem;
  font-weight: 700;
  color: #222;
}

.country {
  font-size: 0.7rem;
  color: #999;
  text-transform: uppercase;
}

.route-line {
  flex: 1;
  height: 1px;
  background: #e0e0e0;
  min-width: 16px;
}

.cargo-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cargo-type, .cargo-weight, .cargo-volume {
  font-size: 0.8rem;
  font-weight: 500;
  color: #555;
  background: #f0f4fa;
  padding: 3px 8px;
  border-radius: 4px;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-icon { color: #aaa; }

.date-text {
  font-size: 0.78rem;
  color: #888;
  flex: 1;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-badge.published {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.negotiating {
  background: #fff3e0;
  color: #ef6c00;
}

.filter-strip {
  background: white;
  border-bottom: 1px solid #eee;
  padding: 8px 16px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-chip {
  background: #e8f0fe;
  color: #1a5bc4;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}

.filter-edit {
  background: none;
  border: none;
  color: #1a5bc4;
  font-size: 0.72rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
}
</style>
