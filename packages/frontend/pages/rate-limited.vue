<template>
  <div class="rate-limited">
    <div class="rate-limited-card">
      <div class="rate-limited-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <h1 class="rate-limited-code">429</h1>
      <h2 class="rate-limited-title">{{ $t('auth.rateLimited.title') }}</h2>
      <p class="rate-limited-message">{{ $t('auth.rateLimited.message') }}</p>
      <div class="rate-limited-hint">{{ $t('auth.rateLimited.hint') }}</div>
      <NuxtLink to="/auth" class="rate-limited-btn">
        {{ $t('auth.rateLimited.back') }}
      </NuxtLink>
    </div>
    <div class="rate-limited-bg" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<style scoped>
.rate-limited {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
}

.rate-limited-bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #fff8f6 0%, #fff0eb 50%, #ffe8e0 100%);
  z-index: -1;
}

.rate-limited-bg::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 120%;
  background: radial-gradient(ellipse, rgba(255, 107, 74, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.rate-limited-bg::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 50%;
  height: 80%;
  background: radial-gradient(ellipse, rgba(255, 107, 74, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.rate-limited-card {
  max-width: 420px;
  width: 100%;
  background: #fff;
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 107, 74, 0.06);
  text-align: center;
  animation: cardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rate-limited-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  color: #ff6b4a;
}

.rate-limited-icon svg {
  width: 100%;
  height: 100%;
}

.rate-limited-code {
  font-size: 4rem;
  font-weight: 800;
  color: #ff6b4a;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
  line-height: 1;
}

.rate-limited-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px;
}

.rate-limited-message {
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
  margin: 0 0 16px;
}

.rate-limited-hint {
  font-size: 0.875rem;
  color: #888;
  margin-bottom: 28px;
}

.rate-limited-btn {
  display: inline-block;
  padding: 14px 32px;
  background: #ff6b4a;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(255, 107, 74, 0.35);
}

.rate-limited-btn:hover {
  background: #e55a3d;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 74, 0.4);
}

@media (max-width: 480px) {
  .rate-limited-card {
    padding: 36px 24px;
  }
  .rate-limited-code {
    font-size: 3rem;
  }
}
</style>
