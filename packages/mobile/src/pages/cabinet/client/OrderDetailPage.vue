<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, MapPin, Package, Weight, Calendar, Banknote, FileText } from 'lucide-vue-next'
import { getOrderById, publishOrder, STATUS_LABEL, STATUS_COLOR } from '@/api/cabinet'

const router = useRouter()
const route  = useRoute()

const loading   = ref(true)
const publishing = ref(false)
const order     = ref<any>(null)
const cargo     = ref<any>(null)
const bids      = ref<any[]>([])
const error     = ref('')

async function load() {
  loading.value = true
  try {
    const data = await getOrderById(route.params.id as string)
    order.value = data.order
    cargo.value = data.cargo
    bids.value  = data.bids ?? []
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function publish() {
  publishing.value = true
  try {
    await publishOrder(order.value.id)
    await load()
  } catch (e: any) {
    error.value = e.message
  } finally {
    publishing.value = false
  }
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatWeight(w: string | null) {
  if (!w) return null
  const n = parseFloat(w)
  return n >= 1000 ? `${(n/1000).toFixed(1)} т` : `${n} кг`
}

onMounted(load)
</script>

<template>
  <div class="page">
    <!-- Header -->
    <header class="header">
      <button class="icon-btn" @click="router.back()"><ArrowLeft :size="22" /></button>
      <h1 class="title">Заказ</h1>
      <div v-if="order" class="status-pill" :style="{ background: STATUS_COLOR[order.status]+'18', color: STATUS_COLOR[order.status] }">
        {{ STATUS_LABEL[order.status] ?? order.status }}
      </div>
    </header>

    <div v-if="loading" class="state-center"><div class="spinner" /></div>

    <div v-else-if="error" class="state-center">
      <p class="error-text">{{ error }}</p>
      <button class="btn-action" @click="load">Повторить</button>
    </div>

    <div v-else-if="order" class="content">

      <!-- Title -->
      <div class="card">
        <div class="card-title">{{ order.title }}</div>
        <div class="card-sub">Создан {{ formatDate(order.createdAt) }}</div>
      </div>

      <!-- Route -->
      <div class="section-label">Маршрут</div>
      <div class="card">
        <div class="route-block">
          <div class="route-pt">
            <div class="route-dot from" />
            <div class="route-info">
              <span class="route-city">{{ order.fromCity }}</span>
              <span class="route-country">{{ order.fromCountry }}</span>
            </div>
          </div>
          <div class="route-connector">
            <div class="connector-line" />
            <MapPin :size="14" class="connector-icon" />
          </div>
          <div class="route-pt">
            <div class="route-dot to" />
            <div class="route-info">
              <span class="route-city">{{ order.toCity }}</span>
              <span class="route-country">{{ order.toCountry }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dates + Price -->
      <div class="section-label">Детали</div>
      <div class="card">
        <div class="detail-row">
          <Calendar :size="16" class="detail-icon" />
          <span class="detail-label">Погрузка</span>
          <span class="detail-val">{{ formatDate(order.readyDate) }}</span>
        </div>
        <div v-if="order.deadlineDate" class="detail-row">
          <Calendar :size="16" class="detail-icon" />
          <span class="detail-label">Срок доставки</span>
          <span class="detail-val">{{ formatDate(order.deadlineDate) }}</span>
        </div>
        <div v-if="order.price" class="detail-row">
          <Banknote :size="16" class="detail-icon" />
          <span class="detail-label">Стоимость</span>
          <span class="detail-val">{{ order.price }} {{ order.currency }}</span>
        </div>
      </div>

      <!-- Cargo -->
      <template v-if="cargo">
        <div class="section-label">Груз</div>
        <div class="card">
          <div class="detail-row">
            <Package :size="16" class="detail-icon" />
            <span class="detail-label">Тип</span>
            <span class="detail-val">{{ cargo.cargoType }}</span>
          </div>
          <div v-if="cargo.weightKg" class="detail-row">
            <Weight :size="16" class="detail-icon" />
            <span class="detail-label">Вес</span>
            <span class="detail-val">{{ formatWeight(cargo.weightKg) }}</span>
          </div>
          <div v-if="cargo.volumeM3" class="detail-row">
            <Package :size="16" class="detail-icon" />
            <span class="detail-label">Объём</span>
            <span class="detail-val">{{ cargo.volumeM3 }} м³</span>
          </div>
          <div v-if="cargo.packaging" class="detail-row">
            <Package :size="16" class="detail-icon" />
            <span class="detail-label">Упаковка</span>
            <span class="detail-val">{{ cargo.packaging }}</span>
          </div>
          <div v-if="cargo.tempControlled" class="detail-row">
            <span class="detail-icon">🌡️</span>
            <span class="detail-label">Темп. режим</span>
            <span class="detail-val">Да</span>
          </div>
          <div v-if="cargo.notes" class="detail-row notes-row">
            <FileText :size="16" class="detail-icon" />
            <span class="detail-label">Примечание</span>
            <span class="detail-val notes">{{ cargo.notes }}</span>
          </div>
        </div>
      </template>

      <!-- Bids -->
      <div class="section-label">
        Отклики
        <span v-if="bids.length" class="bids-count">{{ bids.length }}</span>
      </div>
      <div v-if="bids.length === 0" class="card card-empty">
        <p>Откликов пока нет</p>
        <p v-if="order.status === 'draft'" class="hint">Опубликуйте заказ, чтобы перевозчики могли откликаться</p>
      </div>
      <div v-else class="card">
        <div v-for="bid in bids" :key="bid.id" class="bid-row">
          <div class="bid-name">{{ bid.driver?.name ?? 'Перевозчик' }}</div>
          <div v-if="bid.price" class="bid-price">{{ bid.price }} {{ bid.currency ?? order.currency }}</div>
        </div>
      </div>

      <!-- Publish button -->
      <div v-if="order.status === 'draft'" class="bottom-action">
        <button class="btn-publish" :disabled="publishing" @click="publish">
          <span v-if="publishing" class="spinner" />
          {{ publishing ? 'Публикуем...' : 'Опубликовать заказ' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { background: #f2f4f7; min-height: 100%; }

.header {
  background: white; display: flex; align-items: center;
  padding: 10px 14px; padding-top: calc(10px + var(--safe-area-top));
  border-bottom: 1px solid #eee; gap: 10px;
  position: sticky; top: 0; z-index: 10;
}
.icon-btn { background: none; border: none; color: #555; padding: 6px; cursor: pointer; display: flex; }
.title { flex: 1; font-size: 1rem; font-weight: 700; color: #1a1a1a; margin: 0; }
.status-pill { font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; flex-shrink: 0; }

.state-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px 24px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e0e0e0; border-top-color: #1a5bc4; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-text { color: #e53935; margin: 0; }
.btn-action { background: #1a5bc4; color: white; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 600; cursor: pointer; }

.content { padding: 12px 16px 32px; display: flex; flex-direction: column; gap: 6px; }

.card { background: white; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); margin-bottom: 8px; }
.card-title { font-size: 1.05rem; font-weight: 700; color: #1a1a1a; }
.card-sub { font-size: 0.75rem; color: #aaa; margin-top: 4px; }
.card-empty { text-align: center; color: #bbb; }
.card-empty p { margin: 4px 0; font-size: 0.88rem; }
.hint { font-size: 0.8rem; color: #ccc; }

.section-label { font-size: 0.7rem; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin: 4px 0 4px; display: flex; align-items: center; gap: 6px; }
.bids-count { background: #1a5bc4; color: white; font-size: 0.65rem; border-radius: 10px; padding: 1px 7px; }

/* Route */
.route-block { display: flex; flex-direction: column; gap: 12px; }
.route-pt { display: flex; align-items: center; gap: 12px; }
.route-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.route-dot.from { background: #1a5bc4; }
.route-dot.to   { background: #d0021b; }
.route-info { display: flex; flex-direction: column; }
.route-city { font-size: 1rem; font-weight: 700; color: #1a1a1a; }
.route-country { font-size: 0.72rem; color: #aaa; text-transform: uppercase; }
.route-connector { display: flex; align-items: center; gap: 8px; padding-left: 4px; }
.connector-line { width: 2px; height: 24px; background: #e0e0e0; margin-left: 5px; }
.connector-icon { color: #aaa; }

/* Details */
.detail-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.detail-row:last-child { border-bottom: none; }
.detail-icon { color: #aaa; flex-shrink: 0; margin-top: 1px; }
.detail-label { font-size: 0.82rem; color: #888; flex: 1; }
.detail-val { font-size: 0.88rem; font-weight: 600; color: #222; text-align: right; }
.notes-row { align-items: flex-start; }
.notes { text-align: left; white-space: pre-wrap; }

/* Bids */
.bid-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.bid-row:last-child { border-bottom: none; }
.bid-name { font-size: 0.88rem; font-weight: 600; color: #222; }
.bid-price { font-size: 0.88rem; font-weight: 700; color: #1a5bc4; }

.bottom-action { margin-top: 8px; }
.btn-publish {
  width: 100%; height: 52px; background: #18a058; color: white;
  border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: background .2s;
}
.btn-publish:active:not(:disabled) { background: #148a49; }
.btn-publish:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
</style>
