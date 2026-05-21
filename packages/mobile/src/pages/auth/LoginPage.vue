<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, ArrowLeft } from 'lucide-vue-next'
import { apiSignIn } from '@/api/auth'
import { useAuth } from '@/composables/useAuth'
import { roleHome } from '@/router'

const router  = useRouter()
const { setUser } = useAuth()

const email    = ref('')
const password = ref('')
const showPw   = ref(false)
const loading  = ref(false)
const error    = ref('')

async function submit() {
  error.value = ''
  if (!email.value || !password.value) { error.value = 'Заполните все поля'; return }
  loading.value = true
  try {
    const user = await apiSignIn(email.value.trim(), password.value)
    setUser(user)
    router.replace(roleHome(user.role))
  } catch (e: any) {
    error.value = e.message || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <button class="back-btn" @click="router.back()">
      <ArrowLeft :size="20" />
    </button>

    <!-- Logo -->
    <div class="logo-block">
      <div class="logo-icon">
        <svg viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="14" fill="#ff6b4a"/>
          <path d="M8 30 Q14 18 24 18 Q34 18 40 30" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
          <circle cx="15" cy="31" r="4" fill="white"/>
          <circle cx="33" cy="31" r="4" fill="white"/>
          <rect x="7" y="27" width="34" height="6" rx="3" fill="rgba(255,255,255,0.25)"/>
        </svg>
      </div>
      <h1 class="logo-title">Вход в TMGO</h1>
      <p class="logo-subtitle">Управляйте логистикой в одно касание</p>
    </div>

    <!-- Form -->
    <form class="form" @submit.prevent="submit" novalidate>
      <div v-if="error" class="error-box animate-shake">{{ error }}</div>

      <div class="field">
        <label class="field-label">Электронная почта</label>
        <input
          v-model="email"
          type="email"
          class="field-input"
          placeholder="email@example.com"
          autocomplete="email"
          :disabled="loading"
        />
        <div class="field-line" />
      </div>

      <div class="field" style="margin-top: 24px">
        <label class="field-label">Пароль</label>
        <div class="pw-wrap">
          <input
            v-model="password"
            :type="showPw ? 'text' : 'password'"
            class="field-input"
            placeholder="••••••••"
            autocomplete="current-password"
            :disabled="loading"
          />
          <button type="button" class="pw-toggle" @click="showPw = !showPw">
            <EyeOff v-if="showPw" :size="20" />
            <Eye v-else :size="20" />
          </button>
        </div>
        <div class="field-line" />
      </div>

      <button type="submit" class="btn-submit" :disabled="loading">
        <span v-if="loading" class="spinner" />
        {{ loading ? 'Входим...' : 'ВОЙТИ' }}
      </button>

      <button type="button" class="btn-forgot">ЗАБЫЛИ ПАРОЛЬ?</button>
    </form>

    <!-- Register link -->
    <div class="register-block">
      <p class="register-hint">Ещё нет аккаунта?</p>
      <button class="btn-register" @click="router.push('/register')">ЗАРЕГИСТРИРОВАТЬСЯ</button>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #fffcfb 100%);
  display: flex;
  flex-direction: column;
  padding: 0 24px;
  padding-top: calc(16px + var(--safe-area-top));
  padding-bottom: calc(24px + var(--safe-area-bottom));
  box-sizing: border-box;
}

.back-btn {
  background: white;
  border: 1px solid var(--border-color);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
  align-self: flex-start;
}

.back-btn:active {
  transform: scale(0.95);
  background: var(--bg-color);
}

.logo-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24px;
  margin-bottom: 32px;
  gap: 8px;
}

.logo-icon svg {
  width: 72px;
  height: 72px;
  filter: drop-shadow(0 6px 16px rgba(255, 107, 74, 0.25));
}

.logo-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
  margin-top: 12px;
  letter-spacing: -0.5px;
}

.logo-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.form {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 24px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.field {
  display: flex;
  flex-direction: column;
  position: relative;
}

.field-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 6px;
}

.field-input {
  border: none;
  outline: none;
  font-size: 1rem;
  color: var(--text-main);
  background: transparent;
  padding: 8px 0;
  width: 100%;
}
.field-input::placeholder { color: var(--text-muted); }
.field-input:disabled { opacity: 0.6; }

.field-line {
  height: 1px;
  background: var(--border-color);
  margin-top: 2px;
  transition: all 0.25s ease;
}
.field-input:focus ~ .field-line,
.field:focus-within .field-line {
  background: var(--primary);
  height: 2px;
}

.pw-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pw-wrap .field-input { flex: 1; }
.pw-toggle {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.2s;
}

.pw-toggle:active {
  color: var(--primary);
}

.error-box {
  background: #fff5f5;
  border-left: 4px solid var(--primary);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.88rem;
  color: #e53935;
  margin-bottom: 20px;
  font-weight: 500;
}

.btn-submit {
  margin-top: 32px;
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 6px 20px rgba(255, 107, 74, 0.25);
  transition: all 0.2s ease;
}
.btn-submit:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 3px 10px rgba(255, 107, 74, 0.15);
}
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

.btn-forgot {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  margin-top: 20px;
  align-self: center;
  padding: 8px;
  transition: opacity 0.2s;
}

.btn-forgot:active {
  opacity: 0.7;
}

.register-block {
  margin-top: auto;
  padding-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.register-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
}

.btn-register {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px dashed rgba(255, 107, 74, 0.3);
  transition: all 0.2s;
}

.btn-register:active {
  background: var(--primary-light);
  transform: scale(0.97);
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
