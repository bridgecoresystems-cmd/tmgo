<template>
  <div class="truck-form-container">
    <div class="truck-svg-wrapper">
      <!-- SVG Грузовика (упрощенный векторный стиль) -->
      <svg viewBox="0 0 1000 400" class="truck-svg">
        <path d="M20 300 L20 180 L140 180 L140 150 L280 150 L280 300 Z" fill="#FF6B4A" /> <!-- Кабина -->
        <path d="M290 300 L290 80 L980 80 L980 300 Z" fill="#FF6B4A" /> <!-- Огромный кузов -->
        <circle cx="100" cy="320" r="35" fill="#333" /> <!-- Переднее -->
        <circle cx="380" cy="320" r="35" fill="#333" /> <!-- Заднее 1 -->
        <circle cx="460" cy="320" r="35" fill="#333" /> <!-- Заднее 2 -->
        <circle cx="820" cy="320" r="35" fill="#333" /> <!-- Прицеп 1 -->
        <circle cx="900" cy="320" r="35" fill="#333" /> <!-- Прицеп 2 -->
        
        <!-- Окно -->
        <path d="M150 165 L260 165 L260 220 L150 220 Z" fill="rgba(255,255,255,0.4)" />
      </svg>

      <!-- Форма теперь аккуратно вписана ВНУТРЬ кузова -->
      <div class="form-overlay">
        <div class="form-inner">
          <n-h3 class="form-title">Выберите направление</n-h3>
          <n-space vertical size="small">
            <n-grid :cols="2" :x-gap="8">
              <n-gi>
                <n-select
                  v-model:value="orderForm.fromCity"
                  :options="cityOptions"
                  placeholder="Откуда"
                  size="small"
                />
              </n-gi>
              <n-gi>
                <n-select
                  v-model:value="orderForm.toCity"
                  :options="cityOptions"
                  placeholder="Куда"
                  size="small"
                />
              </n-gi>
            </n-grid>
            <n-button type="primary" block size="medium" class="submit-btn" @click="handleSubmit">
              Оставить заявку
            </n-button>
          </n-space>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const orderForm = reactive({
  fromCity: null,
  toCity: null
})

// В будущем эти данные будут приходить из API бэкенда (админки)
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
    // Здесь можно добавить уведомление
    return
  }
  navigateTo('/auth')
}
</script>

<style scoped>
.truck-form-container {
  width: 100%;
  max-width: 1000px; /* Увеличил контейнер */
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
  top: 48%; /* Центрируем по вертикали относительно кузова */
  left: 63%; /* Смещаем в центр кузова */
  transform: translate(-50%, -50%);
  width: 55%; /* Уменьшил ширину формы относительно грузовика */
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
