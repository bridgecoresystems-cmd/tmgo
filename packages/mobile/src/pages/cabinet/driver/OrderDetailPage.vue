<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Package, Calendar, Weight, Thermometer, Box } from 'lucide-vue-next'
import { getDriverOrderById, placeBid, BID_STATUS_LABEL, BID_STATUS_COLOR, STATUS_LABEL, STATUS_COLOR } from '@/api/cabinet'

const route  = useRoute()
const router = useRouter()

const loading    = ref(true)
const submitting = ref(false)
const order      = ref<any>(null)
const error      = ref('')

const showBidForm  = ref(false)
const bidAmount    = ref('')
const bidCurrency  = ref('USD')
const bidComment   = ref('')
const bidError     = ref('')
const bidSuccess   = ref(false)

const CURRENCIES = ['USD', 'EUR', 'TMT', 'RUB']

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await getDriverOrderById(route.params.id as string)
    order.value = data.order ?? data
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function submitBid() {
  bidError.value = ''
  const amount = parseFloat(bidAmount.value)
  if (!amount || amount <= 0) { bidError.value = 'Введите сумму ставки'; return }
  submitting.value = true
  try {
    await placeBid(route.params.id as string, amount, bidCurrency.value, bidComment.value || undefined)
    bidSuccess.value = true
    showBidForm.value = false
    await load()
  } catch (e: any) {
    bidError.value = e.message
  } finally {
    submitting.value = false
  }
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatWeight(w: string | null | undefined) {
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
      <h1 class="title">Детали груза</h1>
    </header>

    <div v-if="loading" class="state-center"><div class="spinner" /></div>

    <div v-else-if="error" class="state-center">
      <p class="error-text">{{ error }}</p>
      <button class="btn-action" @click="load">Повторить</button>
    </div>

    <template v-else-if="order">
      <!-- Route card -->
      <div class="card route-card">
        <div class="route-full">
          <div class="route-stop">
            <span class="stop-dot from" />
            <div class="stop-info">
              <span class="stop-city">{{ order.fromCity }}</span>
              <span class="stop-country">{{ order.fromCountry }}</span>
            </div>
          </div>
          <div class="route-connector">
            <div class="connector-line" />
            <span class="connector-arrow">→</span>
          </div>
          <div class="route-stop">
            <span class="stop-dot to" />
            <div class="stop-info">
              <span class="stop-city">{{ order.toCity }}</span>
              <span class="stop-country">{{ order.toCountry }}</span>
            </div>
          </div>
        </div>
        <div class="status-row">
          <span
            class="status-badge"
            :style="{ background: STATUS_COLOR[order.status] + '1a', color: STATUS_COLOR[order.status] }"
          >
            {{ STATUS_LABEL[order.status] ?? order.status }}
          </span>
          <span v-if="order.bidsCount" class="bids-count">{{ order.bidsCount }} ставок</span>
        </div>
      </div>

      <!-- Order title -->
      <div class="card">
        <div class="card-label">Описание</div>
        <p class="card-value">{{ order.title }}</p>
      </div>

      <!-- Dates -->
      <div class="card row-card">
        <div class="info-item">
          <Calendar :size="16" class="info-icon" />
          <div>
            <div class="info-label">Готов к отправке</div>
            <div class="info-val">{{ formatDate(order.readyDate) }}</div>
          </div>
        </div>
        <div v-if="order.deadlineDate" class="info-item">
          <Calendar :size="16" class="info-icon warn" />
          <div>
            <div class="info-label">Дедлайн</div>
            <div class="info-val">{{ formatDate(order.deadlineDate) }}</div>
          </div>
        </div>
      </div>

      <!-- Price -->
      <div v-if="order.price" class="card price-card">
        <span class="price-label">Бюджет</span>
        <span class="price-val">{{ order.price }} {{ order.currency }}</span>
      </div>

      <!-- Cargo details -->
      <div v-if="order.cargo || order.cargoType || order.weightKg" class="card">
        <div class="card-label">Груз</div>
        <div class="cargo-details">
          <div v-if="order.cargoType || order.cargo?.cargoType" class="detail-row">
            <Box :size="15" class="detail-icon" />
            <span>{{ order.cargoType ?? order.cargo?.cargoType }}</span>
          </div>
          <div v-if="order.weightKg || order.cargo?.weightKg" class="detail-row">
            <Weight :size="15" class="detail-icon" />
            <span>{{ formatWeight(order.weightKg ?? order.cargo?.weightKg) }}</span>
          </div>
          <div v-if="order.volumeM3 || order.cargo?.volumeM3" class="detail-row">
            <Package :size="15" class="detail-icon" />
            <span>{{ order.volumeM3 ?? order.cargo?.volumeM3 }} м³</span>
          </div>
          <div v-if="order.tempControlled || order.cargo?.tempControlled" class="detail-row">
            <Thermometer :size="15" class="detail-icon temp" />
            <span>Температурный контроль</span>
          </div>
          <div v-if="order.packaging || order.cargo?.packaging" class="detail-row">
            <Box :size="15" class="detail-icon" />
            <span>{{ order.packaging ?? order.cargo?.packaging }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="order.notes || order.cargo?.notes" class="card">
        <div class="card-label">Примечания</div>
        <p class="notes-text">{{ order.notes ?? order.cargo?.notes }}</p>
      </div>

      <!-- My bid status -->
      <div v-if="order.myBid" class="card bid-result-card">
        <div class="card-label">Моя ставка</div>
        <div class="bid-result-row">
          <span class="bid-result-amount">{{ order.myBid.amount }} {{ order.myBid.currency }}</span>
          <span
            class="bid-result-badge"
            :style="{ background: BID_STATUS_COLOR[order.myBid.status] + '1a', color: BID_STATUS_COLOR[order.myBid.status] }"
          >
            {{ BID_STATUS_LABEL[order.myBid.status] ?? order.myBid.status }}
          </span>
        </div>
        <p v-if="order.myBid.comment" class="bid-comment">{{ order.myBid.comment }}</p>
      </div>

      <!-- Success banner -->
      <div v-if="bidSuccess" class="success-banner">
        Ставка успешно отправлена!
      </div>

      <!-- Bid form -->
      <div v-if="showBidForm" class="card bid-form-card">
        <div class="card-label">Ваша ставка</div>
        <div v-if="bidError" class="bid-error">{{ bidError }}</div>

        <div class="amount-row">
          <input
            v-model="bidAmount"
            type="number"
            class="amount-input"
            placeholder="Сумма"
            min="1"
          />
          <select v-model="bidCurrency" class="currency-sel">
            <option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <textarea
          v-model="bidComment"
          class="comment-input"
          placeholder="Комментарий (необязательно)"
          rows="2"
        />

        <div class="bid-form-actions">
          <button class="btn-cancel" @click="showBidForm = false; bidError = ''">Отмена</button>
          <button class="btn-submit" :disabled="submitting" @click="submitBid">
            <span v-if="submitting" class="mini-spinner" />
            {{ submitting ? 'Отправка...' : 'Отправить' }}
          </button>
        </div>
      </div>

      <div class="bottom-space" />
    </template>

    <!-- Bottom action bar -->
    <div v-if="order && !order.myBid && order.status === 'published'" class="action-bar">
      <button class="btn-bid" @click="showBidForm = !showBidForm">
        {{ showBidForm ? 'Скрыть форму' : 'Откликнуться' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.page { background: #f2f4f7; min-height: 100%; padding-bottom: 80px; }

.header {
  background: white; display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; padding-top: calc(10px + var(--safe-area-top));
  border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10;
}
.icon-btn { background: none; border: none; color: #555; padding: 6px; cursor: pointer; display: flex; align-items: center; }
.title { font-size: 1rem; font-weight: 700; color: #1a1a1a; margin: 0; }

.state-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px 24px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e0e0e0; border-top-color: #18a058; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-text { color: #e53935; margin: 0; }
.btn-action { background: #18a058; color: white; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 600; cursor: pointer; }

.card { background: white; border-radius: 12px; margin: 12px 12px 0; padding: 14px 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.card-label { font-size: 0.7rem; font-weight: 700; color: #bbb; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 8px; }
.card-value { font-size: 0.9rem; color: #333; margin: 0; line-height: 1.45; }

/* Route card */
.route-card { }
.route-full { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.route-stop { display: flex; align-items: center; gap: 8px; flex: 1; }
.stop-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.stop-dot.from { background: #1a5bc4; }
.stop-dot.to   { background: #d0021b; }
.stop-info { display: flex; flex-direction: column; }
.stop-city { font-size: 1rem; font-weight: 700; color: #1a1a1a; }
.stop-country { font-size: 0.68rem; color: #bbb; text-transform: uppercase; }
.route-connector { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
.connector-line { width: 1px; height: 16px; background: #ddd; }
.connector-arrow { font-size: 0.75rem; color: #ccc; }

.status-row { display: flex; align-items: center; gap: 10px; }
.status-badge { font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
.bids-count { font-size: 0.72rem; color: #f0a020; font-weight: 600; }

/* Row card */
.row-card { display: flex; gap: 16px; }
.info-item { display: flex; align-items: flex-start; gap: 8px; flex: 1; }
.info-icon { color: #aaa; margin-top: 2px; flex-shrink: 0; }
.info-icon.warn { color: #f0a020; }
.info-label { font-size: 0.68rem; color: #bbb; text-transform: uppercase; letter-spacing: 0.3px; }
.info-val { font-size: 0.88rem; font-weight: 600; color: #222; margin-top: 2px; }

/* Price */
.price-card { display: flex; align-items: center; justify-content: space-between; }
.price-label { font-size: 0.78rem; color: #999; }
.price-val { font-size: 1.1rem; font-weight: 800; color: #1a1a1a; }

/* Cargo */
.cargo-details { display: flex; flex-direction: column; gap: 8px; }
.detail-row { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: #444; }
.detail-icon { color: #aaa; flex-shrink: 0; }
.detail-icon.temp { color: #1565c0; }

/* Notes */
.notes-text { font-size: 0.85rem; color: #555; margin: 0; line-height: 1.5; }

/* My bid */
.bid-result-card { }
.bid-result-row { display: flex; align-items: center; justify-content: space-between; }
.bid-result-amount { font-size: 1rem; font-weight: 700; color: #1a1a1a; }
.bid-result-badge { font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
.bid-comment { font-size: 0.82rem; color: #888; margin: 8px 0 0; }

/* Bid form */
.bid-form-card { }
.bid-error { background: #fff0f0; border-left: 3px solid #e53935; border-radius: 6px; padding: 8px 12px; font-size: 0.82rem; color: #c62828; margin-bottom: 12px; }
.amount-row { display: flex; gap: 8px; margin-bottom: 10px; }
.amount-input { flex: 1; border: 1.5px solid #e0e0e0; border-radius: 8px; padding: 10px 12px; font-size: 0.95rem; color: #222; outline: none; }
.amount-input:focus { border-color: #18a058; }
.currency-sel { border: 1.5px solid #e0e0e0; border-radius: 8px; padding: 10px 8px; font-size: 0.88rem; color: #222; background: #fafafa; outline: none; }
.comment-input { width: 100%; border: 1.5px solid #e0e0e0; border-radius: 8px; padding: 10px 12px; font-size: 0.88rem; color: #222; outline: none; resize: none; box-sizing: border-box; font-family: inherit; }
.comment-input:focus { border-color: #18a058; }
.bid-form-actions { display: flex; gap: 8px; margin-top: 12px; justify-content: flex-end; }
.btn-cancel { background: none; border: 1.5px solid #e0e0e0; border-radius: 8px; padding: 10px 16px; font-size: 0.85rem; color: #888; cursor: pointer; }
.btn-submit { background: #18a058; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-submit:disabled { opacity: 0.6; }
.mini-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }

.success-banner { background: #e8f5e9; border-left: 3px solid #18a058; border-radius: 8px; padding: 12px 16px; margin: 12px 12px 0; font-size: 0.88rem; color: #2e7d32; font-weight: 600; }

.bottom-space { height: 24px; }

.action-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: white; border-top: 1px solid #eee;
  padding: 12px 16px; padding-bottom: calc(12px + var(--safe-area-bottom));
  z-index: 20;
}
.btn-bid { width: 100%; height: 50px; background: #18a058; color: white; border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 700; cursor: pointer; }
</style>
