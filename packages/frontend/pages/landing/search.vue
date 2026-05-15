<template>
  <div class="search-page">
    <div class="search-layout">

      <!-- Mobile: filter toggle -->
      <div class="mobile-filter-bar">
        <button class="mobile-filter-btn" @click="showMobileFilters = !showMobileFilters">
          ⚙ {{ $t('searchPage.filters.title') }}<span v-if="activeFilterCount > 0" class="filter-count">{{ activeFilterCount }}</span>
        </button>
        <div class="mobile-view-toggle">
          <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">☰</button>
          <button :class="{ active: viewMode === 'map' }" @click="viewMode = 'map'">🗺</button>
        </div>
      </div>

      <!-- Sidebar filters -->
      <aside class="filters-sidebar" :class="{ 'mobile-open': showMobileFilters }">
        <div class="filters-head">
          <span class="filters-title">{{ $t('searchPage.filters.title') }}</span>
          <button v-if="activeFilterCount > 0" class="btn-reset" @click="clearFilters">{{ $t('searchPage.filters.resetAll') }}</button>
        </div>

        <n-divider title-placement="left"><span class="divider-label">{{ $t('searchPage.filters.route') }}</span></n-divider>

        <div class="filter-group">
          <div class="filter-label">{{ $t('searchPage.filters.from') }}</div>
          <n-select 
            v-model:value="filters.fromCountry" 
            :options="fromCountryOptions" 
            :placeholder="$t('searchPage.filters.country')" 
            clearable 
            filterable 
            remote
            :loading="fromCountryLoading"
            @search="onFromCountrySearch"
            size="small" 
            style="margin-bottom: 8px" 
          />
          <n-auto-complete
            v-model:value="filters.fromRegion"
            :options="fromRegionSuggestions"
            :loading="fromRegionLoading"
            :placeholder="$t('searchPage.filters.region')"
            size="small"
            clearable
            blur-after-select
            @update:value="onFromRegionInput"
            style="margin-bottom: 8px"
          />
          <n-auto-complete
            v-model:value="filters.fromCity"
            :options="fromCitySuggestions"
            :loading="fromCityLoading"
            :placeholder="$t('searchPage.filters.city')"
            size="small"
            clearable
            blur-after-select
            @update:value="onFromCityInput"
          />
        </div>

        <div class="filter-group">
          <div class="filter-label">{{ $t('searchPage.filters.to') }}</div>
          <n-select 
            v-model:value="filters.toCountry" 
            :options="toCountryOptions" 
            :placeholder="$t('searchPage.filters.country')" 
            clearable 
            filterable 
            remote
            :loading="toCountryLoading"
            @search="onToCountrySearch"
            size="small" 
            style="margin-bottom: 8px" 
          />
          <n-auto-complete
            v-model:value="filters.toRegion"
            :options="toRegionSuggestions"
            :loading="toRegionLoading"
            :placeholder="$t('searchPage.filters.region')"
            size="small"
            clearable
            blur-after-select
            @update:value="onToRegionInput"
            style="margin-bottom: 8px"
          />
          <n-auto-complete
            v-model:value="filters.toCity"
            :options="toCitySuggestions"
            :loading="toCityLoading"
            :placeholder="$t('searchPage.filters.city')"
            size="small"
            clearable
            blur-after-select
            @update:value="onToCityInput"
          />
        </div>

        <n-divider title-placement="left"><span class="divider-label">{{ $t('searchPage.filters.cargo') }}</span></n-divider>

        <div class="filter-group">
          <div class="filter-label">{{ $t('searchPage.filters.cargoType') }}</div>
          <n-input v-model:value="filters.cargoType" :placeholder="$t('searchPage.filters.anyType')" size="small" clearable />
        </div>

        <div class="filter-group">
          <div class="filter-label">{{ $t('searchPage.filters.weight') }}</div>
          <div class="range-row">
            <n-input-number v-model:value="filters.weightMin" :placeholder="$t('searchPage.filters.rangeFrom')" size="small" :min="0" :show-button="false" style="flex: 1" />
            <span class="range-sep">—</span>
            <n-input-number v-model:value="filters.weightMax" :placeholder="$t('searchPage.filters.rangeTo')" size="small" :min="0" :show-button="false" style="flex: 1" />
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-label">{{ $t('searchPage.filters.volume') }}</div>
          <div class="range-row">
            <n-input-number v-model:value="filters.volumeMin" :placeholder="$t('searchPage.filters.rangeFrom')" size="small" :min="0" :show-button="false" style="flex: 1" />
            <span class="range-sep">—</span>
            <n-input-number v-model:value="filters.volumeMax" :placeholder="$t('searchPage.filters.rangeTo')" size="small" :min="0" :show-button="false" style="flex: 1" />
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-label">{{ $t('searchPage.filters.packaging') }}</div>
          <n-select v-model:value="filters.packaging" :options="packagingOptions" :placeholder="$t('searchPage.filters.anyPackaging')" clearable size="small" />
        </div>

        <n-divider title-placement="left"><span class="divider-label">{{ $t('searchPage.filters.date') }}</span></n-divider>

        <div class="filter-group">
          <div class="filter-label">{{ $t('searchPage.filters.loadingFrom') }}</div>
          <n-date-picker v-model:value="readyFromMs" type="date" :placeholder="$t('searchPage.filters.anyDate')" clearable size="small" style="width: 100%" />
        </div>

        <n-button type="primary" block style="margin-top: 20px" @click="applyFilters">{{ $t('searchPage.filters.find') }}</n-button>
      </aside>

      <!-- Results area -->
      <main class="results-main">
        <div class="results-header">
          <div class="results-meta">
            <span class="results-count">
              <template v-if="loading">{{ $t('searchPage.results.loading') }}</template>
              <template v-else><strong>{{ total }}</strong> {{ pluralOrders(total) }}</template>
            </span>
            <div v-if="routeSummary" class="route-summary-label">{{ routeSummary }}</div>
          </div>

          <!-- View toggle (desktop) -->
          <div class="view-toggle">
            <button :class="['toggle-btn', { active: viewMode === 'list' }]" @click="viewMode = 'list'">
              ☰ {{ $t('searchPage.view.list') }}
            </button>
            <button :class="['toggle-btn', { active: viewMode === 'map' }]" @click="viewMode = 'map'">
              🗺 {{ $t('searchPage.view.map') }}
            </button>
          </div>
        </div>

        <!-- MAP VIEW -->
        <div v-show="viewMode === 'map'" class="map-section">
          <div class="map-toolbar">
            <div class="toolbar-left">
              <button
                :class="['btn-pick', { active: pickMode === 'from' }]"
                :disabled="geocoding"
                @click="pickMode = pickMode === 'from' ? null : 'from'"
              >
                🔵 {{ pickMode === 'from' ? (geocoding ? $t('searchPage.map.geocoding') : $t('searchPage.map.clickOnMap')) : $t('searchPage.map.pickFrom') }}
              </button>
              <button
                :class="['btn-pick', { active: pickMode === 'to' }]"
                :disabled="geocoding"
                @click="pickMode = pickMode === 'to' ? null : 'to'"
              >
                🔴 {{ pickMode === 'to' ? (geocoding ? $t('searchPage.map.geocoding') : $t('searchPage.map.clickOnMap')) : $t('searchPage.map.pickTo') }}
              </button>
              <div v-if="filters.fromCity || filters.toCity" class="pick-summary">
                <span v-if="filters.fromRegion">{{ filters.fromRegion }}, </span>
                <span v-if="filters.fromCity">{{ filters.fromCity }}</span>
                <span v-if="filters.fromCity && filters.toCity"> → </span>
                <span v-if="filters.toRegion">{{ filters.toRegion }}, </span>
                <span v-if="filters.toCity">{{ filters.toCity }}</span>
                <button class="pick-clear" @click="filters.fromCity=''; filters.toCity=''; filters.fromRegion=''; filters.toRegion=''; filters.fromCountry=null; filters.toCountry=null; if(pickMarker){ pickMarker.remove(); pickMarker=null }">✕</button>
              </div>
            </div>
            <div class="toolbar-right">
              <button class="btn-near-me" @click="nearMe" :disabled="locating">
                {{ locating ? ('⏳ ' + $t('searchPage.map.locating')) : ('📍 ' + $t('searchPage.map.nearMe')) }}
              </button>
              <div class="map-legend">
                <span class="legend-dot published" /> {{ $t('searchPage.map.legendPublished') }}
                <span class="legend-dot negotiating" /> {{ $t('searchPage.map.legendNegotiating') }}
              </div>
            </div>
          </div>
          <div ref="mapEl" class="map-container" />
        </div>

        <!-- LIST VIEW -->
        <template v-if="viewMode === 'list'">
          <div v-if="loading" class="state-center">
            <n-spin size="large" />
            <p class="state-text">{{ $t('searchPage.results.loadingCargo') }}</p>
          </div>

          <n-empty v-else-if="orders.length === 0" :description="$t('searchPage.results.empty')" style="padding: 80px 0">
            <template #extra>
              <n-button @click="clearFilters">{{ $t('searchPage.results.resetFilters') }}</n-button>
            </template>
          </n-empty>

          <div v-else class="orders-list">
            <div v-for="order in orders" :key="order.id" class="order-card">
              <div class="card-route">
                <div class="route-point">
                  <span class="route-dot from-dot" />
                  <div>
                    <div class="route-city">{{ order.fromRegion ? order.fromRegion + ', ' : '' }}{{ order.fromCity }}</div>
                    <div class="route-country">{{ countryLabel(order.fromCountry) }}</div>
                  </div>
                </div>
                <div class="route-arrow-line">
                  <div class="route-line-inner" />
                  <span class="route-arrow-icon">→</span>
                </div>
                <div class="route-point">
                  <span class="route-dot to-dot" />
                  <div>
                    <div class="route-city">{{ order.toRegion ? order.toRegion + ', ' : '' }}{{ order.toCity }}</div>
                    <div class="route-country">{{ countryLabel(order.toCountry) }}</div>
                  </div>
                </div>
              </div>

              <div class="card-tags">
                <n-tag v-if="order.cargoType" size="small" type="info" :bordered="false">{{ order.cargoType }}</n-tag>
                <n-tag v-if="order.weightKg" size="small" :bordered="false">⚖ {{ formatWeight(order.weightKg) }}</n-tag>
                <n-tag v-if="order.volumeM3" size="small" :bordered="false">{{ order.volumeM3 }} м³</n-tag>
                <n-tag v-if="order.packaging" size="small" :bordered="false">{{ packagingLabel(order.packaging) }}</n-tag>
              </div>

              <div class="card-footer">
                <span class="card-date" v-if="order.readyDate">📅 {{ $t('searchPage.results.loadingDate') }} {{ formatDate(order.readyDate) }}</span>
                <div class="card-footer-right">
                  <n-tag :type="order.status === 'published' ? 'success' : 'warning'" size="small" :bordered="false">
                    {{ order.status === 'published' ? $t('searchPage.results.published') : $t('searchPage.results.negotiating') }}
                  </n-tag>
                  <n-button size="small" type="primary" ghost @click="navigateTo('/auth')">{{ $t('searchPage.results.respond') }}</n-button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!loading && total > limit" class="pagination-wrap">
            <n-pagination v-model:page="page" :page-count="Math.ceil(total / limit)" @update:page="onPageChange" />
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { COUNTRY_LIST } = useCountryConfig()
const { apiBase } = useApiBase()
const { t, locale } = useI18n()

