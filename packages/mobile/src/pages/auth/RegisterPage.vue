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
  <div class="page animate-fade">
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <h1 class="header-title">Регистрация</h1>
    </header>

    <div class="content">
      <div class="intro">
        <h2 class="title">Создайте аккаунт</h2>
        <p class="subtitle">Выберите вашу роль и заполните данные</p>
      </div>

      <!-- Role Selector -->
      <div class="role-selector">
        <button
          type="button"
          :class="['role-btn', { active: role === 'client' }]"
          @click="role = 'client'"
        >
          <div class="role-icon-box">
            <Package :size="22" />
          </div>
          <span>Я клиент</span>
        </button>
        <button
          type="button"
          :class="['role-btn', { active: role === 'driver' }]"
          @click="role = 'driver'"
        >
          <div class="role-icon-box">
            <Truck :size="22" />
          </div>
          <span>Я водитель</span>
        </button>
      </div>

      <form class="form" @submit.prevent="submit" novalidate>
        <div v-if="error" class="error-box animate-shake">{{ error }}</div>

        <div class="field">
          <label class="field-label">Электронная почта</label>
          <input
            v-model="email"
            type="email"
            class="field-input"
            placeholder="example@mail.com"
            autocomplete="email"
            :disabled="loading"
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
              :disabled="loading"
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
              :disabled="loading"
            />
            <button type="button" class="pw-toggle" @click="showConf = !showConf">
              <EyeOff v-if="showConf" :size="20" />
              <Eye v-else :size="20" />
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary-form" :disabled="loading">
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
  background: linear-gradient(180deg, #ffffff 0%, #fffcfb 100%);
  display: flex;
  flex-direction: column;
}

.header {
  padding: 16px 20px;
  padding-top: calc(16px + var(--safe-area-top));
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border-bottom: 1px solid var(--border-color);
}

.back-btn {
  background: white;
  border: 1px solid var(--border-color);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.back-btn:active {
  transform: scale(0.95);
  background: var(--bg-color);
}

.header-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.5px;
}

.content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

.intro {
  margin-bottom: 24px;
}

.title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 6px;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.role-selector {
  display: flex;
  gap: 14px;
  margin-bottom: 28px;
}

.role-btn {
  flex: 1;
  height: 100px;
  background: white;
  border: 1.5px solid var(--border-color);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.role-btn span {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.role-icon-box {
  width: 40px;
  height: 40px;
  background: var(--bg-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 0.25s ease;
}

.role-btn.active {
  border-color: var(--primary);
  background: var(--primary-light);
  box-shadow: 0 4px 12px rgba(255, 107, 74, 0.12);
  transform: translateY(-2px);
}

.role-btn.active span {
  color: var(--primary-dark);
}

.role-btn.active .role-icon-box {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 10px rgba(255, 107, 74, 0.25);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  padding: 24px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.error-box {
  background: #fff5f5;
  border-left: 4px solid var(--primary);
  padding: 12px 16px;
  border-radius: 8px;
  color: #e53935;
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
  color: var(--text-secondary);
  margin-left: 4px;
}

.field-input {
  width: 100%;
  height: 52px;
  background: var(--bg-color);
  border: 1.5px solid var(--border-color);
  border-radius: 12px;
  padding: 0 16px;
  font-size: 1rem;
  color: var(--text-main);
  outline: none;
  transition: all 0.2s ease;
}

.field-input:focus {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 3px var(--border-focus);
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
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
}

.btn-primary-form {
  margin-top: 12px;
  height: 54px;
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
  gap: 12px;
  box-shadow: 0 6px 20px rgba(255, 107, 74, 0.25);
  transition: all 0.2s ease;
}

.btn-primary-form:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 3px 10px rgba(255, 107, 74, 0.15);
}

.btn-primary-form:disabled {
  opacity: 0.7;
}

.footer {
  margin-top: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 700;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px dashed rgba(255, 107, 74, 0.3);
  transition: all 0.2s;
}

.btn-link:active {
  background: var(--primary-light);
  transform: scale(0.97);
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

.animate-fade {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
