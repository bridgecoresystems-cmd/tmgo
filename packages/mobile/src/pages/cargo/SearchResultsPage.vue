<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, SlidersHorizontal, Package, MapPin, List, Map } from 'lucide-vue-next'
import { searchOrders, type Order } from '@/api/orders'

const router = useRouter()
const route  = useRoute()

const loading  = ref(true)
const error    = ref('')
const orders   = ref<Order[]>([])
const total    = ref(0)
const viewMode = ref<'list' | 'map'>('list')
const locating = ref(false)
const pickMode = ref<null | 'from' | 'to'>(null)
const geocoding = ref(false)

const q           = route.query
const fromCity    = computed(() => (q.fromCity    as string) || '')
const toCity      = computed(() => (q.toCity      as string) || '')
const fromCountry = computed(() => (q.fromCountry as string) || '')
const toCountry   = computed(() => (q.toCountry   as string) || '')

const routeLabel = computed(() => {
  const from = [fromCountry.value, fromCity.value].filter(Boolean).join(' ') || '—'
  const to   = [toCountry.value,   toCity.value  ].filter(Boolean).join(' ') || '—'
  if (fromCity.value || fromCountry.value || toCity.value || toCountry.value)
    return `${from} → ${to}`
  return 'Все грузы'
})

const activeFilters = computed(() => {
  const f: string[] = []
  if (q.cargoType) f.push(q.cargoType as string)
  if (q.weightMin || q.weightMax) f.push(`${q.weightMin || '0'}–${q.weightMax || '∞'} кг`)
  if (q.volumeMin || q.volumeMax) f.push(`${q.volumeMin || '0'}–${q.volumeMax || '∞'} м³`)
  if (q.packaging) f.push(q.packaging as string)
  if (q.readyFrom)  f.push(`с ${q.readyFrom}`)
  return f
})

// ── Координаты городов ────────────────────────────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  'Ашхабад': [37.9601, 58.3261], 'Мары': [37.5932, 61.8401],
  'Туркменабад': [39.0869, 63.5681], 'Дашогуз': [41.8361, 59.9667],
  'Туркменбашы': [40.0622, 52.9736], 'Балканабад': [39.5142, 54.3681],
  'Ташкент': [41.2995, 69.2401], 'Самарканд': [39.6542, 66.9597],
  'Бухара': [39.7747, 64.4286], 'Навои': [40.0842, 65.3791],
  'Андижан': [40.7821, 72.3441], 'Фергана': [40.3842, 71.7874],
  'Наманган': [41.0011, 71.6686], 'Карши': [38.8575, 65.7861],
  'Нукус': [42.4627, 59.6058], 'Термез': [37.2244, 67.2783],
  'Алматы': [43.2220, 76.8512], 'Астана': [51.1801, 71.4460],
  'Шымкент': [42.3417, 69.5901], 'Актау': [43.6539, 51.1981],
  'Атырау': [47.1166, 51.8878], 'Актобе': [50.2839, 57.1664],
  'Бишкек': [42.8746, 74.5698], 'Ош': [40.5283, 72.7985],
  'Душанбе': [38.5598, 68.7870], 'Худжанд': [40.2960, 69.6244],
  'Тегеран': [35.6892, 51.3890], 'Мешхед': [36.2605, 59.6168],
  'Бандар-Аббас': [27.1865, 56.2808],
  'Стамбул': [41.0082, 28.9784], 'Анкара': [39.9334, 32.8597],
  'Трабзон': [41.0027, 39.7168],
  'Дубай': [25.2048, 55.2708], 'Абу-Даби': [24.4539, 54.3773],
  'Москва': [55.7558, 37.6173], 'Санкт-Петербург': [59.9311, 30.3609],
  'Казань': [55.8304, 49.0661], 'Краснодар': [45.0448, 38.9760],
  'Астрахань': [46.3497, 48.0408],
  'Минск': [53.9045, 27.5615],
}

function getCityCoords(city: string): [number, number] | null {
  if (!city) return null
  if (CITY_COORDS[city]) return CITY_COORDS[city]
  const lower = city.toLowerCase()
  const key = Object.keys(CITY_COORDS).find(k => k.toLowerCase() === lower)
  return key ? CITY_COORDS[key] : null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatWeight(w: string | null) {
  if (!w) return ''
  const n = parseFloat(w)
  return n >= 1000 ? `${(n / 1000).toFixed(1)} т` : `${n} кг`
}

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

// ── Загрузка данных ───────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await searchOrders({
      fromCity:    fromCity.value    || undefined,
      fromCountry: fromCountry.value || undefined,
      toCity:      toCity.value      || undefined,
      toCountry:   toCountry.value   || undefined,
      cargoType:   (q.cargoType  as string) || undefined,
      weightMin:   q.weightMin  ? Number(q.weightMin)  : undefined,
      weightMax:   q.weightMax  ? Number(q.weightMax)  : undefined,
      volumeMin:   q.volumeMin  ? Number(q.volumeMin)  : undefined,
      volumeMax:   q.volumeMax  ? Number(q.volumeMax)  : undefined,
      packaging:   (q.packaging as string) || undefined,
      readyFrom:   (q.readyFrom as string) || undefined,
    })
    orders.value = res.orders
    total.value  = res.total
  } catch {
    error.value = 'Не удалось загрузить грузы'
  } finally {
    loading.value = false
  }
}

