<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import { apiSignIn } from '@/api/auth'
import { useAuth } from '@/composables/useAuth'

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
    router.replace('/home')
  } catch (e: any) {
    error.value = e.message || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <button class="back-btn" @click="router.back()">←</button>

    <!-- Logo -->
    <div class="logo-block">
      <div class="logo-icon">
        <svg viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="14" fill="#1a5bc4"/>
          <path d="M8 30 Q14 18 24 18 Q34 18 40 30" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
          <circle cx="15" cy="31" r="4" fill="white"/>
          <circle cx="33" cy="31" r="4" fill="white"/>
          <rect x="7" y="27" width="34" height="6" rx="3" fill="rgba(255,255,255,0.25)"/>
        </svg>
      </div>
      <h1 class="logo-title">Вход в TMGO</h1>
    </div>

    <!-- Form -->
    <form class="form" @submit.prevent="submit" novalidate>
      <div v-if="error" class="error-box">{{ error }}</div>

      <div class="field">
        <label class="field-label">Логин</label>
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

      <button type="button" class="btn-forgot">ЗАБЫЛИ ЛОГИН ИЛИ ПАРОЛЬ?</button>
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
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 0 28px;
  padding-top: calc(16px + var(--safe-area-top));
  padding-bottom: calc(24px + var(--safe-area-bottom));
  box-sizing: border-box;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: #555;
  padding: 4px 0;
  cursor: pointer;
  align-self: flex-start;
  line-height: 1;
}

.logo-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 32px;
  margin-bottom: 36px;
  gap: 16px;
}

.logo-icon svg { width: 64px; height: 64px; }

.logo-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.form { display: flex; flex-direction: column; }

.field { display: flex; flex-direction: column; position: relative; }

.field-label {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 6px;
}

.field-input {
  border: none;
  outline: none;
  font-size: 1rem;
  color: #222;
  background: transparent;
  padding: 4px 0;
  width: 100%;
}
.field-input::placeholder { color: #ccc; }
.field-input:disabled { opacity: 0.6; }

.field-line {
  height: 1px;
  background: #ddd;
  margin-top: 4px;
}
.field-input:focus ~ .field-line,
.field:focus-within .field-line { background: #1a5bc4; height: 1.5px; }

.pw-wrap { display: flex; align-items: center; gap: 8px; }
.pw-wrap .field-input { flex: 1; }
.pw-toggle { background: none; border: none; color: #aaa; cursor: pointer; padding: 0; display: flex; align-items: center; flex-shrink: 0; }

.error-box {
  background: #fff0f0;
  border-left: 3px solid #e53935;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 0.85rem;
  color: #c62828;
  margin-bottom: 20px;
}

.btn-submit {
  margin-top: 36px;
  width: 100%;
  height: 52px;
  background: #1a5bc4;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.2s;
}
.btn-submit:active:not(:disabled) { background: #154da0; }
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
  color: #1a5bc4;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  margin-top: 20px;
  align-self: center;
  padding: 4px;
}

.register-block {
  margin-top: auto;
  padding-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.register-hint { font-size: 0.85rem; color: #aaa; margin: 0; }

.btn-register {
  background: none;
  border: none;
  color: #1a5bc4;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  padding: 4px;
}
</style>
