<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background">
        <img src="/images/tmgo_hero.webp" alt="tmGo Hero" class="hero-bg-img" />
        <div class="hero-overlay"></div>
      </div>
      <div class="hero-container">
        <div class="hero-card">
          <n-h1 class="hero-title">{{ $t('hero.title') }}</n-h1>
          <n-p class="hero-subtitle">{{ $t('hero.subtitle') }}</n-p>
          
          <div class="search-widget">
            <!-- Mode toggle -->
            <div class="mode-toggle">
              <button :class="['mode-btn', { active: searchMode === 'cargo' }]" @click="searchMode = 'cargo'">
                {{ $t('search.mode.cargo') }}
              </button>
              <button :class="['mode-btn', { active: searchMode === 'truck' }]" @click="searchMode = 'truck'">
                {{ $t('search.mode.truck') }}
              </button>
            </div>

            <!-- Route inputs -->
            <div class="hero-route">
              <div class="hero-field">
                <div class="hero-field-label">{{ $t('search.from') }}</div>
                <n-select
                  v-model:value="heroForm.fromCountry"
                  :options="fromCountryOptions"
                  :placeholder="$t('searchPage.filters.country')"
                  filterable
                  remote
                  clearable
                  :loading="fromCountryLoading"
                  @search="onFromCountrySearch"
                  size="small"
                  class="hero-select"
                />
                <n-auto-complete
                  v-model:value="heroForm.fromRegion"
                  :options="fromRegionSuggestions"
                  :loading="fromRegionLoading"
                  :placeholder="$t('searchPage.filters.region')"
                  size="small"
                  clearable
                  blur-after-select
                  @update:value="onFromRegionInput"
                  class="hero-input"
                  style="margin-top: 8px;"
                />
                <n-auto-complete
                  v-model:value="heroForm.fromCity"
                  :options="fromCitySuggestions"
                  :loading="fromCityLoading"
                  :placeholder="$t('searchPage.filters.city')"
                  size="small"
                  clearable
                  blur-after-select
                  @update:value="onFromCityInput"
                  class="hero-input"
                  style="margin-top: 8px;"
                />
              </div>

              <button class="hero-swap" @click="swapHero" :title="$t('search.swap')">⇄</button>

              <div class="hero-field">
                <div class="hero-field-label">{{ $t('search.to') }}</div>
                <n-select
                  v-model:value="heroForm.toCountry"
                  :options="toCountryOptions"
                  :placeholder="$t('searchPage.filters.country')"
                  filterable
                  remote
                  clearable
                  :loading="toCountryLoading"
                  @search="onToCountrySearch"
                  size="small"
                  class="hero-select"
                />
                <n-auto-complete
                  v-model:value="heroForm.toRegion"
                  :options="toRegionSuggestions"
                  :loading="toRegionLoading"
                  :placeholder="$t('searchPage.filters.region')"
                  size="small"
                  clearable
                  blur-after-select
                  @update:value="onToRegionInput"
                  class="hero-input"
                  style="margin-top: 8px;"
                />
                <n-auto-complete
                  v-model:value="heroForm.toCity"
                  :options="toCitySuggestions"
                  :loading="toCityLoading"
                  :placeholder="$t('searchPage.filters.city')"
                  size="small"
                  clearable
                  blur-after-select
                  @update:value="onToCityInput"
                  class="hero-input"
                  style="margin-top: 8px;"
                />
              </div>
            </div>

            <n-button type="primary" block size="large" class="hero-btn" @click="heroSearch">
              {{ searchMode === 'cargo' ? $t('search.submit.cargo') : $t('search.submit.truck') }}
            </n-button>
          </div>
        </div>
      </div>
    </section>

    <!-- Advantages Section -->
    <section class="section advantages-section" id="advantages">
      <div class="container">
        <n-h2 class="section-title">{{ $t('advantages.title') }}</n-h2>
        <n-grid :cols="3" :x-gap="24" :y-gap="24" responsive="screen">
          <n-gi v-for="adv in advantages" :key="adv.key">
            <n-card class="advantage-card" hoverable>
              <template #header>
                <n-text strong class="adv-title">{{ $t(`advantages.items.${adv.key}.title`) }}</n-text>
              </template>
              <n-p class="adv-desc">{{ $t(`advantages.items.${adv.key}.description`) }}</n-p>
            </n-card>
          </n-gi>
        </n-grid>
      </div>
    </section>

    <!-- Control Center Section -->
    <section class="section control-center-section" id="cabinet">
      <div class="container">
        <n-grid :cols="2" :x-gap="48" responsive="screen" item-responsive>
          <n-gi class="flex-center">
            <div class="text-content">
              <n-h2>{{ $t('cabinet.title') }}</n-h2>
              <n-p>{{ $t('cabinet.description') }}</n-p>
              <n-button type="primary" size="large" @click="navigateTo('/auth')">{{ $t('cabinet.button') }}</n-button>
            </div>
          </n-gi>
          <n-gi class="flex-center">
            <div class="cabinet-preview">
              <img src="/images/tmgo_hero.webp" alt="Cabinet Preview" class="preview-img" />
            </div>
          </n-gi>
        </n-grid>
      </div>
    </section>

    <!-- How We Work Section -->
    <section class="section how-it-works-section" id="how-it-works">
      <div class="container">
        <n-h2 class="section-title">{{ $t('steps.title') }}</n-h2>
        <n-grid :cols="3" :x-gap="24" responsive="screen">
          <n-gi v-for="(step, index) in steps" :key="step.key">
            <div class="step-card">
              <div class="step-number">{{ index + 1 }}</div>
              <n-h3 class="step-title">{{ $t(`steps.items.${step.key}.title`) }}</n-h3>
              <n-p class="step-desc">{{ $t(`steps.items.${step.key}.description`) }}</n-p>
            </div>
          </n-gi>
        </n-grid>
      </div>
    </section>

    <!-- Services Section -->
    <section class="section services-section" id="services">
      <div class="container">
        <n-h2 class="section-title">{{ $t('services.title') }}</n-h2>
        <n-grid :cols="4" :x-gap="20" :y-gap="20" responsive="screen">
          <n-gi v-for="service in services" :key="service.key">
            <n-card class="service-card" hoverable>
              <n-h3 class="service-title">{{ $t(`services.items.${service.key}.title`) }}</n-h3>
              <n-p class="service-desc">{{ $t(`services.items.${service.key}.description`) }}</n-p>
            </n-card>
          </n-gi>
        </n-grid>
      </div>
    </section>

    <footer class="page-footer">{{ $t('layout.footer') }}</footer>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { session, loading } = useAuth()
