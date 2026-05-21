<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, Navigation, ArrowUpDown, List, Map, X, Check, ChevronRight } from 'lucide-vue-next'

const router = useRouter()

const activeTab = ref<'search' | 'filters' | 'history' | 'trucks'>('search')
const viewMode  = ref<'form' | 'map'>('form')

const fromCountry = ref('')
const fromCity    = ref('')
const toCountry   = ref('')
const toCity      = ref('')
const readyFrom   = ref('')

const cargoType = ref('')
const weightMin = ref('')
const weightMax = ref('')
const volumeMin = ref('')
const volumeMax = ref('')
const packaging = ref('')

const showCountryPicker = ref(false)
const pickingCountryFor = ref<'from' | 'to' | null>(null)

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

const PACKAGING = [
  { value: 'bulk',      label: 'Навалом'   },
  { value: 'boxes',     label: 'Коробки'   },
  { value: 'pallets',   label: 'Паллеты'   },
  { value: 'container', label: 'Контейнер' },
  { value: 'other',     label: 'Другое'    },
]

function countryLabel(code: string) {
  const c = COUNTRIES.find(c => c.code === code)
  return c ? `${c.flag} ${c.name}` : ''
}

function openCountryPicker(type: 'from' | 'to') {
  pickingCountryFor.value = type
  showCountryPicker.value = true
}

function selectCountry(code: string) {
  if (pickingCountryFor.value === 'from') {
    fromCountry.value = code
  } else {
    toCountry.value = code
  }
  showCountryPicker.value = false
}

// ── Nominatim city autocomplete ───────────────────────────────────────────────
const fromCitySuggestions = ref<string[]>([])
const toCitySuggestions   = ref<string[]>([])
const fromCityLoading = ref(false)
const toCityLoading   = ref(false)
let fromCityTimer: ReturnType<typeof setTimeout> | null = null
let toCityTimer:   ReturnType<typeof setTimeout> | null = null

async function fetchCities(query: string, countryCode: string): Promise<string[]> {
  if (!query || query.trim().length < 2) return []
  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    limit: '7',
    'accept-language': 'ru',
    featuretype: 'city',
  })
  if (countryCode) params.set('countrycodes', countryCode.toLowerCase())
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'TMGO-logistics/1.0' },
    })
    const items: any[] = await res.json()
    return [...new Set(items.map((r: any) => r.display_name.split(',')[0].trim()))]
  } catch {
    return []
  }
}

function onFromCityInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  fromCity.value = val
  if (fromCityTimer) clearTimeout(fromCityTimer)
  fromCityTimer = setTimeout(async () => {
    fromCityLoading.value = true
    fromCitySuggestions.value = await fetchCities(val, fromCountry.value)
    fromCityLoading.value = false
  }, 350)
}

function onToCityInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  toCity.value = val
  if (toCityTimer) clearTimeout(toCityTimer)
  toCityTimer = setTimeout(async () => {
    toCityLoading.value = true
    toCitySuggestions.value = await fetchCities(val, toCountry.value)
    toCityLoading.value = false
  }, 350)
}

function selectFromCity(city: string) {
  fromCity.value = city
  fromCitySuggestions.value = []
}

function selectToCity(city: string) {
  toCity.value = city
  toCitySuggestions.value = []
}

// Сбрасываем город при смене страны
watch(fromCountry, () => { fromCity.value = ''; fromCitySuggestions.value = [] })
watch(toCountry,   () => { toCity.value   = ''; toCitySuggestions.value   = [] })

function clearFromSugg() { setTimeout(() => fromCitySuggestions.value = [], 200) }
function clearToSugg()   { setTimeout(() => toCitySuggestions.value   = [], 200) }

// ─────────────────────────────────────────────────────────────────────────────
function swapCities() {
  const tc = fromCountry.value; const tx = fromCity.value
  fromCountry.value = toCountry.value; fromCity.value = toCity.value
  toCountry.value = tc; toCity.value = tx
}