// ── Leaflet ───────────────────────────────────────────────────────────────────
const mapEl = ref<HTMLDivElement | null>(null)
let leafletMap:   any = null
let markersLayer: any = null
let userMarker:   any = null
let pickMarker:   any = null
let L:            any = null

async function initMap() {
  if (!mapEl.value) return
  if (leafletMap) { updateMarkers(); return }

  L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')

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

  // Клик на карте → выбор откуда/куда и поиск
  leafletMap.on('click', async (e: any) => {
    if (!pickMode.value) return
    const { lat, lng } = e.latlng
    geocoding.value = true

    if (pickMarker) pickMarker.remove()
    pickMarker = L.circleMarker([lat, lng], {
      radius: 8, color: '#ff6b4a', fillColor: '#ff6b4a', fillOpacity: 0.9, weight: 2,
    }).addTo(leafletMap)

    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`,
        { headers: { 'User-Agent': 'TMGO-logistics/1.0' } },
      )
      const data = await res.json()
      const addr = data.address ?? {}
      const city = addr.city || addr.town || addr.village || addr.county || ''
      const code = (addr.country_code ?? '').toUpperCase()

      const newQuery = { ...route.query } as Record<string, string>
      if (pickMode.value === 'from') {
        newQuery.fromCity    = city
        newQuery.fromCountry = code
        pickMode.value       = 'to'
      } else {
        newQuery.toCity    = city
        newQuery.toCountry = code
        pickMode.value     = null
        router.replace({ query: newQuery })
        await load()
      }
      if (pickMode.value !== null) {
        router.replace({ query: newQuery })
      }
    } finally {
      geocoding.value = false
    }
  })

  updateMarkers()
}

function dotIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  })
}

function updateMarkers() {
  if (!leafletMap || !markersLayer || !L) return
  markersLayer.clearLayers()
  for (const order of orders.value) {
    const coords = getCityCoords(order.fromCity)
    if (!coords) continue
    const color   = order.status === 'published' ? '#18a058' : '#f0a020'
    const weight  = order.weightKg ? `<div style="color:#888;font-size:12px">⚖ ${formatWeight(order.weightKg)}</div>` : ''
    const cargo   = order.cargoType ? `<div style="margin-top:4px;color:#444">${order.cargoType}</div>` : ''
    L.marker(coords, { icon: dotIcon(color) })
      .addTo(markersLayer)
      .bindPopup(`
        <div style="min-width:160px;font-family:inherit">
          <b>${order.fromCity} → ${order.toCity}</b>
          ${cargo}${weight}
          <div style="margin-top:8px">
            <span style="background:${color};color:#fff;border-radius:4px;padding:2px 8px;font-size:11px">
              ${order.status === 'published' ? 'Открытый' : 'В переговорах'}
            </span>
          </div>
        </div>
      `, { maxWidth: 200 })
  }
}

async function nearMe() {
  if (!navigator.geolocation) { alert('Геолокация не поддерживается'); return }
  if (!leafletMap) await initMap()
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    pos => {
      locating.value = false
      const { latitude: lat, longitude: lng } = pos.coords
      if (userMarker) userMarker.remove()
      userMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<div style="width:18px;height:18px;background:#1a5bc4;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(26,91,196,.5)"></div>`,
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      }).addTo(leafletMap).bindPopup('<b>📍 Вы здесь</b>').openPopup()
      leafletMap.setView([lat, lng], 7)
    },
    () => { locating.value = false; alert('Не удалось получить геолокацию') },
  )
}

watch(viewMode, async val => {
  if (val === 'map') { await nextTick(); await initMap() }
})

watch(orders, () => { if (viewMode.value === 'map') updateMarkers() })

watch(pickMode, val => {
  if (mapEl.value) mapEl.value.style.cursor = val ? 'crosshair' : ''
})

onMounted(load)
onUnmounted(() => { if (leafletMap) { leafletMap.remove(); leafletMap = null } })
</script>

