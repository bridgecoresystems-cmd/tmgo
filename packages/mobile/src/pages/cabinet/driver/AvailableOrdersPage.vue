<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Package, SlidersHorizontal } from 'lucide-vue-next'
import { getDriverAvailableOrders } from '@/api/cabinet'

const router = useRouter()

const loading = ref(true)
const orders  = ref<any[]>([])
const error   = ref('')
const showFilters = ref(false)

const fromCountry = ref('')
const toCountry   = ref('')

const COUNTRIES = [
  { code: 'TM', name: 'Туркменистан', flag: '🇹🇲' },
  { code: 'UZ', name: 'Узбекистан',   flag: '🇺🇿' },
  { code: 'KZ', name: 'Казахстан',    flag: '🇰🇿' },
  { code: 'KG', name: 'Кыргызстан',   flag: '🇰🇬' },
  { code: 'TJ', name: 'Таджикистан',  flag: '🇹🇯' },
  { code: 'IR', name: 'Иран',         flag: '🇮🇷' },
  { code: 'TR', name: 'Турция',       flag: '🇹🇷' },
  { code: 'AE', name: 'ОАЭ',          flag: '🇦🇪' },
  { code: 'RU', name: 'Россия',       flag: '🇷🇺' },
  { code: 'BY', name: 'Беларусь',     flag: '🇧🇾' },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    orders.value = await getDriverAvailableOrders({
      fromCountry: fromCountry.value || undefined,
      toCountry:   toCountry.value   || undefined,
    })
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
  return n >= 1000 ? `${(n/1000).toFixed(1)} т` : `${n} кг`
}

function applyFilters() {
  showFilters.value = false
  load()
}

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="header">
      <button class="icon-btn" @click="router.back()"><ArrowLeft :size="22" /></button>
      <div class="header-info">
        <h1 class="title">Доступные грузы</h1>
        <span v-if="!loading" class="sub">{{ orders.length }} заказов</span>
      </div>
      <button class="icon-btn filter-btn" :class="{ active: fromCountry || toCountry }" @click="showFilters = !showFilters">
        <SlidersHorizontal :size="20" />
      </button>
    </header>

    <!-- Filters panel -->
    <div v-if="showFilters" class="filters-panel">
      <div class="filter-row">
        <span class="filter-label">Откуда</span>
        <select v-model="fromCountry" class="filter-sel">
          <option value="">Любая страна</option>
          <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">{{ c.flag }} {{ c.name }}</option>
        </select>
      </div>
      <div class="filter-row">
        <span class="filter-label">Куда</span>
        <select v-model="toCountry" class="filter-sel">
          <option value="">Любая страна</option>
          <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">{{ c.flag }} {{ c.name }}</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn-reset" @click="fromCountry = ''; toCountry = ''; applyFilters()">Сбросить</button>
        <button class="btn-apply" @click="applyFilters">Применить</button>
      </div>
    </div>

    <div v-if="loading" class="state-center"><div class="spinner" /><p>Загрузка...</p></div>

    <div v-else-if="error" class="state-center">
      <p class="error-text">{{ error }}</p>
      <button class="btn-action" @click="load">Повторить</button>
    </div>

    <div v-else-if="orders.length === 0" class="state-center">
      <Package :size="48" style="color:#ddd" />
      <p style="color:#999;margin:0">Доступных грузов нет</p>
      <p style="color:#ccc;font-size:.82rem;margin:0">Попробуйте изменить фильтры или зайти позже</p>
    </div>

    <div v-else class="list">
      <div
        v-for="o in orders"
        :key="o.id"
        class="order-card"
        @click="router.push(`/cabinet/driver/orders/${o.id}`)"
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

        <!-- Cargo info -->
        <div class="cargo-row">
          <span v-if="o.cargoType"  class="tag cargo">{{ o.cargoType }}</span>
          <span v-if="o.weightKg"   class="tag">⚖ {{ formatWeight(o.weightKg) }}</span>
          <span v-if="o.volumeM3"   class="tag">{{ o.volumeM3 }} м³</span>
          <span v-if="o.tempControlled" class="tag temp">🌡️ Темп.</span>
        </div>

        <!-- Bottom row -->
        <div class="bottom-row">
          <span class="date">📅 {{ formatDate(o.readyDate) }}</span>
          <div class="right">
            <span v-if="o.price" class="price">{{ o.price }} {{ o.currency }}</span>
            <span v-if="o.bidsCount" class="bids-cnt">{{ o.bidsCount }} ставок</span>
            <span class="respond-hint">Откликнуться →</span>
          </div>
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
  border-bottom: 1px solid #eee; gap: 8px;
  position: sticky; top: 0; z-index: 10;
}
.icon-btn { background: none; border: none; color: #555; padding: 6px; cursor: pointer; display: flex; align-items: center; }
.filter-btn { color: #aaa; }
.filter-btn.active { color: var(--primary); }
.header-info { flex: 1; }
.title { font-size: 1rem; font-weight: 700; color: #1a1a1a; margin: 0; }
.sub { font-size: 0.72rem; color: #999; }

.filters-panel {
  background: white; border-bottom: 1px solid #eee; padding: 12px 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.filter-row { display: flex; align-items: center; gap: 12px; }
.filter-label { font-size: 0.82rem; color: #888; width: 56px; flex-shrink: 0; }
.filter-sel { flex: 1; border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px 10px; font-size: 0.88rem; color: #222; background: #fafafa; outline: none; }
.filter-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 4px; }
.btn-reset { background: none; border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px 14px; font-size: 0.82rem; color: #888; cursor: pointer; }
.btn-apply { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 8px 18px; font-size: 0.82rem; font-weight: 700; cursor: pointer; }

.state-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px 24px; text-align: center; }
.spinner { width: 32px; height: 32px; border: 3px solid #e0e0e0; border-top-color: var(--primary); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-text { color: #e53935; margin: 0; }
.btn-action { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 600; cursor: pointer; }

.list { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

.order-card { background: white; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 9px; box-shadow: 0 1px 4px rgba(0,0,0,.07); cursor: pointer; }
.route-row { display: flex; align-items: center; gap: 6px; }
.route-pt { display: flex; align-items: center; gap: 5px; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot.from { background: var(--primary); }
.dot.to   { background: #d0021b; }
.city { font-size: 0.95rem; font-weight: 700; color: #222; }
.country { font-size: 0.68rem; color: #aaa; text-transform: uppercase; }
.route-line { flex: 1; height: 1px; background: #eee; min-width: 12px; }

.cargo-row { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { font-size: 0.72rem; font-weight: 500; color: #555; background: #f0f4fa; padding: 3px 8px; border-radius: 4px; }
.tag.cargo { background: #e8f5e9; color: #2e7d32; }
.tag.temp  { background: #e3f2fd; color: #1565c0; }

.bottom-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.date { font-size: 0.75rem; color: #aaa; }
.right { display: flex; align-items: center; gap: 8px; }
.price { font-size: 0.82rem; font-weight: 700; color: #1a1a1a; }
.bids-cnt { font-size: 0.72rem; color: #f0a020; font-weight: 600; }
.respond-hint { font-size: 0.75rem; color: var(--primary); font-weight: 700; }
</style>
