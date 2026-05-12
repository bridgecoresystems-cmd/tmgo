<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Truck, Package } from 'lucide-vue-next'
import { apiSignUp } from '@/api/auth'
import { useAuth } from '@/composables/useAuth'

const router  = useRouter()
const { setUser } = useAuth()

const step = ref<1 | 2>(1)

const email    = ref('')
const password = ref('')
const confirm  = ref('')
const showPw   = ref(false)
const showConf = ref(false)
const role     = ref<'client' | 'driver'>('client')

const loading = ref(false)
const error   = ref('')

function goStep2() {
  error.value = ''
  if (!email.value) { error.value = 'Введите email'; return }
  if (!/\S+@\S+\.\S+/.test(email.value)) { error.value = 'Некорректный email'; return }
  if (password.value.length < 6) { error.value = 'Пароль минимум 6 символов'; return }
  if (password.value !== confirm.value) { error.value = 'Пароли не совпадают'; return }
  step.value = 2
}

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const user = await apiSignUp(email.value.trim(), password.value, role.value)
    setUser(user)
    router.replace('/home')
  } catch (e: any) {
    error.value = e.message || 'Ошибка регистрации'
    step.value = 1
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">

    <!-- Step 1: Email + Password -->
    <template v-if="step === 1">
      <button class="back-btn" @click="router.back()">←</button>

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
        <h1 class="logo-title">Регистрация в TMGO</h1>
      </div>

      <form class="form" @submit.prevent="goStep2" novalidate>
        <div v-if="error" class="error-box">{{ error }}</div>

        <div class="field">
          <label class="field-label">Email</label>
          <input
            v-model="email"
            type="email"
            class="field-input"
            placeholder="email@example.com"
            autocomplete="email"
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
              placeholder="Минимум 6 символов"
              autocomplete="new-password"
            />
            <button type="button" class="pw-toggle" @click="showPw = !showPw">
              <EyeOff v-if="showPw" :size="20" />
              <Eye v-else :size="20" />
            </button>
          </div>
          <div class="field-line" />
        </div>

        <div class="field" style="margin-top: 24px">
          <label class="field-label">Повторите пароль</label>
          <div class="pw-wrap">
            <input
              v-model="confirm"
              :type="showConf ? 'text' : 'password'"
              class="field-input"
              placeholder="••••••••"
              autocomplete="new-password"
            />
            <button type="button" class="pw-toggle" @click="showConf = !showConf">
              <EyeOff v-if="showConf" :size="20" />
              <Eye v-else :size="20" />
            </button>
          </div>
          <div class="field-line" />
        </div>

        <button type="submit" class="btn-submit">ДАЛЕЕ →</button>
      </form>

      <div class="login-block">
        <p class="login-hint">Уже есть аккаунт?</p>
        <button class="btn-login" @click="router.push('/login')">ВОЙТИ</button>
      </div>
    </template>

    <!-- Step 2: Role selection -->
    <template v-else>
      <div class="role-header">
        <button class="back-btn" @click="step = 1">←</button>
        <h2 class="role-title">Профиль деятельности</h2>
      </div>

      <p class="role-desc">
        Выберите ваш профиль деятельности.<br>
        Поменять профиль можно и после регистрации.
      </p>

      <div v-if="error" class="error-box" style="margin: 0 0 16px">{{ error }}</div>

      <div class="roles">
        <label :class="['role-card', { selected: role === 'driver' }]" @click="role = 'driver'">
          <div class="role-radio">
            <div v-if="role === 'driver'" class="role-radio-dot" />
          </div>
          <div class="role-icon driver-icon">
            <Truck :size="28" />
          </div>
          <div class="role-text">
            <span class="role-name">Перевозчик</span>
            <span class="role-sub">Ищу грузы для перевозки, у меня есть транспорт</span>
          </div>
        </label>

        <label :class="['role-card', { selected: role === 'client' }]" @click="role = 'client'">
          <div class="role-radio">
            <div v-if="role === 'client'" class="role-radio-dot" />
          </div>
          <div class="role-icon client-icon">
            <Package :size="28" />
          </div>
          <div class="role-text">
            <span class="role-name">Грузовладелец</span>
            <span class="role-sub">У меня есть груз, ищу перевозчиков</span>
          </div>
        </label>
      </div>

      <button class="btn-done" :disabled="loading" @click="submit">
        <span v-if="loading" class="spinner" />
        {{ loading ? 'Регистрация...' : 'ГОТОВО' }}
      </button>
    </template>

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

/* Step 1 */
.logo-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 28px;
  margin-bottom: 32px;
  gap: 14px;
}
.logo-icon svg { width: 60px; height: 60px; }
.logo-title { font-size: 1.2rem; font-weight: 700; color: #1a1a1a; margin: 0; }

.form { display: flex; flex-direction: column; }

.field { display: flex; flex-direction: column; position: relative; }
.field-label { font-size: 0.85rem; color: #888; margin-bottom: 6px; }
.field-input {
  border: none; outline: none; font-size: 1rem; color: #222;
  background: transparent; padding: 4px 0; width: 100%;
}
.field-input::placeholder { color: #ccc; }
.field-line { height: 1px; background: #ddd; margin-top: 4px; }
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
  margin-top: 32px;
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
  transition: background 0.2s;
}
.btn-submit:active { background: #154da0; }

.login-block {
  margin-top: auto;
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.login-hint { font-size: 0.85rem; color: #aaa; margin: 0; }
.btn-login {
  background: none; border: none; color: #1a5bc4;
  font-size: 0.85rem; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; padding: 4px;
}

/* Step 2 */
.role-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.role-header .back-btn { align-self: auto; margin-bottom: 0; }
.role-title { font-size: 1.05rem; font-weight: 700; color: #1a1a1a; margin: 0; }

.role-desc {
  font-size: 0.88rem;
  color: #666;
  line-height: 1.5;
  margin: 0 0 28px;
}

.roles {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 16px;
  border: 1.5px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  user-select: none;
}
.role-card.selected {
  border-color: #1a5bc4;
  background: #f0f5ff;
}

.role-radio {
  width: 22px; height: 22px;
  border: 2px solid #ccc;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}
.role-card.selected .role-radio { border-color: #1a5bc4; }
.role-radio-dot {
  width: 10px; height: 10px;
  background: #1a5bc4;
  border-radius: 50%;
}

.role-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.driver-icon { background: #e8f0fe; color: #1a5bc4; }
.client-icon { background: #e8f5e9; color: #2e7d32; }

.role-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.role-name { font-size: 1rem; font-weight: 600; color: #1a1a1a; }
.role-sub  { font-size: 0.78rem; color: #888; line-height: 1.4; }

.btn-done {
  margin-top: 24px;
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
.btn-done:active:not(:disabled) { background: #154da0; }
.btn-done:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
