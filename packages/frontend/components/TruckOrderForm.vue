<template>
  <div class="truck-form-container">
    <div class="truck-svg-wrapper">
      <!-- SVG Truck (simplified vector style) -->
      <svg viewBox="0 0 1000 400" class="truck-svg">
        <path d="M20 300 L20 180 L140 180 L140 150 L280 150 L280 300 Z" fill="#FF6B4A" />
        <path d="M290 300 L290 80 L980 80 L980 300 Z" fill="#FF6B4A" />
        <circle cx="100" cy="320" r="35" fill="#333" />
        <circle cx="380" cy="320" r="35" fill="#333" />
        <circle cx="460" cy="320" r="35" fill="#333" />
        <circle cx="820" cy="320" r="35" fill="#333" />
        <circle cx="900" cy="320" r="35" fill="#333" />
        <path d="M150 165 L260 165 L260 220 L150 220 Z" fill="rgba(255,255,255,0.4)" />
      </svg>

      <div class="form-overlay">
        <div class="form-inner">
          <n-h3 class="form-title">{{ t('form.title') }}</n-h3>
          <n-space vertical size="small">
            <n-grid :cols="2" :x-gap="8">
              <n-gi>
                <n-select
                  v-model:value="orderForm.fromCity"
                  :options="cityOptions"
                  :placeholder="t('form.fromPlaceholder')"
                  size="small"
                />
              </n-gi>
              <n-gi>
                <n-select
                  v-model:value="orderForm.toCity"
                  :options="cityOptions"
                  :placeholder="t('form.toPlaceholder')"
                  size="small"
                />
              </n-gi>
            </n-grid>
            <n-button type="primary" block size="medium" class="submit-btn" @click="handleSubmit">
              {{ t('form.submit') }}
            </n-button>
          </n-space>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const orderForm = reactive({
  fromCity: null,
  toCity: null
})

// City options will come from backend API in the future
const cityOptions = [
  { label: 'Ашхабад', value: 'ashgabat' },
  { label: 'Мары', value: 'mary' },
  { label: 'Туркменабат', value: 'turkmenabat' },
  { label: 'Дашогуз', value: 'dashoguz' },
  { label: 'Балканабат', value: 'balkanabat' },
  { label: 'Туркменбаши', value: 'turkmenbashi' }
]

const handleSubmit = () => {
  if (!orderForm.fromCity || !orderForm.toCity) {
    return
  }
  navigateTo('/auth')
}
</script>

<style scoped>
.truck-form-container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
}

.truck-svg-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.truck-svg {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 15px 30px rgba(0,0,0,0.15));
}

.form-overlay {
  position: absolute;
  top: 48%;
  left: 63%;
  transform: translate(-50%, -50%);
  width: 55%;
  z-index: 10;
}

.form-inner {
  background: rgba(255, 255, 255, 0.98);
  padding: 20px 25px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  border: 1px solid rgba(255, 107, 74, 0.2);
}

.form-title {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #333;
  text-align: center;
}

.submit-btn {
  background-color: #FF6B4A !important;
  border: none;
  font-weight: 600;
  height: 42px;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .form-overlay {
    width: 80%;
    left: 50%;
  }
  .form-title {
    font-size: 14px;
  }
}
</style>
