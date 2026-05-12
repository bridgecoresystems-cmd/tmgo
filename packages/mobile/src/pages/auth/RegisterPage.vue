<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Truck, Package, ArrowLeft } from 'lucide-vue-next'
import { apiSignUp } from '@/api/auth'
import { useAuth } from '@/composables/useAuth'
import { roleHome } from '@/router'

const router  = useRouter()
const { setUser } = useAuth()

const email    = ref('')
const password = ref('')
const confirm  = ref('')
const showPw   = ref(false)
const showConf = ref(false)
const role     = ref<'client' | 'driver'>('client')

const loading = ref(false)
const error   = ref('')

async function submit() {
  error.value = ''
  if (!email.value) { error.value = 'Введите email'; return }
  if (!/\S+@\S+\.\S+/.test(email.value)) { error.value = 'Некорректный email'; return }
  if (password.value.length < 6) { error.value = 'Пароль минимум 6 символов'; return }
  if (password.value !== confirm.value) { error.value = 'Пароли не совпадают'; return }

  loading.value = true
  try {
    const user = await apiSignUp(email.value.trim(), password.value, role.value)
    setUser(user)
    router.replace(roleHome(user.role))
  } catch (e: any) {
    error.value = e.message || 'Ошибка регистрации'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="header-title">Регистрация</h1>
    </header>

    <div class="content">
      <div class="intro">
        <h2 class="title">Создайте аккаунт</h2>
        <p class="subtitle">Выберите роль и заполните данные</p>
      </div>

      <!-- Role Selector -->
      <div class="role-selector">
        <button
          type="button"
          :class="['role-btn', { active: role === 'client' }]"
          @click="role = 'client'"
        >
          <div class="role-icon-box">
            <Package :size="20" />
          </div>
          <span>Я клиент</span>
        </button>
        <button
          type="button"
          :class="['role-btn', { active: role === 'driver' }]"
          @click="role = 'driver'"
        >
          <div class="role-icon-box">
            <Truck :size="20" />
          </div>
          <span>Я водитель</span>
        </button>
      </div>

      <form class="form" @submit.prevent="submit" novalidate>
        <div v-if="error" class="error-box">{{ error }}</div>

        <div class="field">
          <label class="field-label">Email</label>
          <input
            v-model="email"
            type="email"
            class="field-input"
            placeholder="example@mail.com"
            autocomplete="email"
          />
        </div>

        <div class="field">
          <label class="field-label">Пароль</label>
          <div class="input-wrap">
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
        </div>

        <div class="field">
          <label class="field-label">Подтверждение пароля</label>
          <div class="input-wrap">
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
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner" />
          {{ loading ? 'Создаем аккаунт...' : 'ЗАРЕГИСТРИРОВАТЬСЯ' }}
        </button>
      </form>

      <div class="footer">
        <p>Уже есть аккаунт?</p>
        <button class="btn-link" @click="router.push('/login')">Войти</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 12px 16px;
  padding-top: calc(12px + var(--safe-area-top));
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  color: #333;
  padding: 4px;
  cursor: pointer;
  display: flex;
}

.header-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
}

.content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.intro {
  margin-bottom: 24px;
}

.title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 0.95rem;
  color: #666;
}

.role-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.role-btn {
  flex: 1;
  height: 90px;
  background: #f8f9fb;
  border: 2px solid #f0f2f5;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-btn span {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
}

.role-icon-box {
  width: 36px;
  height: 36px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}

.role-btn.active {
  border-color: #1a5bc4;
  background: #f0f5ff;
}

.role-btn.active span {
  color: #1a5bc4;
}

.role-btn.active .role-icon-box {
  background: #1a5bc4;
  color: white;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-box {
  background: #fff0f0;
  border-left: 4px solid #e53935;
  padding: 12px 16px;
  border-radius: 8px;
  color: #c62828;
  font-size: 0.88rem;
  font-weight: 500;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #888;
  margin-left: 4px;
}

.field-input {
  width: 100%;
  height: 52px;
  background: #f8f9fb;
  border: 1.5px solid #f0f2f5;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 1rem;
  color: #222;
  outline: none;
  transition: all 0.2s;
}

.field-input:focus {
  border-color: #1a5bc4;
  background: white;
}

.input-wrap {
  position: relative;
}

.pw-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  padding: 8px;
}

.btn-primary {
  margin-top: 12px;
  height: 56px;
  background: #1a5bc4;
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: transform 0.1s active;
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.7;
}

.footer {
  margin-top: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #888;
}

.btn-link {
  background: none;
  border: none;
  color: #1a5bc4;
  font-weight: 700;
  cursor: pointer;
  padding: 4px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
