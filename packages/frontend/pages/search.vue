<template>
  <div class="search-page">
    <div class="search-layout">

      <!-- Mobile: filter toggle -->
      <div class="mobile-filter-bar">
        <button class="mobile-filter-btn" @click="showMobileFilters = !showMobileFilters">
          ⚙ Фильтры<span v-if="activeFilterCount > 0" class="filter-count">{{ activeFilterCount }}</span>
        </button>
        <span class="mobile-results-count">{{ loading ? '...' : `${total} ${pluralOrders(total)}` }}</span>
      </div>

      <!-- Sidebar filters -->
      <aside class="filters-sidebar" :class="{ 'mobile-open': showMobileFilters }">
        <div class="filters-head">
          <span class="filters-title">Фильтры</span>
          <button v-if="activeFilterCount > 0" class="btn-reset" @click="clearFilters">Сбросить всё</button>
        </div>

        <n-divider title-placement="left"><span class="divider-label">Маршрут</span></n-divider>

        <div class="filter-group">
          <div class="filter-label">Откуда</div>
          <n-select
            v-model:value="filters.fromCountry"
            :options="countryOptions"
            placeholder="Страна"
            clearable
            filterable
            size="small"
            style="margin-bottom: 8px"
          />
          <n-input v-model:value="filters.fromCity" placeholder="Город" size="small" clearable />
        </div>

        <div class="filter-group">
          <div class="filter-label">Куда</div>
          <n-select
            v-model:value="filters.toCountry"
            :options="countryOptions"
            placeholder="Страна"
            clearable
            filterable
            size="small"
            style="margin-bottom: 8px"
          />
          <n-input v-model:value="filters.toCity" placeholder="Город" size="small" clearable />
        </div>

        <n-divider title-placement="left"><span class="divider-label">Груз</span></n-divider>

        <div class="filter-group">
          <div class="filter-label">Тип груза</div>
          <n-input v-model:value="filters.cargoType" placeholder="Любой" size="small" clearable />
        </div>

        <div class="filter-group">
          <div class="filter-label">Вес, кг</div>
          <div class="range-row">
            <n-input-number
              v-model:value="filters.weightMin"
              placeholder="От"
              size="small"
              :min="0"
              :show-button="false"
              style="flex: 1"
            />
            <span class="range-sep">—</span>
            <n-input-number
              v-model:value="filters.weightMax"
              placeholder="До"
              size="small"
              :min="0"
              :show-button="false"
              style="flex: 1"
            />
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-label">Объём, м³</div>
          <div class="range-row">
            <n-input-number
              v-model:value="filters.volumeMin"
              placeholder="От"
              size="small"
              :min="0"
              :show-button="false"
              style="flex: 1"
            />
            <span class="range-sep">—</span>
            <n-input-number
              v-model:value="filters.volumeMax"
              placeholder="До"
              size="small"
              :min="0"
              :show-button="false"
              style="flex: 1"
            />
          </div>
        </div>

        <div class="filter-group">
          <div class="filter-label">Упаковка</div>
          <n-select
            v-model:value="filters.packaging"
            :options="packagingOptions"
            placeholder="Любая"
            clearable
            size="small"
          />
        </div>

        <n-divider title-placement="left"><span class="divider-label">Дата</span></n-divider>

        <div class="filter-group">
          <div class="filter-label">Погрузка с</div>
          <n-date-picker
            v-model:value="readyFromMs"
            type="date"
            placeholder="Любая дата"
            clearable
            size="small"
            style="width: 100%"
          />
        </div>

        <n-button type="primary" block style="margin-top: 20px" @click="applyFilters">
          Найти
        </n-button>
      </aside>

      <!-- Results area -->
      <main class="results-main">
        <div class="results-header">
          <div class="results-meta">
            <span class="results-count">
              <template v-if="loading">Поиск...</template>
              <template v-else><strong>{{ total }}</strong> {{ pluralOrders(total) }}</template>
            </span>
            <div v-if="routeSummary" class="route-summary-label">{{ routeSummary }}</div>
          </div>
        </div>

        <div v-if="loading" class="state-center">
          <n-spin size="large" />
          <p class="state-text">Ищем грузы...</p>
        </div>

        <n-empty
          v-else-if="orders.length === 0"
          description="Грузов по вашему запросу не найдено"
          style="padding: 80px 0"
        >
          <template #extra>
            <n-button @click="clearFilters">Сбросить фильтры</n-button>
          </template>
        </n-empty>

        <div v-else class="orders-list">
          <div v-for="order in orders" :key="order.id" class="order-card">
            <!-- Route -->
            <div class="card-route">
              <div class="route-point">
                <span class="route-dot from-dot" />
                <div>
                  <div class="route-city">{{ order.fromCity }}</div>
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
                  <div class="route-city">{{ order.toCity }}</div>
                  <div class="route-country">{{ countryLabel(order.toCountry) }}</div>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div class="card-tags">
              <n-tag v-if="order.cargoType" size="small" type="info" :bordered="false">
                {{ order.cargoType }}
              </n-tag>
              <n-tag v-if="order.weightKg" size="small" :bordered="false">
                ⚖ {{ formatWeight(order.weightKg) }}
              </n-tag>
              <n-tag v-if="order.volumeM3" size="small" :bordered="false">
                {{ order.volumeM3 }} м³
              </n-tag>
              <n-tag v-if="order.packaging" size="small" :bordered="false">
                {{ packagingLabel(order.packaging) }}
              </n-tag>
            </div>

            <!-- Footer -->
            <div class="card-footer">
              <span class="card-date" v-if="order.readyDate">
                📅 Погрузка: {{ formatDate(order.readyDate) }}
              </span>
              <div class="card-footer-right">
                <n-tag
                  :type="order.status === 'published' ? 'success' : 'warning'"
                  size="small"
                  :bordered="false"
                >
                  {{ order.status === 'published' ? 'Открытый' : 'В переговорах' }}
                </n-tag>
                <n-button size="small" type="primary" ghost @click="navigateTo('/auth')">
                  Откликнуться
                </n-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="!loading && total > limit" class="pagination-wrap">
          <n-pagination
            v-model:page="page"
            :page-count="Math.ceil(total / limit)"
            @update:page="onPageChange"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { COUNTRY_LIST } = useCountryConfig()