<template>
  <div class="results-layout">

    <!-- Header -->
    <header class="header">
      <button class="icon-btn" @click="router.back()">
        <ArrowLeft :size="22" />
      </button>
      <div class="header-info">
        <h1 class="header-title">{{ routeLabel }}</h1>
        <span v-if="!loading" class="header-sub">{{ total }} грузов</span>
      </div>
      <!-- Переключатель список/карта -->
      <div class="view-toggle">
        <button :class="['toggle-btn', { active: viewMode === 'list' }]" @click="viewMode = 'list'">
          <List :size="17" />
        </button>
        <button :class="['toggle-btn', { active: viewMode === 'map' }]" @click="viewMode = 'map'">
          <Map :size="17" />
        </button>
      </div>
      <button class="icon-btn" @click="router.back()">
        <SlidersHorizontal :size="20" />
      </button>
    </header>

    <!-- Фильтры strip -->
    <div v-if="activeFilters.length > 0" class="filter-strip">
      <span v-for="f in activeFilters" :key="f" class="filter-chip">{{ f }}</span>
      <button class="filter-edit" @click="router.back()">изменить</button>
    </div>

    <!-- ── MAP VIEW ── -->
    <div v-show="viewMode === 'map'" class="map-section">
      <!-- Тулбар карты -->
      <div class="map-toolbar">
        <div class="toolbar-picks">
          <button
            :class="['btn-pick', { active: pickMode === 'from' }]"
            :disabled="geocoding"
            @click="pickMode = pickMode === 'from' ? null : 'from'"
          >
            🔵 {{ pickMode === 'from' ? (geocoding ? '...' : 'Кликни') : 'Откуда' }}
          </button>
          <button
            :class="['btn-pick', { active: pickMode === 'to' }]"
            :disabled="geocoding"
            @click="pickMode = pickMode === 'to' ? null : 'to'"
          >
            🔴 {{ pickMode === 'to' ? (geocoding ? '...' : 'Кликни') : 'Куда' }}
          </button>
        </div>
        <button class="btn-near-me" :disabled="locating" @click="nearMe">
          {{ locating ? '⏳' : '📍' }} Рядом
        </button>
      </div>

      <!-- Легенда -->
      <div class="map-legend">
        <span class="legend-dot green" /> Открытый
        <span class="legend-dot orange" /> В переговорах
        <span v-if="loading" class="legend-loading">Загрузка...</span>
      </div>

      <div ref="mapEl" class="map-container" />
    </div>

    <!-- ── LIST VIEW ── -->
    <template v-if="viewMode === 'list'">
      <div v-if="loading" class="state-center">
        <div class="spinner" />
        <p>Ищем грузы...</p>
      </div>

      <div v-else-if="error" class="state-center">
        <p class="error-text">{{ error }}</p>
        <button class="btn-action" @click="load">Повторить</button>
      </div>

      <div v-else-if="orders.length === 0" class="state-center">
        <Package :size="48" class="empty-icon" />
        <p class="empty-title">Грузов не найдено</p>
        <p class="empty-sub">Попробуйте изменить параметры</p>
        <button class="btn-action" @click="router.back()">Изменить поиск</button>
      </div>

      <div v-else class="results-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="route-row">
            <div class="route-point">
              <span class="dot dot-from" />
              <span class="city">{{ order.fromCity }}</span>
              <span class="country">{{ order.fromCountry }}</span>
            </div>
            <div class="route-line" />
            <div class="route-point">
              <span class="dot dot-to" />
              <span class="city">{{ order.toCity }}</span>
              <span class="country">{{ order.toCountry }}</span>
            </div>
          </div>

          <div class="cargo-row">
            <span v-if="order.cargoType" class="cargo-tag">{{ order.cargoType }}</span>
            <span v-if="order.weightKg"  class="cargo-tag">⚖ {{ formatWeight(order.weightKg) }}</span>
            <span v-if="order.volumeM3"  class="cargo-tag">{{ order.volumeM3 }} м³</span>
            <span v-if="order.packaging" class="cargo-tag">{{ order.packaging }}</span>
          </div>

          <div class="date-row">
            <MapPin :size="13" class="date-icon" />
            <span class="date-text">Погрузка: {{ formatDate(order.readyDate) }}</span>
            <span class="status-badge" :class="order.status">
              {{ order.status === 'published' ? 'Открытый' : 'В переговорах' }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.results-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f2f4f7;
}