// ── Filters ──────────────────────────────────────────────────────────────────
const filters = reactive({
  fromCountry: (route.query.fromCountry as string) || null as string | null,
  fromRegion:  (route.query.fromRegion  as string) || '',
  fromCity:    (route.query.fromCity    as string) || '',
  toCountry:   (route.query.toCountry   as string) || null as string | null,
  toRegion:    (route.query.toRegion    as string) || '',
  toCity:      (route.query.toCity      as string) || '',
  cargoType:   (route.query.cargoType   as string) || '',
  weightMin:   route.query.weightMin ? Number(route.query.weightMin) : null as number | null,
  weightMax:   route.query.weightMax ? Number(route.query.weightMax) : null as number | null,
  volumeMin:   route.query.volumeMin ? Number(route.query.volumeMin) : null as number | null,
  volumeMax:   route.query.volumeMax ? Number(route.query.volumeMax) : null as number | null,
  packaging:   (route.query.packaging   as string) || null as string | null,
})
const readyFromMs = ref<number | null>(
  route.query.readyFrom ? new Date(route.query.readyFrom as string).getTime() : null
)

const page  = ref(1)
const limit = 20
const loading = ref(false)
const orders  = ref<any[]>([])
const total   = ref(0)
const showMobileFilters = ref(false)
const viewMode = ref<'list' | 'map'>('list')

