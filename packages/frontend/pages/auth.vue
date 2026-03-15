<template>
  <div class="auth-container">
    <div class="auth-main">
      <!-- Скрытый чекбокс для переключения через CSS (если нужно) или просто через v-model -->
      <input 
        type="checkbox" 
        id="chk" 
        v-model="isSignupMode"
        aria-hidden="true"
      >
      
      <!-- Форма регистрации -->
      <div class="signup" :class="{ active: isSignupMode }">
        <form @submit.prevent="handleRegister">
          <label for="chk" class="form-title">Регистрация</label>
          
          <div class="form-group">
            <label class="form-label">Email (логин) *</label>
            <input 
              type="email" 
              v-model="registerForm.email"
              placeholder="example@mail.com" 
              required 
            >
          </div>

          <div class="form-group">
            <label class="form-label">Роль *</label>
            <select v-model="registerForm.role" class="custom-select">
              <option value="client">Заказчик</option>
              <option value="driver">Перевозчик</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Пароль *</label>
            <input 
              type="password" 
              v-model="registerForm.password"
              placeholder="Минимум 8 символов"
              required 
            >
          </div>

          <div class="form-group">
            <label class="form-label">Подтвердите пароль *</label>
            <input 
              type="password" 
              v-model="registerForm.passwordConfirm"
              placeholder="Повторите пароль"
              required 
            >
          </div>

          <button 
            type="submit" 
            class="btn-submit"
            :disabled="loading"
          >
            {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
          </button>
          
          <p class="form-switch">
            Уже зарегистрированы? 
            <span @click="navigateTo('/auth?mode=login')" class="switch-link">Войти</span>
          </p>
        </form>
      </div>

      <!-- Форма входа -->
      <div class="login" :class="{ active: !isSignupMode }">
        <form @submit.prevent="handleLogin">
          <label for="chk" class="form-title">Вход</label>
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input 
              type="email" 
              v-model="loginForm.email"
              placeholder="your@email.com" 
              required 
            >
          </div>

          <div class="form-group">
            <label class="form-label">Пароль</label>
            <input 
              type="password" 
              v-model="loginForm.password"
              placeholder="Введите пароль" 
              required 
            >
          </div>

          <button 
            type="submit" 
            class="btn-submit"
            :disabled="loading"
          >
            {{ loading ? 'Вход...' : 'Войти' }}
          </button>
          
          <p class="form-switch">
            Нет аккаунта? 
            <span @click="navigateTo('/auth?mode=signup')" class="switch-link">Регистрация</span>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'default' })

const { signIn, signUp } = useAuth()
const route = useRoute()
const message = useMessage()

const isSignupMode = ref(route.query.mode === 'signup')
watch(() => route.query.mode, (mode) => {
  isSignupMode.value = mode === 'signup'
}, { immediate: true })
const loading = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
  role: 'client'
})

const handleLogin = async () => {
  loading.value = true
  try {
    const user = await signIn(loginForm.email, loginForm.password)
    if (user?.role === 'admin') {
      await navigateTo('/admin')
    } else if (user?.role === 'driver') {
      await navigateTo('/cabinet/driver')
    } else {
      await navigateTo('/cabinet/client')
    }
  } catch (e: any) {
    const msg = e?.message || ''
    if (msg.toLowerCase().includes('failed to fetch') || msg.includes('network')) {
      message.error('Сервер недоступен. Проверьте: 1) Телефон на той же Wi‑Fi, что и ПК. 2) Backend запущен (bun run dev в packages/backend). 3) Откройте в браузере телефона http://<IP-ПК>:8000 — должна быть надпись "TMGO API is running".')
    } else {
      message.error(msg || 'Ошибка входа')
    }
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (registerForm.password !== registerForm.passwordConfirm) {
    message.error('Пароли не совпадают')
    return
  }

  loading.value = true
  try {
    const user = await signUp(
      registerForm.email,
      registerForm.password,
      registerForm.email.split('@')[0],
      registerForm.role
    )
    
    if (user?.role === 'admin') {
      await navigateTo('/admin')
    } else if (user?.role === 'driver') {
      await navigateTo('/cabinet/driver')
    } else {
      await navigateTo('/cabinet/client')
    }
  } catch (e: any) {
    const msg = e?.message || ''
    if (msg.toLowerCase().includes('failed to fetch') || msg.includes('network')) {
      message.error('Сервер недоступен. Телефон на той же Wi‑Fi, что и ПК? Backend запущен?')
    } else {
      message.error(msg || 'Ошибка регистрации')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px 20px;
  /* Без серого фона — белая зона от layout */
}

.auth-main {
  width: 100%;
  max-width: 450px;
  background: #f5f6f8; /* Серый блок для формы */  
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
  min-height: 520px;
  display: flex;
  flex-direction: column;
  border: 25px solid #ff6b4a;
}

#chk {
  display: none;
}

.signup,
.login {
  position: absolute;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
  padding: 25px 35px; /* Уменьшил паддинги */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Контент к верху */
  box-sizing: border-box;
}

.signup {
  transform: translateY(100%);
  opacity: 0;
  z-index: 1;
}

.login {
  transform: translateY(0);
  opacity: 1;
  z-index: 2;
}

#chk:checked ~ .signup {
  transform: translateY(0);
  opacity: 1;
  z-index: 2;
}

#chk:checked ~ .login {
  transform: translateY(-100%);
  opacity: 0;
  z-index: 1;
}

.form-title {
  font-size: 22px; /* Уменьшил заголовок */
  font-weight: 800;
  color: #ff6b4a;
  margin-bottom: 15px; /* Уменьшил отступ */
  text-align: center;
  display: block;
}

.form-group {
  margin-bottom: 10px; /* Уменьшил отступ между полями */
  width: 100%;
  box-sizing: border-box;
}

.form-label {
  font-weight: 600;
  color: #333;
  font-size: 13px;
  margin-bottom: 4px;
  display: block;
}

input, .custom-select {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
}

input:focus, .custom-select:focus {
  outline: none;
  border-color: #ff6b4a;
  background: #fffcfb;
}

.custom-select {
  appearance: none;
  background: #fff;
  cursor: pointer;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background: #ff6b4a;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 15px;
}

.btn-submit:hover:not(:disabled) {
  background: #e55a3d;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(255, 107, 74, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-switch {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.switch-link {
  color: #ff6b4a;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
}

.switch-link:hover {
  color: #e55a3d;
}
</style>
