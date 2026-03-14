<template>
  <div
    class="verification-badge"
    :class="`verification-badge--${status}`"
    :title="tooltip"
  >
    <div class="verification-badge__medal">
      <span class="verification-badge__icon">🏅</span>
    </div>
    <div class="verification-badge__text">
      <span class="verification-badge__line1">{{ line1 }}</span>
      <span v-if="line2" class="verification-badge__line2">{{ line2 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
type VerificationStatus = 'not_verified' | 'waiting_verification' | 'verified' | 'request'

const props = withDefaults(
  defineProps<{
    status?: VerificationStatus | null
  }>(),
  { status: 'not_verified' }
)

const config = computed(() => {
  switch (props.status) {
    case 'verified':
      return { line1: 'VERF', line2: '', tooltip: 'Верифицирован' }
    case 'waiting_verification':
      return { line1: 'WAIT', line2: 'VERF', tooltip: 'Ожидает проверки' }
    case 'request':
      return { line1: 'ЗАПР', line2: 'ОС', tooltip: 'Запрос на изменение' }
    default:
      return { line1: 'NOT', line2: 'VERF', tooltip: 'Не верифицирован' }
  }
})

const line1 = computed(() => config.value.line1)
const line2 = computed(() => config.value.line2)
const tooltip = computed(() => config.value.tooltip)
</script>

<style scoped>
.verification-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  line-height: 1.1;
}

.verification-badge__medal {
  flex-shrink: 0;
}

.verification-badge__icon {
  font-size: 18px;
  line-height: 1;
}

.verification-badge__text {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.verification-badge__line2 {
  font-size: 9px;
  opacity: 0.9;
}

/* not_verified — серый */
.verification-badge--not_verified {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* waiting_verification — бронза */
.verification-badge--waiting_verification {
  background: linear-gradient(135deg, #d4a574 0%, #b8860b 50%, #8b6914 100%);
  color: #fff;
  box-shadow: 0 1px 4px rgba(139, 105, 20, 0.4);
}

/* request — синий */
.verification-badge--request {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
  color: #fff;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.4);
}

/* verified — золото */
.verification-badge--verified {
  background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%);
  color: #1f2937;
  box-shadow: 0 1px 4px rgba(217, 119, 6, 0.4);
}
</style>