// ── Options ──────────────────────────────────────────────────────────────────
const countryOptions = computed(() =>
  COUNTRY_LIST.map(c => ({ label: `${c.flag} ${c.name}`, value: c.code }))
)

// ── City autocomplete ─────────────────────────────────────────────────────────
const { fetchCountrySuggestions, fetchRegionSuggestions, fetchCitySuggestions } = useNominatim()

const fromCountryOptions = ref([...countryOptions.value])
const toCountryOptions = ref([...countryOptions.value])
const fromCountryLoading = ref(false)
const toCountryLoading = ref(false)
let fromCountryTimer: ReturnType<typeof setTimeout> | null = null
let toCountryTimer: ReturnType<typeof setTimeout> | null = null

function onFromCountrySearch(query: string) {
  if (!query) { fromCountryOptions.value = [...countryOptions.value]; return }
  if (fromCountryTimer) clearTimeout(fromCountryTimer)
  fromCountryTimer = setTimeout(async () => {
    fromCountryLoading.value = true
    const res = await fetchCountrySuggestions(query)
    fromCountryOptions.value = res.length ? res : [...countryOptions.value]
    fromCountryLoading.value = false
  }, 350)
}

function onToCountrySearch(query: string) {
  if (!query) { toCountryOptions.value = [...countryOptions.value]; return }
  if (toCountryTimer) clearTimeout(toCountryTimer)
  toCountryTimer = setTimeout(async () => {
    toCountryLoading.value = true
    const res = await fetchCountrySuggestions(query)
    toCountryOptions.value = res.length ? res : [...countryOptions.value]
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
    fromRegionSuggestions.value = await fetchRegionSuggestions(val, filters.fromCountry)
    fromRegionLoading.value = false
  }, 350)
}