const { COUNTRY_LIST } = useCountryConfig()
const { fetchCountrySuggestions, fetchRegionSuggestions, fetchCitySuggestions } = useNominatim()

const countryOptions = computed(() =>
  COUNTRY_LIST.map(c => ({ label: `${c.flag} ${c.name}`, value: c.code }))
)

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



const advantages = [{ key: 'vat' }, { key: 'limits' }, { key: 'cabinet' }, { key: 'fast' }, { key: 'loaders' }, { key: 'insurance' }]
const steps = [{ key: 'register' }, { key: 'order' }, { key: 'documents' }]
const services = [{ key: 'office' }, { key: 'warehouse' }, { key: 'intercity' }, { key: 'customers' }]

const searchMode = ref<'cargo' | 'truck'>('cargo')
const heroForm = reactive({
  fromCountry: null as string | null,
  fromRegion: '',
  fromCity: '',
  toCountry: null as string | null,
  toRegion: '',
  toCity: '',
})

function swapHero() {
  const tc = heroForm.fromCountry; const tx = heroForm.fromCity
  heroForm.fromCountry = heroForm.toCountry; heroForm.fromCity = heroForm.toCity
  heroForm.toCountry = tc; heroForm.toCity = tx
}

function heroSearch() {
  const q: Record<string, string> = {}
  if (heroForm.fromCountry) q.fromCountry = heroForm.fromCountry
  if (heroForm.fromRegion)  q.fromRegion  = heroForm.fromRegion
  if (heroForm.fromCity)    q.fromCity    = heroForm.fromCity
  if (heroForm.toCountry)   q.toCountry   = heroForm.toCountry
  if (heroForm.toRegion)    q.toRegion    = heroForm.toRegion
  if (heroForm.toCity)      q.toCity      = heroForm.toCity
  navigateTo({ path: '/landing/search', query: q })
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
    fromRegionSuggestions.value = await fetchRegionSuggestions(val, heroForm.fromCountry)
    fromRegionLoading.value = false
  }, 350)
}

function onToRegionInput(val: string) {
  if (toRegionTimer) clearTimeout(toRegionTimer)
  toRegionTimer = setTimeout(async () => {
    toRegionLoading.value = true
    toRegionSuggestions.value = await fetchRegionSuggestions(val, heroForm.toCountry)
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
    fromCitySuggestions.value = await fetchCitySuggestions(val, heroForm.fromCountry, heroForm.fromRegion)
    fromCityLoading.value = false
  }, 350)
}

function onToCityInput(val: string) {
  if (toCityTimer) clearTimeout(toCityTimer)
  toCityTimer = setTimeout(async () => {
    toCityLoading.value = true
    toCitySuggestions.value = await fetchCitySuggestions(val, heroForm.toCountry, heroForm.toRegion)
    toCityLoading.value = false
  }, 350)
}