const { apiBase } = useApiBase()

const filters = reactive({
  fromCountry: (route.query.fromCountry as string) || null as string | null,
  fromCity: (route.query.fromCity as string) || '',
  toCountry: (route.query.toCountry as string) || null as string | null,
  toCity: (route.query.toCity as string) || '',
  cargoType: (route.query.cargoType as string) || '',
  weightMin: route.query.weightMin ? Number(route.query.weightMin) : null as number | null,
  weightMax: route.query.weightMax ? Number(route.query.weightMax) : null as number | null,
  volumeMin: route.query.volumeMin ? Number(route.query.volumeMin) : null as number | null,
  volumeMax: route.query.volumeMax ? Number(route.query.volumeMax) : null as number | null,
  packaging: (route.query.packaging as string) || null as string | null,
})
const readyFromMs = ref<number | null>(
  route.query.readyFrom ? new Date(route.query.readyFrom as string).getTime() : null
)

const page = ref(1)
const limit = 20
const loading = ref(false)
const orders = ref<any[]>([])
const total = ref(0)
const showMobileFilters = ref(false)

const countryOptions = computed(() =>
  COUNTRY_LIST.map(c => ({ label: `${c.flag} ${c.name}`, value: c.code }))
)

const packagingOptions = [
  { label: 'Навалом', value: 'bulk' },
  { label: 'Коробки', value: 'boxes' },
  { label: 'Паллеты', value: 'pallets' },
  { label: 'Контейнер', value: 'container' },
  { label: 'Другое', value: 'other' },
]

const activeFilterCount = computed(() => [
  filters.fromCountry, filters.fromCity, filters.toCountry, filters.toCity,
  filters.cargoType, filters.weightMin, filters.weightMax,
  filters.volumeMin, filters.volumeMax, filters.packaging, readyFromMs.value,
].filter(Boolean).length)

const routeSummary = computed(() => {
  const from = [countryLabel(filters.fromCountry), filters.fromCity].filter(Boolean).join(', ')
  const to = [countryLabel(filters.toCountry), filters.toCity].filter(Boolean).join(', ')
  if (from && to) return `${from} → ${to}`
  if (from) return `Из ${from}`
  if (to) return `В ${to}`
  return ''
})

function countryLabel(code: string | null) {
  if (!code) return ''
  const c = COUNTRY_LIST.find(c => c.code === code)
  return c ? `${c.flag} ${c.name}` : code
}

function packagingLabel(val: string | null) {
  return packagingOptions.find(p => p.value === val)?.label ?? val ?? ''
}

