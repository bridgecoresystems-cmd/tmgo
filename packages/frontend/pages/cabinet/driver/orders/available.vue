<template>
  <div>
    <UiBackBtn to="/cabinet/driver/orders" />

    <n-alert v-if="vehicles.length === 0" type="warning" style="margin-bottom: 16px">
      {{ t('driver.orders.addVehicleFirst') }}
      <template #footer>
        <n-button size="small" @click="navigateTo('/cabinet/driver/vehicles/create')">
          {{ t('driver.orders.addVehicle') }}
        </n-button>
      </template>
    </n-alert>

    <!-- Filters -->
    <n-card style="margin-bottom: 16px">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end;">
        <div style="flex: 1; min-width: 140px;">
          <div class="filter-label">{{ t('driver.orders.filterFrom') }}</div>
          <n-select
            v-model:value="fromCountry"
            :options="countryOptions"
            clearable
            :placeholder="t('driver.orders.filterAny')"
          />
        </div>
        <div style="flex: 1; min-width: 140px;">
          <div class="filter-label">{{ t('driver.orders.filterTo') }}</div>
          <n-select
            v-model:value="toCountry"
            :options="countryOptions"
            clearable
            :placeholder="t('driver.orders.filterAny')"
          />
        </div>
        <n-input
          v-model:value="search"
          :placeholder="t('driver.orders.searchPlaceholder')"
          clearable
          style="min-width: 200px; flex: 1;"
        />
        <n-button type="primary" @click="loadOrders">{{ t('driver.orders.filterApply') }}</n-button>
        <n-button v-if="fromCountry || toCountry || search" @click="resetFilters">{{ t('driver.orders.filterReset') }}</n-button>
      </div>
    </n-card>

    <!-- Loading -->
    <div v-if="loading" style="padding: 60px; text-align: center;">
      <n-spin size="large" />
    </div>

    <!-- Empty -->
    <n-empty
      v-else-if="filtered.length === 0"
      :description="t('driver.orders.noAvailableOrders')"
      style="padding: 60px;"
    >
      <template #extra>
        <p style="color: #999; font-size: 13px; margin: 0;">{{ t('driver.orders.noAvailableOrdersHint') }}</p>
      </template>
    </n-empty>

    <!-- Cards grid -->
    <div v-else class="cards-grid">
      <div
        v-for="order in filtered"
        :key="order.id"
        class="order-card"
        @click="navigateTo(`/cabinet/driver/orders/${order.id}`)"
      >
        <!-- Route -->
        <div class="route-row">
          <div class="route-point">
            <span class="dot from-dot" />
            <div>
              <div class="city">{{ order.fromCity }}</div>
              <div class="country-code">{{ order.fromCountry }}</div>
            </div>
          </div>
          <div class="route-arrow">→</div>
          <div class="route-point">
            <span class="dot to-dot" />
            <div>
              <div class="city">{{ order.toCity }}</div>
              <div class="country-code">{{ order.toCountry }}</div>
            </div>
          </div>
        </div>

        <!-- Title -->
        <div class="order-title"><strong style="color: #333">#ORD{{ order.seqNo || order.id.split('-')[0] }}</strong> • {{ order.title }}</div>

        <!-- Tags -->
        <div class="tags-row">
          <n-tag v-if="order.cargoType" size="small" :bordered="false" type="success">
            {{ order.cargoType }}
          </n-tag>
          <n-tag v-if="order.weightKg" size="small" :bordered="false">
            ⚖ {{ formatWeight(order.weightKg) }}
          </n-tag>
          <n-tag v-if="order.volumeM3" size="small" :bordered="false">
            {{ order.volumeM3 }} м³
          </n-tag>
          <n-tag v-if="order.tempControlled" size="small" :bordered="false" type="info">
            🌡 {{ t('driver.orders.tempControlled') }}
          </n-tag>
        </div>

        <!-- Bottom row -->
        <div class="card-footer">
          <span class="ready-date">📅 {{ formatDate(order.readyDate) }}</span>
          <div class="footer-right">
            <span v-if="order.price" class="price-val">{{ order.price }} {{ order.currency }}</span>
            <n-tag v-if="order.bidsCount" size="small" type="warning" :bordered="false">
              {{ order.bidsCount }} {{ t('driver.orders.bidsCount') }}
            </n-tag>
            <span class="respond-hint">{{ t('driver.orders.respondHint') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver' })

const { apiBase: API } = useApiBase()

const loading   = ref(true)
const orders    = ref<any[]>([])
const vehicles  = ref<any[]>([])
const search    = ref('')
const fromCountry = ref<string | null>(null)
const toCountry   = ref<string | null>(null)

const COUNTRIES = [
  { value: 'TM', label: '🇹🇲 Туркменистан' },
  { value: 'UZ', label: '🇺🇿 Узбекистан' },
  { value: 'KZ', label: '🇰🇿 Казахстан' },
  { value: 'KG', label: '🇰🇬 Кыргызстан' },
  { value: 'TJ', label: '🇹🇯 Таджикистан' },
  { value: 'IR', label: '🇮🇷 Иран' },
  { value: 'TR', label: '🇹🇷 Турция' },
  { value: 'AE', label: '🇦🇪 ОАЭ' },
  { value: 'RU', label: '🇷🇺 Россия' },
  { value: 'BY', label: '🇧🇾 Беларусь' },
  { value: 'CN', label: '🇨🇳 Китай' },
]

const countryOptions = COUNTRIES

const filtered = computed(() => {
  if (!search.value) return orders.value
  const q = search.value.toLowerCase()
  return orders.value.filter(o =>
    (o.title ?? '').toLowerCase().includes(q) ||
    (o.fromCity ?? '').toLowerCase().includes(q) ||
    (o.toCity ?? '').toLowerCase().includes(q) ||
    (o.cargoType ?? '').toLowerCase().includes(q)
  )
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatWeight(w: string | null) {
  if (!w) return ''
  const n = parseFloat(w)
  return n >= 1000 ? `${(n / 1000).toFixed(1)} т` : `${n} кг`
}

function resetFilters() {
  fromCountry.value = null
  toCountry.value = null
  search.value = ''
  loadOrders()
}

async function loadOrders() {
  loading.value = true
  try {
    const q = new URLSearchParams()
    if (fromCountry.value) q.set('fromCountry', fromCountry.value)
    if (toCountry.value)   q.set('toCountry',   toCountry.value)
    const qs = q.toString() ? `?${q}` : ''
    const data = await $fetch<any>(`${API}/cabinet/driver/orders/available${qs}`, { credentials: 'include' })
    orders.value = data.orders ?? []
  } finally {
    loading.value = false
  }
}

async function loadVehicles() {
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/driver/vehicles`, { credentials: 'include' })
    vehicles.value = Array.isArray(data) ? data : []
  } catch { /* ignore */ }
}

onMounted(() => Promise.all([loadOrders(), loadVehicles()]))
</script>

<style scoped>
.filter-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}

.order-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.order-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
  border-color: #d0d0d0;
}

.route-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.route-point {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.from-dot { background: #1a5bc4; }
.to-dot   { background: #d0021b; }
.city {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}
.country-code {
  font-size: 11px;
  color: #bbb;
  text-transform: uppercase;
}
.route-arrow {
  color: #ccc;
  font-size: 16px;
  flex-shrink: 0;
}

.order-title {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}
.ready-date { font-size: 12px; color: #aaa; }
.footer-right { display: flex; align-items: center; gap: 8px; }
.price-val { font-size: 14px; font-weight: 700; color: #1a1a1a; }
.respond-hint { font-size: 12px; color: #18a058; font-weight: 700; }
</style>