function onToRegionInput(val: string) {
  if (toRegionTimer) clearTimeout(toRegionTimer)
  toRegionTimer = setTimeout(async () => {
    toRegionLoading.value = true
    toRegionSuggestions.value = await fetchRegionSuggestions(val, filters.toCountry)
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
    fromCitySuggestions.value = await fetchCitySuggestions(val, filters.fromCountry, filters.fromRegion)
    fromCityLoading.value = false
  }, 350)
}

function onToCityInput(val: string) {
  if (toCityTimer) clearTimeout(toCityTimer)
  toCityTimer = setTimeout(async () => {
    toCityLoading.value = true
    toCitySuggestions.value = await fetchCitySuggestions(val, filters.toCountry, filters.toRegion)
    toCityLoading.value = false
  }, 350)
}

watch(() => filters.fromCountry, () => { filters.fromRegion = ''; filters.fromCity = ''; fromRegionSuggestions.value = []; fromCitySuggestions.value = [] })
watch(() => filters.toCountry,   () => { filters.toRegion   = ''; filters.toCity   = ''; toRegionSuggestions.value   = []; toCitySuggestions.value   = [] })
watch(() => filters.fromRegion,  () => { filters.fromCity = ''; fromCitySuggestions.value = [] })
watch(() => filters.toRegion,    () => { filters.toCity   = ''; toCitySuggestions.value   = [] })

const packagingOptions = computed(() => [
  { label: t('searchPage.packaging.bulk'),      value: 'bulk'      },
  { label: t('searchPage.packaging.boxes'),     value: 'boxes'     },
  { label: t('searchPage.packaging.pallets'),   value: 'pallets'   },
  { label: t('searchPage.packaging.container'), value: 'container' },
  { label: t('searchPage.packaging.other'),     value: 'other'     },
])