/* Header */
.header {
  background: white;
  display: flex;
  align-items: center;
  padding: 10px 12px;
  padding-top: calc(10px + var(--safe-area-top));
  border-bottom: 1px solid #e0e0e0;
  gap: 8px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.icon-btn {
  background: none; border: none; color: #555;
  padding: 6px; cursor: pointer; display: flex; align-items: center;
  flex-shrink: 0;
}

.header-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.header-title { font-size: 0.95rem; font-weight: 700; color: #222; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.header-sub { font-size: 0.72rem; color: #999; }

.view-toggle { display: flex; background: #f0f0f0; border-radius: 8px; padding: 2px; gap: 2px; flex-shrink: 0; }
.toggle-btn {
  background: none; border: none; padding: 5px 9px; border-radius: 6px;
  color: #999; cursor: pointer; display: flex; align-items: center;
  transition: all 0.2s;
}
.toggle-btn.active { background: #fff; color: #1a5bc4; box-shadow: 0 1px 3px rgba(0,0,0,.1); }

/* Filter strip */
.filter-strip {
  background: white; border-bottom: 1px solid #eee;
  padding: 8px 16px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
}
.filter-chip { background: #e8f0fe; color: #1a5bc4; font-size: 0.72rem; font-weight: 600; padding: 3px 10px; border-radius: 12px; }
.filter-edit { background: none; border: none; color: #1a5bc4; font-size: 0.72rem; font-weight: 600; text-decoration: underline; cursor: pointer; padding: 0; margin-left: auto; }

/* Map */
.map-section { display: flex; flex-direction: column; }

.map-toolbar {
  background: white; border-bottom: 1px solid #eee;
  padding: 10px 14px; display: flex; align-items: center;
  justify-content: space-between; gap: 8px;
}

.toolbar-picks { display: flex; gap: 6px; }

.btn-pick {
  background: #f0f4ff; border: 1px solid #d0daf5; border-radius: 8px;
  padding: 6px 12px; font-size: 0.78rem; font-weight: 600; color: #1a5bc4;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.btn-pick.active {
  background: #1a5bc4; color: #fff; border-color: #1a5bc4;
  animation: pulse 1.2s infinite;
}
.btn-pick:disabled { opacity: 0.6; cursor: not-allowed; }

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(26,91,196,0.4); }
  50%       { box-shadow: 0 0 0 5px rgba(26,91,196,0); }
}

.btn-near-me {
  background: #1a5bc4; color: #fff; border: none; border-radius: 8px;
  padding: 6px 12px; font-size: 0.78rem; font-weight: 600;
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
}
.btn-near-me:disabled { background: #aaa; cursor: not-allowed; }

.map-legend {
  background: white; border-bottom: 1px solid #f0f0f0;
  padding: 6px 14px; display: flex; align-items: center; gap: 14px;
  font-size: 0.72rem; color: #666;
}
.legend-dot {
  display: inline-block; width: 10px; height: 10px;
  border-radius: 50%; border: 2px solid #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,.2); margin-right: 3px;
}
.legend-dot.green  { background: #18a058; }
.legend-dot.orange { background: #f0a020; }
.legend-loading { margin-left: auto; color: #1a5bc4; }

.map-container {
  width: 100%;
  height: calc(100vh - 160px);
  min-height: 400px;
}

/* List */
.state-center {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 24px; gap: 12px; text-align: center;
}
.spinner { width: 34px; height: 34px; border: 3px solid #e0e0e0; border-top-color: #1a5bc4; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon { color: #ccc; }
.empty-title { font-size: 1rem; font-weight: 600; color: #444; }
.empty-sub { font-size: 0.85rem; color: #999; }
.error-text { color: #e53935; font-size: 0.9rem; }

.btn-action { background: #1a5bc4; color: white; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 600; cursor: pointer; }

.results-list { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

.order-card { background: white; border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); display: flex; flex-direction: column; gap: 8px; }

.route-row { display: flex; align-items: center; gap: 6px; }
.route-point { display: flex; align-items: center; gap: 5px; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-from { background: #1a5bc4; }
.dot-to   { background: #d0021b; }
.city { font-size: 0.95rem; font-weight: 700; color: #222; }
.country { font-size: 0.7rem; color: #999; text-transform: uppercase; }
.route-line { flex: 1; height: 1px; background: #e0e0e0; min-width: 12px; }

.cargo-row { display: flex; gap: 6px; flex-wrap: wrap; }
.cargo-tag { font-size: 0.78rem; font-weight: 500; color: #555; background: #f0f4fa; padding: 3px 8px; border-radius: 4px; }

.date-row { display: flex; align-items: center; gap: 4px; }
.date-icon { color: #aaa; }
.date-text { font-size: 0.78rem; color: #888; flex: 1; }

.status-badge { font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
.status-badge.published   { background: #e8f5e9; color: #2e7d32; }
.status-badge.negotiating { background: #fff3e0; color: #ef6c00; }
</style>
