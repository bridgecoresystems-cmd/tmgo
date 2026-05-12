<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, Navigation, ArrowUpDown } from 'lucide-vue-next'

const router = useRouter()

const activeTab = ref<'search' | 'filters' | 'history' | 'trucks'>('search')

const fromCountry = ref('')
const fromCity = ref('')
const toCountry = ref('')
const toCity = ref('')
const readyFrom = ref('')

const cargoType = ref('')
const weightMin = ref('')
const weightMax = ref('')
const volumeMin = ref('')
const volumeMax = ref('')
const packaging = ref('')

const COUNTRIES = [
  { code: 'TM', name: 'Туркменистан', flag: '🇹🇲' },
  { code: 'UZ', name: 'Узбекистан', flag: '🇺🇿' },
  { code: 'KZ', name: 'Казахстан', flag: '🇰🇿' },
  { code: 'KG', name: 'Кыргызстан', flag: '🇰🇬' },
  { code: 'TJ', name: 'Таджикистан', flag: '🇹🇯' },
  { code: 'IR', name: 'Иран', flag: '🇮🇷' },
  { code: 'TR', name: 'Турция', flag: '🇹🇷' },
  { code: 'AE', name: 'ОАЭ', flag: '🇦🇪' },
  { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  { code: 'BY', name: 'Беларусь', flag: '🇧🇾' },
]

const PACKAGING = [
  { value: 'bulk', label: 'Навалом' },
  { value: 'boxes', label: 'Коробки' },
  { value: 'pallets', label: 'Паллеты' },
  { value: 'container', label: 'Контейнер' },
  { value: 'other', label: 'Другое' },
]

function countryLabel(code: string) {
  const c = COUNTRIES.find(c => c.code === code)
  return c ? `${c.flag} ${c.name}` : ''
}

function swapCities() {
  const tc = fromCountry.value; const tx = fromCity.value
  fromCountry.value = toCountry.value; fromCity.value = toCity.value
  toCountry.value = tc; toCity.value = tx
}

function clear() {
  fromCountry.value = ''; fromCity.value = ''
  toCountry.value = ''; toCity.value = ''
  readyFrom.value = ''; cargoType.value = ''
  weightMin.value = ''; weightMax.value = ''
  volumeMin.value = ''; volumeMax.value = ''
  packaging.value = ''
}

function hasFilters() {
  return cargoType.value || weightMin.value || weightMax.value ||
    volumeMin.value || volumeMax.value || packaging.value
}

function search() {
  const q: Record<string, string> = {}
  if (fromCity.value) q.fromCity = fromCity.value
  if (fromCountry.value) q.fromCountry = fromCountry.value
  if (toCity.value) q.toCity = toCity.value
  if (toCountry.value) q.toCountry = toCountry.value
  if (readyFrom.value) q.readyFrom = readyFrom.value
  if (cargoType.value) q.cargoType = cargoType.value
  if (weightMin.value) q.weightMin = weightMin.value
  if (weightMax.value) q.weightMax = weightMax.value
  if (volumeMin.value) q.volumeMin = volumeMin.value
  if (volumeMax.value) q.volumeMax = volumeMax.value
  if (packaging.value) q.packaging = packaging.value
  router.push({ name: 'search-results', query: q })
}
</script>

<template>
  <div class="search-layout">
    <!-- Header -->
    <header class="header">
      <button class="back-btn" @click="router.back()">←</button>
      <h1 class="header-title">Поиск грузов</h1>
    </header>

    <!-- Tabs -->
    <nav class="tabs">
      <button
        v-for="tab in [
          { key: 'search', label: 'МАРШРУТ' },
          { key: 'filters', label: hasFilters() ? 'ФИЛЬТРЫ ●' : 'ФИЛЬТРЫ' },
          { key: 'history', label: 'ИСТОРИЯ' },
          { key: 'trucks', label: 'ПО МАШИНАМ' },
        ]"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key as typeof activeTab"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- МАРШРУТ tab -->
    <div v-if="activeTab === 'search'" class="form-body">

      <!-- FROM -->
      <div class="section-label">Откуда</div>

      <div class="field-row">
        <div class="field-icon"><Navigation :size="16" class="icon-primary" /></div>
        <div class="field-content">
          <span class="field-label">Страна</span>
          <div class="select-wrap">
            <select v-model="fromCountry" class="native-select">
              <option value="">Любая страна</option>
              <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">
                {{ c.flag }} {{ c.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="separator" />

      <div class="field-row">
        <div class="field-icon" />
        <div class="field-content">
          <span class="field-label">Город</span>
          <div class="input-with-clear">
            <input v-model="fromCity" class="field-input" placeholder="Ваше местоположение" />
            <button v-if="fromCity" class="clear-input" @click="fromCity = ''">×</button>
          </div>
        </div>
      </div>

      <div class="separator" />

      <!-- Swap button -->
      <div class="swap-row">
        <button class="swap-btn" @click="swapCities">
          <ArrowUpDown :size="18" />
          <span class="swap-label">поменять</span>
        </button>
      </div>

      <div class="separator" />

      <!-- TO -->
      <div class="section-label">Куда</div>

      <div class="field-row">
        <div class="field-icon"><MapPin :size="16" class="icon-accent" /></div>
        <div class="field-content">
          <span class="field-label">Страна</span>
          <div class="select-wrap">
            <select v-model="toCountry" class="native-select">
              <option value="">Любая страна</option>
              <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">
                {{ c.flag }} {{ c.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="separator" />

      <div class="field-row">
        <div class="field-icon" />
        <div class="field-content">
          <span class="field-label">Город</span>
          <div class="input-with-clear">
            <input v-model="toCity" class="field-input" placeholder="Куда угодно" />
            <button v-if="toCity" class="clear-input" @click="toCity = ''">×</button>
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

      <!-- Summary if filters set -->
      <div v-if="hasFilters()" class="filters-badge" @click="activeTab = 'filters'">
        Активны доп. фильтры — изменить →
      </div>

    </div>

    <!-- ФИЛЬТРЫ tab -->
    <div v-else-if="activeTab === 'filters'" class="form-body">

      <div class="section-label">Тип груза</div>
      <div class="field-row">
        <div class="field-icon">📦</div>
        <div class="field-content">
          <span class="field-label">Наименование груза</span>
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

      <!-- Bottom actions -->
      <div class="bottom-actions">
        <button class="btn-clear" @click="clear">ОЧИСТИТЬ ВСЁ</button>
        <button class="btn-apply" @click="activeTab = 'search'">ПРИМЕНИТЬ</button>
      </div>

    </div>

    <!-- ИСТОРИЯ tab -->
    <div v-else-if="activeTab === 'history'" class="form-body empty-tab">
      <div class="empty-icon">🕐</div>
      <p class="empty-text">История поиска появится здесь</p>
    </div>

    <!-- ПО МАШИНАМ tab -->
    <div v-else-if="activeTab === 'trucks'" class="form-body empty-tab">
      <div class="empty-icon">🚛</div>
      <p class="empty-text">Поиск по типу машины скоро</p>
    </div>

    <!-- Search button -->
    <div class="search-btn-wrap">
      <div v-if="fromCountry || toCountry || fromCity || toCity" class="route-summary">
        <span>{{ fromCountry ? countryLabel(fromCountry) : '—' }} {{ fromCity }}</span>
        <span class="route-arrow">→</span>
        <span>{{ toCountry ? countryLabel(toCountry) : '—' }} {{ toCity }}</span>
      </div>
      <button class="btn-search" @click="search">НАЙТИ ГРУЗЫ</button>
    </div>
  </div>
</template>

<style scoped>
.search-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f2f4f7;
  padding-bottom: 100px;
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

.back-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  color: #555;
  padding: 4px 8px 4px 0;
  cursor: pointer;
  line-height: 1;
}

.header-title {
  font-size: 1rem;
  font-weight: 600;
  color: #222;
  flex: 1;
}

.tabs {
  background: white;
  display: flex;
  border-bottom: 2px solid #e0e0e0;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }

.tab-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 12px 16px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #999;
  letter-spacing: 0.5px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s;
  white-space: nowrap;
}
.tab-btn.active {
  color: #1a5bc4;
  border-bottom-color: #1a5bc4;
}

.form-body {
  background: white;
  margin: 12px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.section-label {
  padding: 10px 16px 4px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #1a5bc4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f7f9ff;
}

.field-row {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  gap: 10px;
  min-height: 52px;
}

.field-row.two-col {
  padding: 10px 0;
  gap: 0;
}

.field-icon {
  width: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.field-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.field-label {
  font-size: 0.68rem;
  color: #999;
  font-weight: 400;
}

.field-input {
  border: none;
  outline: none;
  font-size: 0.95rem;
  font-weight: 500;
  color: #222;
  background: transparent;
  width: 100%;
  min-width: 0;
  padding: 0;
}

.field-input::placeholder { color: #bbb; font-weight: 400; }

.date-input {
  color: #222;
  font-weight: 500;
}

.input-with-clear {
  display: flex;
  align-items: center;
  gap: 4px;
}
.input-with-clear .field-input { flex: 1; }

.clear-input {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.1rem;
  padding: 0 2px;
  cursor: pointer;
  line-height: 1;
  flex-shrink: 0;
}

.select-wrap {
  width: 100%;
}

.native-select {
  border: none;
  outline: none;
  font-size: 0.95rem;
  font-weight: 500;
  color: #222;
  background: transparent;
  width: 100%;
  padding: 0;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}
.native-select option { font-weight: 400; }

.half-field {
  flex: 1;
  padding: 4px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.half-divider {
  width: 1px;
  background: #eee;
  align-self: stretch;
}

.field-value-input {
  border: none;
  outline: none;
  font-size: 0.95rem;
  font-weight: 500;
  color: #222;
  background: transparent;
  width: 100%;
  padding: 4px 0;
}
.field-value-input::placeholder { color: #bbb; font-weight: 400; }

.separator {
  height: 1px;
  background: #eee;
  margin: 0 14px;
}

.swap-row {
  display: flex;
  justify-content: center;
  padding: 6px 0;
}

.swap-btn {
  background: #f0f4ff;
  border: 1px solid #d0daf5;
  border-radius: 20px;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1a5bc4;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}
.swap-label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.3px; }

.filters-badge {
  margin: 8px 14px;
  background: #fff3e0;
  border: 1px solid #ffcc80;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.82rem;
  color: #e65100;
  font-weight: 600;
  cursor: pointer;
}

.bottom-actions {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  border-top: 1px solid #eee;
  margin-top: 4px;
}
.btn-clear {
  background: none;
  border: 1px solid #e53935;
  border-radius: 6px;
  color: #e53935;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 8px 16px;
  cursor: pointer;
}
.btn-apply {
  background: #1a5bc4;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 8px 20px;
  cursor: pointer;
}

.empty-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
}
.empty-icon { font-size: 2.5rem; }
.empty-text { color: #999; font-size: 0.9rem; text-align: center; }

.search-btn-wrap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 16px;
  padding-bottom: calc(10px + var(--safe-area-bottom));
  background: white;
  border-top: 1px solid #eee;
}

.route-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #666;
  margin-bottom: 6px;
  overflow: hidden;
  white-space: nowrap;
}
.route-summary span { overflow: hidden; text-overflow: ellipsis; flex: 1; }
.route-arrow { flex-shrink: 0; color: #1a5bc4; }

.btn-search {
  width: 100%;
  background: #1a5bc4;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-search:active { background: #154da0; }

.icon-primary { color: #1a5bc4; }
.icon-accent { color: #d0021b; }
</style>
