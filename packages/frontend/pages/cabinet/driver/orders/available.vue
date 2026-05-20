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

    <!-- Mode switch (all / near me) -->
    <n-card style="margin-bottom: 12px" :bordered="false" size="small">
      <div class="mode-row">
        <n-radio-group v-model:value="mode" @update:value="loadOrders">
          <n-radio-button value="all">{{ t('driver.orders.modeAll') }}</n-radio-button>
          <n-radio-button value="near">📍 {{ t('driver.orders.modeNear') }}</n-radio-button>
        </n-radio-group>
        <div v-if="mode === 'near'" class="radius-block">
          <span class="radius-label">{{ t('driver.orders.radiusLabel') }}</span>
          <n-slider
            v-model:value="radius"
            :min="5"
            :max="1000"
            :step="5"
            :marks="radiusMarks"
            style="flex: 1; min-width: 180px;"
            @update:value="onRadiusChange"
          />
          <n-input-number
            v-model:value="radius"
            :min="1"
            :max="2000"
            size="small"
            style="width: 100px;"
            @update:value="onRadiusChange"
          />
          <span style="color: #888;">{{ t('driver.orders.km') }}</span>
        </div>
      </div>
      <n-alert v-if="mode === 'near' && !loading && orders.length === 0" type="info" :show-icon="true" style="margin-top: 12px;">
        {{ t('driver.orders.nearEmptyHint') }}
      </n-alert>
    </n-card>

    <!-- Filters -->
    <n-card v-if="mode === 'all'" style="margin-bottom: 16px" :bordered="false" size="small">
      <div style="font-weight: 600; margin-bottom: 12px; color: #555;">{{ t('driver.orders.filterTitle') || 'Фильтры поиска' }}</div>
      <div class="filter-cols">
        <div>
          <div class="filter-label">{{ t('driver.orders.filterFrom') }}</div>
          <n-space vertical :size="8">
            <n-select
              v-model:value="fromCountry"
              :options="fromCountryOptions"
              clearable
              filterable
              remote
              :loading="fromCountryLoading"
              @search="onFromCountrySearch"
              :placeholder="t('driver.orders.filterAny')"
            />
            <n-auto-complete
              v-model:value="fromRegion"
              :options="fromRegionSuggestions"
              :loading="fromRegionLoading"
              :placeholder="t('driver.orders.regionPlaceholder')"
              clearable
              blur-after-select
              @update:value="onFromRegionInput"
            />
            <n-auto-complete
              v-model:value="fromCity"
              :options="fromCitySuggestions"
              :loading="fromCityLoading"
              :placeholder="t('driver.orders.cityPlaceholder')"
              clearable
              blur-after-select
              @update:value="onFromCityInput"
            />
          </n-space>
        </div>
        <div>
          <div class="filter-label">{{ t('driver.orders.filterTo') }}</div>
          <n-space vertical :size="8">
            <n-select
              v-model:value="toCountry"
              :options="toCountryOptions"
              clearable
              filterable
              remote
              :loading="toCountryLoading"
              @search="onToCountrySearch"
              :placeholder="t('driver.orders.filterAny')"
            />
            <n-auto-complete
              v-model:value="toRegion"
              :options="toRegionSuggestions"
              :loading="toRegionLoading"
              :placeholder="t('driver.orders.regionPlaceholder')"
              clearable
              blur-after-select
              @update:value="onToRegionInput"
            />
            <n-auto-complete
              v-model:value="toCity"
              :options="toCitySuggestions"
              :loading="toCityLoading"
              :placeholder="t('driver.orders.cityPlaceholder')"
              clearable
              blur-after-select
              @update:value="onToCityInput"
            />
          </n-space>
        </div>
      </div>
      <div class="filter-actions">
        <n-input
          v-model:value="search"
          :placeholder="t('driver.orders.searchPlaceholder')"
          clearable
          style="flex: 1; min-width: 0;"
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
          <n-tag v-if="order.distanceKm != null" size="small" :bordered="false" type="warning">
            📍 {{ order.distanceKm }} {{ t('driver.orders.km') }}
          </n-tag>
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
const mode      = ref<'all' | 'near'>('all')
const radius    = ref(100)
let radiusTimer: ReturnType<typeof setTimeout> | null = null
const radiusMarks = { 50: '50', 200: '200', 500: '500', 1000: '1000' }
const fromCountry = ref<string | null>(null)
const fromRegion  = ref('')
const fromCity    = ref('')
const toCountry   = ref<string | null>(null)
const toRegion    = ref('')
const toCity      = ref('')

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

const { fetchCountrySuggestions, fetchRegionSuggestions } = useNominatim()

const fromCountryOptions = ref([...countryOptions])
const toCountryOptions = ref([...countryOptions])
const fromCountryLoading = ref(false)
const toCountryLoading = ref(false)
let fromCountryTimer: ReturnType<typeof setTimeout> | null = null
let toCountryTimer: ReturnType<typeof setTimeout> | null = null

function onFromCountrySearch(query: string) {
  if (!query) { fromCountryOptions.value = [...countryOptions]; return }
  if (fromCountryTimer) clearTimeout(fromCountryTimer)
  fromCountryTimer = setTimeout(async () => {
    fromCountryLoading.value = true
    const res = await fetchCountrySuggestions(query)
    fromCountryOptions.value = res.length ? res : [...countryOptions]
    fromCountryLoading.value = false
  }, 350)
}

