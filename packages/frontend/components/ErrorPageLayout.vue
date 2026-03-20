<template>
  <div class="error-page">
    <div class="error-card" :style="{ '--accent': accent }">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" :viewBox="iconViewBox" fill="none"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path :d="icon" />
        </svg>
      </div>

      <div class="error-code">{{ code }}</div>
      <h1 class="error-title">{{ t(titleKey) }}</h1>
      <p class="error-message">{{ t(messageKey) }}</p>

      <div v-if="showTimer" class="timer-block">
        <div class="timer-value">{{ timerDisplay }}</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPct + '%' }" />
        </div>
        <p class="error-hint">{{ timerDone ? t('errors.timerDone') : t(hintKey!) }}</p>
      </div>
      <p v-else-if="hintKey" class="error-hint">{{ t(hintKey) }}</p>

      <NuxtLink
        :to="btnTo"
        class="error-btn"
        :class="{ disabled: showTimer && !timerDone }"
        @click.prevent="showTimer && !timerDone ? null : undefined"
      >
        {{ t(btnLabelKey) }}
      </NuxtLink>
    </div>
    <div class="error-bg" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  code:         { type: Number, required: true },
  icon:         { type: String, required: true },
  iconViewBox:  { type: String, default: '0 0 24 24' },
  titleKey:     { type: String, required: true },
  messageKey:   { type: String, required: true },
  hintKey:      { type: String, default: null },
  btnLabelKey:  { type: String, required: true },
  btnTo:        { type: String, default: '/' },
  showTimer:    { type: Boolean, default: false },
  timerSeconds: { type: Number, default: 900 },
})

const { t } = useI18n()

const accent = computed(() => ({
  404: '#6366f1',
  403: '#f59e0b',
  401: '#3b82f6',
  500: '#ef4444',
  502: '#ef4444',
  503: '#f59e0b',
  429: '#ff6b4a',
} as Record<number, string>)[props.code] ?? '#6366f1')

const remaining = ref(props.timerSeconds)
const timerDone = computed(() => remaining.value <= 0)

const timerDisplay = computed(() => {
  const s = Math.max(0, remaining.value)
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
})

const progressPct = computed(() =>
  Math.max(0, (remaining.value / props.timerSeconds) * 100)
)

let timerId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (!props.showTimer) return
  timerId = setInterval(() => {
    if (remaining.value > 0) {
      remaining.value--
    } else {
      if (timerId) clearInterval(timerId)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})
</script>

<style scoped>
.error-page {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
}

.error-bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 50%, #eef2ff 100%);
  z-index: -1;
}

.error-bg::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 120%;
  background: radial-gradient(ellipse, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.error-bg::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 50%;
  height: 80%;
  background: radial-gradient(ellipse, rgba(99, 102, 241, 0.04) 0%, transparent 70%);
  pointer-events: none;
}

.error-card {
  max-width: 420px;
  width: 100%;
  background: #fff;
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(99, 102, 241, 0.06);
  text-align: center;
  animation: cardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.error-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  color: var(--accent);
}

.error-icon svg {
  width: 100%;
  height: 100%;
}

.error-code {
  font-size: 4rem;
  font-weight: 800;
  color: var(--accent);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
  line-height: 1;
}

.error-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px;
}

.error-message {
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
  margin: 0 0 16px;
}

.error-hint {
  font-size: 0.875rem;
  color: #888;
  margin-bottom: 28px;
}

/* Timer */
.timer-block {
  margin-bottom: 24px;
}

.timer-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.progress-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 99px;
  transition: width 1s linear;
}

/* Button */
.error-btn {
  display: inline-block;
  padding: 14px 32px;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.error-btn:hover:not(.disabled) {
  filter: brightness(0.9);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.error-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

@media (max-width: 480px) {
  .error-card { padding: 36px 24px; }
  .error-code  { font-size: 3rem; }
}
</style>