function formatWeight(w: string | null) {
  if (!w) return ''
  const n = parseFloat(w)
  return n >= 1000 ? `${(n / 1000).toFixed(1)} т` : `${n} кг`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function pluralOrders(n: number) {
  const r = n % 100
  if (r >= 11 && r <= 19) return 'грузов'
  const r2 = n % 10
  if (r2 === 1) return 'груз'
  if (r2 >= 2 && r2 <= 4) return 'груза'
  return 'грузов'
}

function buildQuery() {
  const q: Record<string, string> = {}
  if (filters.fromCountry) q.fromCountry = filters.fromCountry
  if (filters.fromCity) q.fromCity = filters.fromCity
  if (filters.toCountry) q.toCountry = filters.toCountry
  if (filters.toCity) q.toCity = filters.toCity
  if (filters.cargoType) q.cargoType = filters.cargoType
  if (filters.weightMin != null) q.weightMin = String(filters.weightMin)
  if (filters.weightMax != null) q.weightMax = String(filters.weightMax)
  if (filters.volumeMin != null) q.volumeMin = String(filters.volumeMin)
  if (filters.volumeMax != null) q.volumeMax = String(filters.volumeMax)
  if (filters.packaging) q.packaging = filters.packaging
  if (readyFromMs.value) q.readyFrom = new Date(readyFromMs.value).toISOString().split('T')[0]
  q.page = String(page.value)
  q.limit = String(limit)
  return q
}

async function fetchOrders() {
  loading.value = true
  try {
    const data = await $fetch<any>(`${apiBase}/public/orders`, { query: buildQuery() })
    orders.value = data.orders ?? []
    total.value = data.total ?? 0
  } catch {
    orders.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  const q = buildQuery()
  delete q.page
  delete q.limit
  router.push({ path: '/search', query: q })
  showMobileFilters.value = false
  fetchOrders()
}

function clearFilters() {
  filters.fromCountry = null
  filters.fromCity = ''
  filters.toCountry = null
  filters.toCity = ''
  filters.cargoType = ''
  filters.weightMin = null
  filters.weightMax = null
  filters.volumeMin = null
  filters.volumeMax = null
  filters.packaging = null
  readyFromMs.value = null
}

function onPageChange(p: number) {
  page.value = p
  fetchOrders()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(fetchOrders)
</script>

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

/* Mobile filter bar (hidden on desktop) */
.mobile-filter-bar {
  display: none;
}

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

.filters-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.btn-reset {
  background: none;
  border: none;
  color: #ff6b4a;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.divider-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #999;
}

.filter-group {
  margin-bottom: 16px;
}

.filter-label {
  font-size: 12px;
  color: #888;
  font-weight: 500;
  margin-bottom: 6px;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.range-sep {
  color: #ccc;
  font-size: 14px;
  flex-shrink: 0;
}

/* Results area */
.results-main {
  flex: 1;
  min-width: 0;
}

.results-header {
  margin-bottom: 16px;
}

.results-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.results-count {
  font-size: 15px;
  color: #555;
}

.route-summary-label {
  font-size: 14px;
  color: #ff6b4a;
  font-weight: 600;
}

.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
  gap: 12px;
}

.state-text {
  color: #999;
  font-size: 14px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Order card */
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

.order-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

/* Route */
.card-route {
  display: flex;
  align-items: center;
  gap: 12px;
}

.route-point {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.route-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.from-dot { background: #1a5bc4; }
.to-dot { background: #ff6b4a; }

.route-city {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.route-country {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.route-arrow-line {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 40px;
}

.route-line-inner {
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.route-arrow-icon {
  color: #ccc;
  font-size: 14px;
  flex-shrink: 0;
}

/* Tags */
.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.card-date {
  font-size: 13px;
  color: #888;
}

.card-footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Pagination */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

/* Mobile */
@media (max-width: 768px) {
  .search-page {
    padding: 0 0 80px;
  }

  .search-layout {
    flex-direction: column;
    gap: 0;
  }

  .mobile-filter-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
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

  .filter-count {
    background: #ff6b4a;
    color: #fff;
    border-radius: 10px;
    padding: 0 6px;
    font-size: 11px;
  }

  .mobile-results-count {
    font-size: 13px;
    color: #888;
  }

  .filters-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    border-radius: 0;
    overflow-y: auto;
    transform: translateX(-100%);
    transition: transform 0.3s;
    width: 100%;
  }

  .filters-sidebar.mobile-open {
    transform: translateX(0);
  }

  .results-main {
    padding: 12px 16px;
  }

  .results-header {
    margin-bottom: 12px;
  }

  .route-city {
    max-width: 100px;
    font-size: 14px;
  }
}
</style>
