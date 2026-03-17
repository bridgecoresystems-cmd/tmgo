<template>
  <div class="auth-main">
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

        <div v-if="registerError" class="form-error">
          {{ registerError }}
        </div>
        
        <div class="form-group">
          <label class="form-label">Email адрес *</label>
          <input 
            type="email" 
            v-model="registerForm.email"
            placeholder="example@mail.com" 
            required 
          >
        </div>

        <div class="form-group">
          <label class="form-label">Я хочу быть *</label>
          <select v-model="registerForm.role" class="custom-select">
            <option value="client">Заказчиком</option>
            <option value="driver">Перевозчиком</option>
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
          {{ loading ? 'Создание аккаунта...' : 'Продолжить' }}
        </button>
        
        <p class="form-switch">
          Уже есть аккаунт? 
          <span @click="isSignupMode = false" class="switch-link">Войти</span>
        </p>
      </form>
    </div>

    <!-- Форма входа -->
    <div class="login" :class="{ active: !isSignupMode }">
      <form @submit.prevent="handleLogin">
        <label for="chk" class="form-title">Вход</label>

        <div v-if="loginError" class="form-error">
          {{ loginError }}
        </div>
        
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
          <span @click="isSignupMode = true" class="switch-link">Регистрация</span>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { signIn, signUp } = useAuth()
const router = useRouter()
const message = useMessage()

const isSignupMode = ref(false)
const loading = ref(false)
const loginError = ref('')
const registerError = ref('')

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
  loginError.value = ''
  loading.value = true
  try {
    const user = await signIn(loginForm.email, loginForm.password)
    if (user?.role === 'admin' || user?.role === 'ADMIN') {
      router.push('/admin')
    } else if (user?.role === 'driver') {
      router.push('/cabinet/driver')
    } else {
      router.push('/cabinet/client')
    }
  } catch (e: any) {
    if (e?.isRateLimited) {
      router.push('/rate-limited')
      return
    }
    loginError.value = e.message || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  registerError.value = ''
  if (registerForm.password !== registerForm.passwordConfirm) {
    registerError.value = 'Пароли не совпадают'
    return
  }

  loading.value = true
  try {
    const user = await signUp(
      registerForm.email,
      registerForm.password,
      registerForm.email.split('@')[0], // Временное имя из email
      registerForm.role
    )
    
    message.success('Аккаунт создан! Заполните профиль.')
    if (user?.role === 'driver') {
      router.push('/cabinet/driver')
    } else {
      router.push('/cabinet/client')
    }
  } catch (e: any) {
    registerError.value = e.message || 'Ошибка регистрации'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-main {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
  min-height: 600px;
  display: flex;
  flex-direction: column;
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
  padding: 30px 35px;
  display: flex;
  flex-direction: column;
  justify-content: center;
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

.form-error {
  padding: 10px 14px;
  margin-bottom: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #b91c1c;
  font-size: 14px;
  text-align: center;
}

.form-title {
  font-size: 24px;
  font-weight: 800;
  color: #ff6b4a;
  margin-bottom: 20px;
  text-align: center;
  display: block;
}

.form-group {
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
}

.form-label {
  font-weight: 600;
  color: #333;
  font-size: 13px;
  margin-bottom: 4px;
  display: block;
  text-align: center;
}

input, .custom-select {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
  text-align: center;
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