// ── City coords (для карты) ───────────────────────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  // Туркменистан
  'Ашхабад': [37.9601, 58.3261], 'Мары': [37.5932, 61.8401],
  'Туркменабад': [39.0869, 63.5681], 'Дашогуз': [41.8361, 59.9667],
  'Туркменбашы': [40.0622, 52.9736], 'Балканабад': [39.5142, 54.3681],
  // Узбекистан
  'Ташкент': [41.2995, 69.2401], 'Самарканд': [39.6542, 66.9597],
  'Бухара': [39.7747, 64.4286], 'Навои': [40.0842, 65.3791],
  'Андижан': [40.7821, 72.3441], 'Фергана': [40.3842, 71.7874],
  'Наманган': [41.0011, 71.6686], 'Карши': [38.8575, 65.7861],
  'Нукус': [42.4627, 59.6058], 'Термез': [37.2244, 67.2783],
  // Казахстан
  'Алматы': [43.2220, 76.8512], 'Астана': [51.1801, 71.4460],
  'Шымкент': [42.3417, 69.5901], 'Актау': [43.6539, 51.1981],
  'Атырау': [47.1166, 51.8878], 'Актобе': [50.2839, 57.1664],
  'Тараз': [42.9000, 71.3667], 'Уральск': [51.2333, 51.3667],
  // Кыргызстан
  'Бишкек': [42.8746, 74.5698], 'Ош': [40.5283, 72.7985],
  // Таджикистан
  'Душанбе': [38.5598, 68.7870], 'Худжанд': [40.2960, 69.6244],
  // Иран
  'Тегеран': [35.6892, 51.3890], 'Мешхед': [36.2605, 59.6168],
  'Бандар-Аббас': [27.1865, 56.2808], 'Тебриз': [38.0800, 46.2919],
  // Турция
  'Стамбул': [41.0082, 28.9784], 'Анкара': [39.9334, 32.8597],
  'Трабзон': [41.0027, 39.7168], 'Газиантеп': [37.0662, 37.3833],
  // ОАЭ
  'Дубай': [25.2048, 55.2708], 'Абу-Даби': [24.4539, 54.3773],
  // Россия
  'Москва': [55.7558, 37.6173], 'Санкт-Петербург': [59.9311, 30.3609],
  'Казань': [55.8304, 49.0661], 'Краснодар': [45.0448, 38.9760],
  'Астрахань': [46.3497, 48.0408], 'Новосибирск': [54.9885, 82.9207],
  'Екатеринбург': [56.8389, 60.6057], 'Уфа': [54.7388, 55.9721],
  // Беларусь
  'Минск': [53.9045, 27.5615],
}