function clear() {
  fromCountry.value = ''; fromCity.value = ''
  toCountry.value   = ''; toCity.value   = ''
  readyFrom.value = ''; cargoType.value = ''
  weightMin.value = ''; weightMax.value = ''
  volumeMin.value = ''; volumeMax.value = ''
  packaging.value = ''
  fromCitySuggestions.value = []
  toCitySuggestions.value   = []
}

function hasFilters() {
  return cargoType.value || weightMin.value || weightMax.value ||
    volumeMin.value || volumeMax.value || packaging.value
}

function search() {
  const q: Record<string, string> = {}
  if (fromCity.value)    q.fromCity    = fromCity.value
  if (fromCountry.value) q.fromCountry = fromCountry.value
  if (toCity.value)      q.toCity      = toCity.value
  if (toCountry.value)   q.toCountry   = toCountry.value
  if (readyFrom.value)   q.readyFrom   = readyFrom.value
  if (cargoType.value)   q.cargoType   = cargoType.value
  if (weightMin.value)   q.weightMin   = weightMin.value
  if (weightMax.value)   q.weightMax   = weightMax.value
  if (volumeMin.value)   q.volumeMin   = volumeMin.value
  if (volumeMax.value)   q.volumeMax   = volumeMax.value
  if (packaging.value)   q.packaging   = packaging.value
  router.push({ name: 'search-results', query: q })
}

// ── Leaflet map ───────────────────────────────────────────────────────────────
const mapEl     = ref<HTMLDivElement | null>(null)
const pickMode  = ref<null | 'from' | 'to'>(null)
const locating  = ref(false)
const geocoding = ref(false)
let leafletMap: any = null
let userMarker: any = null
let pickMarker: any = null
let L:          any = null

