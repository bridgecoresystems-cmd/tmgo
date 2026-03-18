<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background">
        <img src="/images/hero.webp" alt="tmGo Hero" class="hero-bg-img" />
        <div class="hero-overlay"></div>
      </div>
      <div class="hero-container">
        <div class="hero-card">
          <n-h1 class="hero-title">{{ $t('hero.title') }}</n-h1>
          <n-p class="hero-subtitle">{{ $t('hero.subtitle') }}</n-p>
          
          <div class="order-form-box">
            <n-h3 class="form-title">{{ $t('form.title') }}</n-h3>
            <n-space vertical size="large">
              <n-grid :cols="2" :x-gap="12">
                <n-gi>
                  <n-select
                    v-model:value="orderForm.fromCity"
                    :options="fromCityOptions"
                    :placeholder="$t('form.fromPlaceholder')"
                    filterable
                  />
                </n-gi>
                <n-gi>
                  <n-select
                    v-model:value="orderForm.toCity"
                    :options="toCityOptions"
                    :placeholder="$t('form.toPlaceholder')"
                    filterable
                  />
                </n-gi>
              </n-grid>
              <n-button type="primary" block size="large" class="hero-btn" @click="handleSubmit">
                {{ $t('form.submit') }}
              </n-button>
            </n-space>
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
              <img src="/images/hero.webp" alt="Cabinet Preview" class="preview-img" />
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

// Автоматический редирект в кабинет для авторизованных (после загрузки сессии)
watch([session, loading], () => {
  if (loading.value) return
  const role = session.value?.user?.role
  if (role === 'driver') navigateTo('/cabinet/driver')
  else if (role === 'client') navigateTo('/cabinet/client')
  else if (role === 'admin') navigateTo('/admin')
}, { immediate: true })

const advantages = [
  { key: 'vat' },
  { key: 'limits' },
  { key: 'cabinet' },
  { key: 'fast' },
  { key: 'loaders' },
  { key: 'insurance' },
]

const steps = [
  { key: 'register' },
  { key: 'order' },
  { key: 'documents' },
]

const services = [
  { key: 'office' },
  { key: 'warehouse' },
  { key: 'intercity' },
  { key: 'customers' },
]

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const orderForm = reactive({
  fromCity: null,
  toCity: null
})

const allCities = ref<any[]>([])
const { apiBase } = useApiBase()

onMounted(async () => {
  try {
    const data = await $fetch(`${apiBase}/cities`)
    allCities.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Failed to fetch cities', e)
    allCities.value = []
  }
})

const fromCityOptions = computed(() => 
  (Array.isArray(allCities.value) ? allCities.value : [])
    .filter(c => c.type === 'FROM' || c.type === 'BOTH')
    .map(c => ({ label: c.name, value: c.id }))
)

const toCityOptions = computed(() => 
  (Array.isArray(allCities.value) ? allCities.value : [])
    .filter(c => c.type === 'TO' || c.type === 'BOTH')
    .map(c => ({ label: c.name, value: c.id }))
)

const handleSubmit = () => {
  if (!orderForm.fromCity || !orderForm.toCity) return
  navigateTo('/auth')
}

useHead({
  title: () => t('meta.title'),
  meta: [
    { name: 'description', content: () => t('meta.description') }
  ]
})
</script>

<style scoped>
.landing-page {
  background: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 80px);
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

.order-form-box {
  background: rgba(255, 255, 255, 0.1);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 20px;
}

.form-title {
  color: #fff;
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
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
  color: #000 !important;
  font-weight: 600;
  height: 54px;
  padding: 0 32px;
  border-radius: 16px;
  border: none;
}

@media (max-width: 768px) {
  .hero-section {
    height: 500px;
  }
  .hero-card {
    margin: 0 20px;
    padding: 32px;
  }
  .hero-title {
    font-size: 32px;
  }
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
  .hero-section {
    flex-direction: column;
    text-align: center;
  }
  .hero-title {
    font-size: 36px;
  }
}
</style>