function getCityCoords(city: string): [number, number] | null {
  if (!city) return null
  if (CITY_COORDS[city]) return CITY_COORDS[city]
  const lower = city.toLowerCase()
  const key = Object.keys(CITY_COORDS).find(k => k.toLowerCase() === lower)
  return key ? CITY_COORDS[key] : null
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const activeFilterCount = computed(() =>
  [filters.fromCountry, filters.fromRegion, filters.fromCity, filters.toCountry, filters.toRegion, filters.toCity,
   filters.cargoType, filters.weightMin, filters.weightMax,
   filters.volumeMin, filters.volumeMax, filters.packaging, readyFromMs.value]
    .filter(Boolean).length
)

const routeSummary = computed(() => {
  const from = [countryLabel(filters.fromCountry), filters.fromCity].filter(Boolean).join(', ')
  const to   = [countryLabel(filters.toCountry),   filters.toCity  ].filter(Boolean).join(', ')
  if (from && to) return `${from} → ${to}`
  if (from) return t('searchPage.routeSummary.from', { city: from })
  if (to)   return t('searchPage.routeSummary.to',   { city: to })
  return ''
})

function countryLabel(code: string | null) {
  if (!code) return ''
  const c = COUNTRY_LIST.find(c => c.code === code)
  if (c) return `${c.flag} ${c.name}`
  const found = [...fromCountryOptions.value, ...toCountryOptions.value].find(o => o.value === code)
  return found ? found.label : code
}

function packagingLabel(val: string | null) {
  return packagingOptions.value.find(p => p.value === val)?.label ?? val ?? ''
}

function formatWeight(w: string | null) {
  if (!w) return ''
  const n = parseFloat(w)
  return n >= 1000
    ? `${(n / 1000).toFixed(1)} ${t('searchPage.weight.t')}`
    : `${n} ${t('searchPage.weight.kg')}`
}

const DATE_LOCALE_MAP: Record<string, string> = { ru: 'ru-RU', en: 'en-US', tk: 'tk-TM' }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(DATE_LOCALE_MAP[locale.value] ?? 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function pluralOrders(n: number) {
  if (locale.value === 'ru') {
    const r = n % 100
    if (r >= 11 && r <= 19) return t('searchPage.results.ordersMany')
    const r2 = n % 10
    if (r2 === 1) return t('searchPage.results.ordersOne')
    if (r2 >= 2 && r2 <= 4) return t('searchPage.results.ordersFew')
    return t('searchPage.results.ordersMany')
  }
  if (n === 1) return t('searchPage.results.ordersOne')
  return t('searchPage.results.ordersMany')
}

function buildQuery() {
  const q: Record<string, string> = {}
  if (filters.fromCountry) q.fromCountry = filters.fromCountry
  if (filters.fromRegion)  q.fromRegion  = filters.fromRegion
  if (filters.fromCity)    q.fromCity    = filters.fromCity
  if (filters.toCountry)   q.toCountry   = filters.toCountry
  if (filters.toRegion)    q.toRegion    = filters.toRegion
  if (filters.toCity)      q.toCity      = filters.toCity
  if (filters.cargoType)   q.cargoType   = filters.cargoType
  if (filters.weightMin != null) q.weightMin = String(filters.weightMin)
  if (filters.weightMax != null) q.weightMax = String(filters.weightMax)
  if (filters.volumeMin != null) q.volumeMin = String(filters.volumeMin)
  if (filters.volumeMax != null) q.volumeMax = String(filters.volumeMax)
  if (filters.packaging)   q.packaging   = filters.packaging
  if (readyFromMs.value)   q.readyFrom   = new Date(readyFromMs.value).toISOString().split('T')[0]
  q.page  = String(page.value)
  q.limit = String(limit)
  return q
}

// ── Data fetch ────────────────────────────────────────────────────────────────
async function fetchOrders() {
  loading.value = true
  try {
    const data = await $fetch<any>(`${apiBase}/public/orders`, { query: buildQuery() })
    orders.value = data.orders ?? []
    total.value  = data.total  ?? 0
  } catch {
    orders.value = []
    total.value  = 0
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  const q = buildQuery()
  delete q.page; delete q.limit
  router.push({ path: '/landing/search', query: q })
  showMobileFilters.value = false
  fetchOrders()
}

function clearFilters() {
  filters.fromCountry = null; filters.fromRegion = ''; filters.fromCity = ''
  filters.toCountry   = null; filters.toRegion   = ''; filters.toCity   = ''
  filters.cargoType   = ''
  filters.weightMin   = null; filters.weightMax = null
  filters.volumeMin   = null; filters.volumeMax = null
  filters.packaging   = null
  readyFromMs.value   = null
}

function onPageChange(p: number) {
  page.value = p
  fetchOrders()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Leaflet map ───────────────────────────────────────────────────────────────
const mapEl      = ref<HTMLDivElement | null>(null)
const locating   = ref(false)
const geocoding  = ref(false)
const pickMode   = ref<null | 'from' | 'to'>(null)
let   leafletMap:     any = null
let   markersLayer:   any = null
let   userMarker:     any = null
let   pickMarker:     any = null
let   L:              any = null

async function initMap() {
  if (!mapEl.value) return
  if (leafletMap) { updateMapMarkers(); return }

  L = (await import('leaflet')).default

  // Fix broken icons when bundled with Vite
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })

  leafletMap   = L.map(mapEl.value, { center: [40, 62], zoom: 4 })
  markersLayer = L.layerGroup().addTo(leafletMap)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(leafletMap)

  // Клик по карте — выбор точки откуда/куда
  leafletMap.on('click', async (e: any) => {
    if (!pickMode.value) return
    const { lat, lng } = e.latlng
    geocoding.value = true

    // Визуальный маркер в точке клика
    if (pickMarker) pickMarker.remove()
    pickMarker = L.circleMarker([lat, lng], {
      radius: 8, color: '#ff6b4a', fillColor: '#ff6b4a', fillOpacity: 0.8, weight: 2,
    }).addTo(leafletMap)

    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`,
        { headers: { 'User-Agent': 'TMGO-logistics/1.0' } }
      )
      const data = await res.json()
      const addr = data.address ?? {}
      const city = addr.city || addr.town || addr.village || addr.county || ''
      const state = addr.state || addr.region || ''
      const code = (addr.country_code ?? '').toUpperCase()

      if (pickMode.value === 'from') {
        filters.fromCountry = code || null
        filters.fromRegion  = state
        filters.fromCity    = city
        pickMode.value      = 'to'   // автопереход к "куда"
      } else {
        filters.toCountry   = code || null
        filters.toRegion    = state
        filters.toCity      = city
        pickMode.value      = null
        // автозапуск поиска когда оба поля выбраны
        await fetchOrders()
      }
    } finally {
      geocoding.value = false
    }
  })

  updateMapMarkers()
}

// Меняем курсор карты в зависимости от режима выбора
watch(pickMode, val => {
  if (!mapEl.value) return
  if (val) {
    mapEl.value.style.cursor = 'crosshair'
  } else {
    mapEl.value.style.cursor = ''
  }
})

function dotIcon(color: string) {
  return L.divIcon({
    html: `<div style="
      width:14px;height:14px;
      background:${color};
      border:2px solid #fff;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,.35);
    "></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  })
}

function updateMapMarkers() {
  if (!leafletMap || !markersLayer || !L) return
  markersLayer.clearLayers()

  for (const order of orders.value) {
    const coords = getCityCoords(order.fromCity)
    if (!coords) continue

    const color  = order.status === 'published' ? '#18a058' : '#f0a020'
    const weight = order.weightKg ? `<div style="color:#888;font-size:12px">⚖ ${formatWeight(order.weightKg)}</div>` : ''
    const cargo  = order.cargoType ? `<div style="margin-top:4px;color:#444">${order.cargoType}</div>` : ''

    L.marker(coords, { icon: dotIcon(color) })
      .addTo(markersLayer)
      .bindPopup(`
        <div style="min-width:180px;font-family:inherit">
          <b style="font-size:14px">${order.fromRegion ? order.fromRegion + ', ' : ''}${order.fromCity} → ${order.toRegion ? order.toRegion + ', ' : ''}${order.toCity}</b>
          ${cargo}${weight}
          <div style="margin-top:10px">
            <a href="/auth"
               style="display:inline-block;background:#ff6b4a;color:#fff;
                      border-radius:6px;padding:4px 12px;font-size:12px;
                      font-weight:600;text-decoration:none">
              ${t('searchPage.map.respondLink')}
            </a>
          </div>
        </div>
      `, { maxWidth: 220 })
  }
}

async function nearMe() {
  if (!navigator.geolocation) { alert(t('searchPage.map.noGeo')); return }
  if (!leafletMap) await initMap()

  locating.value = true
  navigator.geolocation.getCurrentPosition(
    pos => {
      locating.value = false
      const { latitude: lat, longitude: lng } = pos.coords

      if (userMarker) userMarker.remove()
      userMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<div style="
            width:18px;height:18px;
            background:#1a5bc4;
            border:3px solid #fff;
            border-radius:50%;
            box-shadow:0 2px 8px rgba(26,91,196,.5);
          "></div>`,
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      })
        .addTo(leafletMap)
        .bindPopup(`<b>📍 ${t('searchPage.map.youAreHere')}</b>`)
        .openPopup()

      leafletMap.setView([lat, lng], 7)
    },
    () => {
      locating.value = false
      alert(t('searchPage.map.geoError'))
    }
  )
}

// Switch to map → init
watch(viewMode, async val => {
  if (val === 'map') {
    await nextTick()
    await initMap()
  }
})

// New orders loaded while map is open → refresh markers
watch(orders, () => {
  if (viewMode.value === 'map') updateMapMarkers()
})

onMounted(fetchOrders)
</script>

<style>
/* Leaflet CSS — non-scoped so it applies globally */
@import 'leaflet/dist/leaflet.css';
</style>

<style scoped>
.search-page {
  background: #f5f6f8;
  min-height: calc(100vh - 80px);
  padding: 24px 40px;
}

.search-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* Mobile bar */
.mobile-filter-bar { display: none; }

/* Sidebar */
.filters-sidebar {
  width: 272px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  position: sticky;
  top: 104px;
}

.filters-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.filters-title { font-size: 16px; font-weight: 700; color: #1a1a1a; }
.btn-reset { background: none; border: none; color: #ff6b4a; font-size: 12px; font-weight: 600; cursor: pointer; padding: 0; }
.divider-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #999; }
.filter-group { margin-bottom: 16px; }
.filter-label { font-size: 12px; color: #888; font-weight: 500; margin-bottom: 6px; }
.range-row { display: flex; align-items: center; gap: 6px; }
.range-sep { color: #ccc; font-size: 14px; flex-shrink: 0; }

/* Results */
.results-main { flex: 1; min-width: 0; }

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.results-meta { display: flex; align-items: center; gap: 16px; }
.results-count { font-size: 15px; color: #555; }
.route-summary-label { font-size: 14px; color: #ff6b4a; font-weight: 600; }

/* View toggle */
.view-toggle {
  display: flex;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.toggle-btn {
  background: none;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.toggle-btn.active {
  background: #fff;
  color: #1a1a1a;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

/* Map */
.map-section { display: flex; flex-direction: column; gap: 0; }

.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 12px 12px 0 0;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-left  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.toolbar-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.btn-pick {
  background: #f0f4ff;
  border: 1px solid #d0daf5;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #1a5bc4;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-pick:hover   { background: #dce8ff; }
.btn-pick.active  { background: #1a5bc4; color: #fff; border-color: #1a5bc4; animation: pulse 1.2s infinite; }
.btn-pick:disabled { opacity: 0.6; cursor: not-allowed; }

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(26,91,196,0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(26,91,196,0); }
}

.pick-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff8f0;
  border: 1px solid #ffd0b0;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  color: #cc4400;
}

.pick-clear {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 14px;
  padding: 0 0 0 4px;
  line-height: 1;
}
.pick-clear:hover { color: #e53935; }

.btn-near-me {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1a5bc4;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-near-me:hover    { background: #154da0; }
.btn-near-me:disabled { background: #aaa; cursor: not-allowed; }

.map-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  margin-right: 4px;
}

.legend-dot.published   { background: #18a058; }
.legend-dot.negotiating { background: #f0a020; }

.map-container {
  width: 100%;
  height: 560px;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

/* List */
.state-center { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 12px; }
.state-text { color: #999; font-size: 14px; }

.orders-list { display: flex; flex-direction: column; gap: 12px; }

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); transform: translateY(-1px); }

.card-route { display: flex; align-items: center; gap: 12px; }
.route-point { display: flex; align-items: center; gap: 8px; min-width: 0; }

.route-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.from-dot { background: #1a5bc4; }
.to-dot   { background: #ff6b4a; }

.route-city    { font-size: 16px; font-weight: 700; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
.route-country { font-size: 11px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }

.route-arrow-line { flex: 1; display: flex; align-items: center; gap: 4px; min-width: 40px; }
.route-line-inner { flex: 1; height: 1px; background: #e0e0e0; }
.route-arrow-icon { color: #ccc; font-size: 14px; flex-shrink: 0; }

.card-tags { display: flex; gap: 8px; flex-wrap: wrap; }

.card-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.card-date { font-size: 13px; color: #888; }
.card-footer-right { display: flex; align-items: center; gap: 10px; }

.pagination-wrap { display: flex; justify-content: center; margin-top: 32px; }

/* Mobile */
@media (max-width: 768px) {
  .search-page { padding: 0 0 80px; }
  .search-layout { flex-direction: column; gap: 0; }

  .mobile-filter-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: #fff;
    border-bottom: 1px solid #eee;
    position: sticky;
    top: 80px;
    z-index: 10;
  }

  .mobile-filter-btn {
    background: #f0f4ff;
    border: 1px solid #d0daf5;
    border-radius: 20px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 600;
    color: #1a5bc4;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .filter-count { background: #ff6b4a; color: #fff; border-radius: 10px; padding: 0 6px; font-size: 11px; }

  .mobile-view-toggle {
    display: flex;
    background: #f0f0f0;
    border-radius: 8px;
    padding: 2px;
    gap: 2px;
  }

  .mobile-view-toggle button {
    background: none;
    border: none;
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 15px;
    cursor: pointer;
  }

  .mobile-view-toggle button.active {
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .filters-sidebar {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 100;
    border-radius: 0;
    overflow-y: auto;
    transform: translateX(-100%);
    transition: transform 0.3s;
    width: 100%;
  }

  .filters-sidebar.mobile-open { transform: translateX(0); }

  .results-main { padding: 12px 16px; }
  .view-toggle  { display: none; }
  .map-container { height: 400px; }
  .route-city { max-width: 100px; font-size: 14px; }
}
</style>