async function initMap() {
  if (!mapEl.value || leafletMap) return
  L = (await import('leaflet') as any).default
  await import('leaflet/dist/leaflet.css' as any)
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
  leafletMap = L.map(mapEl.value, { center: [40, 62], zoom: 4 })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(leafletMap)

  leafletMap.on('click', async (e: any) => {
    if (!pickMode.value) return
    const { lat, lng } = e.latlng
    geocoding.value = true
    if (pickMarker) pickMarker.remove()
    const color = pickMode.value === 'from' ? '#ff6b4a' : '#d0021b'
    pickMarker = L.circleMarker([lat, lng], {
      radius: 8, color, fillColor: color, fillOpacity: 0.9, weight: 2,
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
      if (pickMode.value === 'from') {
        fromCity.value    = city
        fromCountry.value = code
        pickMode.value    = 'to'
      } else {
        toCity.value    = city
        toCountry.value = code
        pickMode.value  = null
      }
    } finally {
      geocoding.value = false
    }
  })
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
          html: `<div style="width:18px;height:18px;background:#ff6b4a;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(255,107,74,.5)"></div>`,
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

watch(pickMode, val => {
  if (mapEl.value) mapEl.value.style.cursor = val ? 'crosshair' : ''
})

onUnmounted(() => { if (leafletMap) { leafletMap.remove(); leafletMap = null } })
</script>

<template>
  <div class="search-layout">
    <!-- Header -->
    <header class="header">
      <button class="back-btn" @click="router.back()">←</button>
      <h1 class="header-title">Поиск грузов</h1>
      <div class="view-toggle">
        <button :class="['toggle-btn', { active: viewMode === 'form' }]" @click="viewMode = 'form'">
          <List :size="17" />
        </button>
        <button :class="['toggle-btn', { active: viewMode === 'map' }]" @click="viewMode = 'map'">
          <Map :size="17" />
        </button>
      </div>
    </header>

    <!-- ── MAP VIEW ── -->
    <template v-if="viewMode === 'map'">
      <div class="map-toolbar">
        <div class="toolbar-picks">
          <button
            :class="['btn-pick', { active: pickMode === 'from' }]"
            :disabled="geocoding"
            @click="pickMode = pickMode === 'from' ? null : 'from'"
          >
            🔵 {{ pickMode === 'from' ? (geocoding ? '...' : 'Кликни на карте') : (fromCity || 'Откуда') }}
          </button>
          <button
            :class="['btn-pick btn-pick-to', { active: pickMode === 'to' }]"
            :disabled="geocoding"
            @click="pickMode = pickMode === 'to' ? null : 'to'"
          >
            🔴 {{ pickMode === 'to' ? (geocoding ? '...' : 'Кликни на карте') : (toCity || 'Куда') }}
          </button>
        </div>
        <button class="btn-near-me" :disabled="locating" @click="nearMe">
          {{ locating ? '⏳' : '📍' }}
        </button>
      </div>
      <div ref="mapEl" class="map-container" />
    </template>

    <!-- ── FORM VIEW ── -->
    <template v-else>

    <!-- Tabs -->
    <nav class="tabs">
      <button
        v-for="tab in [
          { key: 'search',  label: 'МАРШРУТ'  },
          { key: 'filters', label: hasFilters() ? 'ФИЛЬТРЫ ●' : 'ФИЛЬТРЫ' },
          { key: 'history', label: 'ИСТОРИЯ'  },
          { key: 'trucks',  label: 'ПО МАШИНАМ' },
        ]"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key as typeof activeTab"
      >{{ tab.label }}</button>
    </nav>

    <!-- ── МАРШРУТ ── -->
    <div v-if="activeTab === 'search'" class="form-body">

      <div class="section-label">Откуда</div>

      <div class="field-row clickable" @click="openCountryPicker('from')">
        <div class="field-icon"><Navigation :size="16" class="icon-primary" /></div>
        <div class="field-content">
          <span class="field-label">Страна</span>
          <div class="value-display">
            {{ fromCountry ? countryLabel(fromCountry) : 'Любая страна' }}
            <ChevronRight :size="16" class="chevron" />
          </div>
        </div>
      </div>

      <div class="separator" />

      <!-- From city с автодополнением -->
      <div class="field-row">
        <div class="field-icon" />
        <div class="field-content suggest-wrap">
          <span class="field-label">
            Город
            <span v-if="fromCityLoading" class="loading-dot">...</span>
          </span>
          <div class="input-with-clear">
            <input
              :value="fromCity"
              class="field-input"
              placeholder="Начните вводить..."
              autocomplete="off"
              @input="onFromCityInput"
              @blur="clearFromSugg"
            />
            <button v-if="fromCity" class="clear-input" @click="fromCity = ''; fromCitySuggestions = []">×</button>
          </div>
          <div v-if="fromCitySuggestions.length" class="suggestions">
            <button
              v-for="s in fromCitySuggestions"
              :key="s"
              class="suggestion-item"
              @mousedown.prevent="selectFromCity(s)"
            >{{ s }}</button>
          </div>
        </div>
      </div>

      <div class="separator" />

      <!-- Swap -->
      <div class="swap-row">
        <button class="swap-btn" @click="swapCities">
          <ArrowUpDown :size="18" />
          <span class="swap-label">поменять</span>
        </button>
      </div>

      <div class="separator" />

      <div class="section-label">Куда</div>

      <div class="field-row clickable" @click="openCountryPicker('to')">
        <div class="field-icon"><MapPin :size="16" class="icon-accent" /></div>
        <div class="field-content">
          <span class="field-label">Страна</span>
          <div class="value-display">
            {{ toCountry ? countryLabel(toCountry) : 'Любая страна' }}
            <ChevronRight :size="16" class="chevron" />
          </div>
        </div>
      </div>

      <div class="separator" />

      <!-- To city с автодополнением -->
      <div class="field-row">
        <div class="field-icon" />
        <div class="field-content suggest-wrap">
          <span class="field-label">
            Город
            <span v-if="toCityLoading" class="loading-dot">...</span>
          </span>
          <div class="input-with-clear">
            <input
              :value="toCity"
              class="field-input"
              placeholder="Начните вводить..."
              autocomplete="off"
              @input="onToCityInput"
              @blur="clearToSugg"
            />
            <button v-if="toCity" class="clear-input" @click="toCity = ''; toCitySuggestions = []">×</button>
          </div>
          <div v-if="toCitySuggestions.length" class="suggestions">
            <button
              v-for="s in toCitySuggestions"
              :key="s"
              class="suggestion-item"
              @mousedown.prevent="selectToCity(s)"
            >{{ s }}</button>
          </div>
        </div>
      </div>

      <div class="separator" />

      <!-- Date -->
      <div class="field-row">
        <div class="field-icon">📅</div>
        <div class="field-content">
          <span class="field-label">Погрузка с</span>
          <input v-model="readyFrom" type="date" class="field-input date-input" />
        </div>
      </div>

      <div v-if="hasFilters()" class="filters-badge" @click="activeTab = 'filters'">
        Активны доп. фильтры — изменить →
      </div>
    </div>

    <!-- ── ФИЛЬТРЫ ── -->
    <div v-else-if="activeTab === 'filters'" class="form-body">

      <div class="section-label">Тип груза</div>
      <div class="field-row">
        <div class="field-icon">📦</div>
        <div class="field-content">
          <span class="field-label">Наименование</span>
          <input v-model="cargoType" class="field-input" placeholder="Любой" />
        </div>
      </div>

      <div class="separator" />

      <div class="section-label">Вес, кг</div>
      <div class="field-row two-col">
        <div class="half-field">
          <span class="field-label">От</span>
          <input v-model="weightMin" type="number" class="field-value-input" placeholder="0" min="0" />
        </div>
        <div class="half-divider" />
        <div class="half-field">
          <span class="field-label">До</span>
          <input v-model="weightMax" type="number" class="field-value-input" placeholder="∞" min="0" />
        </div>
      </div>

      <div class="separator" />

      <div class="section-label">Объём, м³</div>
      <div class="field-row two-col">
        <div class="half-field">
          <span class="field-label">От</span>
          <input v-model="volumeMin" type="number" class="field-value-input" placeholder="0" min="0" />
        </div>
        <div class="half-divider" />
        <div class="half-field">
          <span class="field-label">До</span>
          <input v-model="volumeMax" type="number" class="field-value-input" placeholder="∞" min="0" />
        </div>
      </div>

      <div class="separator" />

      <div class="section-label">Упаковка</div>
      <div class="field-row">
        <div class="field-icon">🗃️</div>
        <div class="field-content">
          <span class="field-label">Тип упаковки</span>
          <div class="select-wrap">
            <select v-model="packaging" class="native-select">
              <option value="">Любая</option>
              <option v-for="p in PACKAGING" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="bottom-actions">
        <button class="btn-clear" @click="clear">ОЧИСТИТЬ ВСЁ</button>
        <button class="btn-apply" @click="activeTab = 'search'">ПРИМЕНИТЬ</button>
      </div>
    </div>

    <!-- ── ИСТОРИЯ ── -->
    <div v-else-if="activeTab === 'history'" class="form-body empty-tab">
      <div class="empty-icon">🕐</div>
      <p class="empty-text">История поиска появится здесь</p>
    </div>

    <!-- ── ПО МАШИНАМ ── -->
    <div v-else class="form-body empty-tab">
      <div class="empty-icon">🚛</div>
      <p class="empty-text">Поиск по типу машины скоро</p>
    </div>

    </template><!-- end form view -->

    <!-- Кнопка поиска -->
    <div class="search-btn-wrap">
      <div v-if="fromCountry || toCountry || fromCity || toCity" class="route-summary">
        <span>{{ fromCountry ? countryLabel(fromCountry) : '—' }} {{ fromCity }}</span>
        <span class="route-arrow">→</span>
        <span>{{ toCountry ? countryLabel(toCountry) : '—' }} {{ toCity }}</span>
      </div>
      <button class="btn-search" @click="search">НАЙТИ ГРУЗЫ</button>
    </div>

    <!-- ── COUNTRY PICKER MODAL ── -->
    <Transition name="slide-up">
      <div v-if="showCountryPicker" class="modal-overlay" @click.self="showCountryPicker = false">
        <div class="bottom-sheet">
          <div class="sheet-header">
            <div class="handle" />
            <div class="header-main">
              <h3>Выберите страну</h3>
              <button class="close-sheet" @click="showCountryPicker = false">
                <X :size="20" />
              </button>
            </div>
          </div>
          <div class="sheet-content">
            <button class="country-item" :class="{ selected: !fromCountry && pickingCountryFor === 'from' || !toCountry && pickingCountryFor === 'to' }" @click="selectCountry('')">
              <div class="country-info">
                <span class="flag">🌍</span>
                <span class="name">Любая страна</span>
              </div>
              <Check v-if="!fromCountry && pickingCountryFor === 'from' || !toCountry && pickingCountryFor === 'to'" :size="18" class="check-icon" />
            </button>
            <button 
              v-for="c in COUNTRIES" 
              :key="c.code" 
              class="country-item"
              :class="{ selected: (pickingCountryFor === 'from' ? fromCountry : toCountry) === c.code }"
              @click="selectCountry(c.code)"
            >
              <div class="country-info">
                <span class="flag">{{ c.flag }}</span>
                <span class="name">{{ c.name }}</span>
              </div>
              <Check v-if="(pickingCountryFor === 'from' ? fromCountry : toCountry) === c.code" :size="18" class="check-icon" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.search-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f2f4f7;
  padding-bottom: 180px;
}