watch(() => heroForm.fromCountry, () => { heroForm.fromRegion = ''; heroForm.fromCity = ''; fromRegionSuggestions.value = []; fromCitySuggestions.value = [] })
watch(() => heroForm.toCountry,   () => { heroForm.toRegion   = ''; heroForm.toCity   = ''; toRegionSuggestions.value   = []; toCitySuggestions.value   = [] })
watch(() => heroForm.fromRegion,  () => { heroForm.fromCity = ''; fromCitySuggestions.value = [] })
watch(() => heroForm.toRegion,    () => { heroForm.toCity   = ''; toCitySuggestions.value   = [] })

useHead({
  title: () => t('meta.title'),
  meta: [{ name: 'description', content: () => t('meta.description') }]
})
</script>

<style scoped>
.landing-page {
  background: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);
}

.page-footer {
  margin-top: auto;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  font-size: 14px;
  color: #666;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section {
  padding: 80px 0;
}

.section-title {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 48px;
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 600px;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.hero-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.hero-container {
  position: relative;
  z-index: 3;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  width: 100%;
}

.hero-card {
  background: #ff6b4a;
  padding: 40px;
  border-radius: 24px;
  max-width: 550px;
  color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border-top-left-radius: 40px;
  border-bottom-right-radius: 40px;
}


.hero-title {
  font-size: 42px;
  line-height: 1.1;
  font-weight: 800;
  margin-bottom: 20px;
  color: #fff;
}

.hero-subtitle {
  font-size: 18px;
  margin-bottom: 32px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

.hero-btn {
  background: #fff !important;
  color: #ff6b4a !important;
  font-weight: 700;
  height: 52px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  letter-spacing: 0.3px;
}

/* Search widget */
.search-widget {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 16px;
  padding: 20px;
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  backdrop-filter: blur(4px);
}

.mode-toggle {
  display: flex;
  background: rgba(0,0,0,0.15);
  border-radius: 10px;
  padding: 3px;
  gap: 3px;
}

.mode-btn {
  flex: 1;
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  font-size: 14px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.mode-btn.active {
  background: #fff;
  color: #ff6b4a;
}

.hero-route {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.hero-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.hero-field-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hero-select :deep(.n-base-selection) {
  background: rgba(255,255,255,0.9) !important;
  border-radius: 8px !important;
}

.hero-input :deep(.n-input__input-el) {
  background: rgba(255,255,255,0.9) !important;
}

.hero-input :deep(.n-input) {
  border-radius: 8px !important;
  background: rgba(255,255,255,0.9) !important;
}

.hero-swap {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 8px;
  color: #fff;
  font-size: 18px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 2px;
  transition: background 0.2s;
}

.hero-swap:hover {
  background: rgba(255,255,255,0.3);
}

@media (max-width: 900px) {
  .hero-card { max-width: 100%; }
}

@media (max-width: 768px) {
  .hero-section {
    height: auto;
    min-height: calc(100dvh - 64px);
    padding: 32px 0 40px;
    align-items: flex-start;
  }

  .hero-container { padding: 0 16px; }

  .hero-card {
    max-width: 100%;
    margin: 0;
    padding: 24px 18px;
    border-radius: 20px;
    border-top-left-radius: 24px;
    border-bottom-right-radius: 24px;
  }

  .hero-title {
    font-size: 26px;
    margin-bottom: 10px;
  }

  .hero-subtitle {
    font-size: 14px;
    margin-bottom: 20px;
  }

  .search-widget {
    padding: 16px;
    gap: 12px;
  }

  .hero-route {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .hero-swap {
    transform: rotate(90deg);
    align-self: center;
    margin: 0;
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .section { padding: 48px 0; }
  .section-title { font-size: 24px; margin-bottom: 32px; }
  .control-center-section { padding: 48px 0; }
}

/* Advantages */
.advantage-card {
  height: 100%;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  transition: transform 0.3s ease;
}

.adv-title {
  font-size: 18px;
  color: #000;
}

.adv-desc {
  color: #666;
  line-height: 1.6;
}

/* Control Center */
.control-center-section {
  background: #fff5f0; /* Light orange tint */
  padding: 100px 0;
}

.flex-center {
  display: flex;
  align-items: center;
}

.cabinet-preview {
  width: 100%;
  background: #fff;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.preview-img {
  width: 100%;
  border-radius: 10px;
}

/* How it works */
.step-card {
  text-align: center;
  padding: 20px;
}

.step-number {
  width: 40px;
  height: 40px;
  background: #000;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-weight: bold;
}

/* Services */
.service-card {
  height: 100%;
  border-radius: 16px;
  text-align: center;
}

.service-title {
  font-size: 18px;
  margin-bottom: 12px;
}

.service-desc {
  font-size: 14px;
  color: #666;
}

@media (max-width: 992px) {
  .hero-title { font-size: 34px; }
}
</style>