function onToCountrySearch(query: string) {
  if (!query) { toCountryOptions.value = [...countryOptions]; return }
  if (toCountryTimer) clearTimeout(toCountryTimer)
  toCountryTimer = setTimeout(async () => {
    toCountryLoading.value = true
    const res = await fetchCountrySuggestions(query)
    toCountryOptions.value = res.length ? res : [...countryOptions]
    toCountryLoading.value = false
  }, 350)
}

const fromRegionSuggestions = ref<string[]>([])
const toRegionSuggestions   = ref<string[]>([])
const fromRegionLoading = ref(false)
const toRegionLoading   = ref(false)
let fromRegionTimer: ReturnType<typeof setTimeout> | null = null
let toRegionTimer:   ReturnType<typeof setTimeout> | null = null

function onFromRegionInput(val: string) {
  if (fromRegionTimer) clearTimeout(fromRegionTimer)
  fromRegionTimer = setTimeout(async () => {
    fromRegionLoading.value = true
    fromRegionSuggestions.value = await fetchRegionSuggestions(val, fromCountry.value)
    fromRegionLoading.value = false
  }, 350)
}

function onToRegionInput(val: string) {
  if (toRegionTimer) clearTimeout(toRegionTimer)
  toRegionTimer = setTimeout(async () => {
    toRegionLoading.value = true
    toRegionSuggestions.value = await fetchRegionSuggestions(val, toCountry.value)
    toRegionLoading.value = false
  }, 350)
}

const fromCitySuggestions = ref<string[]>([])
const toCitySuggestions   = ref<string[]>([])
const fromCityLoading = ref(false)
const toCityLoading   = ref(false)
let fromCityTimer: ReturnType<typeof setTimeout> | null = null
let toCityTimer:   ReturnType<typeof setTimeout> | null = null

function onFromCityInput(val: string) {
  if (fromCityTimer) clearTimeout(fromCityTimer)
  fromCityTimer = setTimeout(async () => {
    fromCityLoading.value = true
    fromCitySuggestions.value = await fetchCitySuggestions(val, fromCountry.value, fromRegion.value)
    fromCityLoading.value = false
  }, 350)
}

function onToCityInput(val: string) {
  if (toCityTimer) clearTimeout(toCityTimer)
  toCityTimer = setTimeout(async () => {
    toCityLoading.value = true
    toCitySuggestions.value = await fetchCitySuggestions(val, toCountry.value, toRegion.value)
    toCityLoading.value = false
  }, 350)
}

watch(fromCountry, () => { fromRegion.value = ''; fromCity.value = ''; fromRegionSuggestions.value = []; fromCitySuggestions.value = [] })
watch(toCountry,   () => { toRegion.value   = ''; toCity.value   = ''; toRegionSuggestions.value   = []; toCitySuggestions.value   = [] })
watch(fromRegion,  () => { fromCity.value   = ''; fromCitySuggestions.value = [] })
watch(toRegion,    () => { toCity.value     = ''; toCitySuggestions.value   = [] })



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
  fromCountry.value = null; fromRegion.value = ''; fromCity.value = ''
  toCountry.value = null; toRegion.value = ''; toCity.value = ''
  search.value = ''
  loadOrders()
}

// /near отдаёт snake_case + distance_km, /available — camelCase без расстояния.
// Приводим к одной форме чтобы шаблон один.
function normalizeNear(o: any) {
  return {
    id: o.id,
    title: o.title,
    status: o.status,
    fromCountry: o.from_country,
    fromCity: o.from_city,
    toCountry: o.to_country,
    toCity: o.to_city,
    readyDate: o.ready_date,
    cargoType: o.cargo_type,
    weightKg: o.weight_kg,
    volumeM3: o.volume_m3,
    price: o.price,
    currency: o.currency,
    distanceKm: o.distance_km,
    seqNo: null,
    bidsCount: 0,
    tempControlled: false,
  }
}

function onRadiusChange() {
  if (mode.value !== 'near') return
  if (radiusTimer) clearTimeout(radiusTimer)
  radiusTimer = setTimeout(loadOrders, 350)
}

async function loadOrders() {
  loading.value = true
  try {
    if (mode.value === 'near') {
      const data = await $fetch<any[]>(`${API}/cabinet/driver/orders/near`, {
        credentials: 'include',
        query: { radius: radius.value, limit: 200 },
      })
      orders.value = (Array.isArray(data) ? data : []).map(normalizeNear)
      return
    }
    const q = new URLSearchParams()
    if (fromCountry.value) q.set('fromCountry', fromCountry.value)
    if (fromRegion.value)  q.set('fromRegion',  fromRegion.value)
    if (fromCity.value)    q.set('fromCity',    fromCity.value)
    if (toCountry.value)   q.set('toCountry',   toCountry.value)
    if (toRegion.value)    q.set('toRegion',    toRegion.value)
    if (toCity.value)      q.set('toCity',      toCity.value)
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
.mode-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
.radius-block {
  display: flex;
  flex: 1;
  min-width: 280px;
  align-items: center;
  gap: 10px;
}
.radius-label {
  font-size: 13px;
  color: #555;
  white-space: nowrap;
}
@media (max-width: 640px) {
  .radius-block { width: 100%; }
}

.filter-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.filter-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 0;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  align-items: center;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .filter-cols {
    grid-template-columns: 1fr;
  }
  .filter-actions > * { width: 100%; }
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