.header {
  background: white;
  display: flex;
  align-items: center;
  padding: 14px 16px;
  padding-top: calc(14px + var(--safe-area-top));
  border-bottom: 1px solid #e0e0e0;
  gap: 12px;
}
.back-btn { background: none; border: none; font-size: 1.3rem; color: #555; padding: 4px 8px 4px 0; cursor: pointer; flex-shrink: 0; }
.header-title { font-size: 1rem; font-weight: 600; color: #222; flex: 1; min-width: 0; }

.tabs { background: white; display: flex; border-bottom: 2px solid #e0e0e0; overflow-x: auto; scrollbar-width: none; }
.tabs::-webkit-scrollbar { display: none; }
.tab-btn { flex-shrink: 0; background: none; border: none; padding: 12px 16px; font-size: 0.72rem; font-weight: 700; color: #999; letter-spacing: 0.5px; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; white-space: nowrap; }
.tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }

.form-body { background: white; margin: 12px; border-radius: 8px; overflow: visible; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

.section-label { padding: 10px 16px 4px; font-size: 0.7rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; background: var(--primary-light); }

.field-row { display: flex; align-items: flex-start; padding: 10px 14px; gap: 10px; min-height: 52px; }
.field-row.two-col { padding: 10px 0; gap: 0; }
.field-row.clickable:active { background: #f8f9fa; }

.field-icon { width: 24px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 1rem; padding-top: 16px; }
.field-content { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.field-label { font-size: 0.68rem; color: #999; font-weight: 400; display: flex; align-items: center; gap: 4px; }

.value-display {
  font-size: 0.95rem;
  font-weight: 500;
  color: #222;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}
.chevron { color: #ccc; }

.field-input { border: none; outline: none; font-size: 0.95rem; font-weight: 500; color: #222; background: transparent; width: 100%; min-width: 0; padding: 2px 0; }
.field-input::placeholder { color: #bbb; font-weight: 400; }
.date-input { color: #222; font-weight: 500; }

.input-with-clear { display: flex; align-items: center; gap: 4px; }
.input-with-clear .field-input { flex: 1; }
.clear-input { background: none; border: none; color: #aaa; font-size: 1.1rem; padding: 0 2px; cursor: pointer; line-height: 1; flex-shrink: 0; }

/* Suggestions dropdown */
.suggest-wrap { position: relative; }
.suggestions {
  position: absolute;
  top: 100%;
  left: -14px;
  right: -14px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  z-index: 100;
  overflow: hidden;
}
.suggestion-item {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid #f0f0f0;
  padding: 11px 16px;
  font-size: 0.9rem;
  color: #222;
  cursor: pointer;
}
.suggestion-item:last-child { border-bottom: none; }
.suggestion-item:active { background: #f0f4ff; }

.select-wrap { width: 100%; }
.native-select { border: none; outline: none; font-size: 0.95rem; font-weight: 500; color: #222; background: transparent; width: 100%; padding: 2px 0; -webkit-appearance: none; appearance: none; cursor: pointer; }

.half-field { flex: 1; padding: 4px 16px; display: flex; flex-direction: column; gap: 2px; }
.half-divider { width: 1px; background: #eee; align-self: stretch; }
.field-value-input { border: none; outline: none; font-size: 0.95rem; font-weight: 500; color: #222; background: transparent; width: 100%; padding: 4px 0; }
.field-value-input::placeholder { color: #bbb; font-weight: 400; }

.separator { height: 1px; background: #eee; margin: 0 14px; }

.swap-row { display: flex; justify-content: center; padding: 6px 0; }
.swap-btn { background: var(--primary-light); border: 1px solid var(--border-color); border-radius: 20px; padding: 6px 16px; display: flex; align-items: center; gap: 6px; color: var(--primary); cursor: pointer; }
.swap-label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.3px; }

.filters-badge { margin: 8px 14px; background: #fff3e0; border: 1px solid #ffcc80; border-radius: 6px; padding: 8px 12px; font-size: 0.82rem; color: #e65100; font-weight: 600; cursor: pointer; }

.bottom-actions { display: flex; justify-content: space-between; padding: 16px; border-top: 1px solid #eee; margin-top: 4px; }
.btn-clear { background: none; border: 1px solid #e53935; border-radius: 6px; color: #e53935; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.5px; padding: 8px 16px; cursor: pointer; }
.btn-apply { background: var(--primary); border: none; border-radius: 6px; color: white; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.5px; padding: 8px 20px; cursor: pointer; }

.empty-tab { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; gap: 12px; }
.empty-icon { font-size: 2.5rem; }
.empty-text { color: #999; font-size: 0.9rem; text-align: center; }

.search-btn-wrap { position: fixed; bottom: calc(var(--tabbar-height) + var(--safe-area-bottom)); left: 0; right: 0; padding: 10px 16px; padding-bottom: 10px; background: white; border-top: 1px solid #eee; z-index: 100; }
.route-summary { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: #666; margin-bottom: 6px; overflow: hidden; white-space: nowrap; }
.route-summary span { overflow: hidden; text-overflow: ellipsis; flex: 1; }
.route-arrow { flex-shrink: 0; color: var(--primary); }
.btn-search { width: 100%; background: var(--primary); color: white; border: none; border-radius: 6px; padding: 14px; font-size: 0.95rem; font-weight: 700; letter-spacing: 1px; cursor: pointer; }
.btn-search:active { background: var(--primary-dark); }

.icon-primary { color: var(--primary); }
.icon-accent  { color: #d0021b; }

/* Modal / Bottom Sheet */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.bottom-sheet {
  width: 100%;
  background: white;
  border-radius: 20px 20px 0 0;
  padding-bottom: var(--safe-area-bottom);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.sheet-header {
  padding: 12px 16px 16px;
  border-bottom: 1px solid #eee;
}

.handle {
  width: 40px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  margin: 0 auto 12px;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-main h3 { font-size: 1.1rem; font-weight: 700; margin: 0; }
.close-sheet { background: #f0f0f0; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

.sheet-content {
  overflow-y: auto;
  padding: 8px 0;
}

.country-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: none;
  border: none;
  border-bottom: 1px solid #f9f9f9;
}
.country-item:active { background: #f0f4ff; }
.country-item.selected { background: #f0f4ff; }

.country-info { display: flex; align-items: center; gap: 12px; }
.country-info .flag { font-size: 1.4rem; }
.country-info .name { font-size: 0.95rem; font-weight: 500; color: #222; }

.check-icon { color: var(--primary); }

/* Animations */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>
