<template>
  <div class="auth-main">
    <input
      type="checkbox"
      id="chk"
      v-model="isSignupMode"
      aria-hidden="true"
    >

    <!-- Registration form -->
    <div class="signup" :class="{ active: isSignupMode }">
      <form @submit.prevent="handleRegister">
        <label for="chk" class="form-title">{{ t('auth.signup.title') }}</label>

        <div v-if="registerError" class="form-error">
          {{ registerError }}
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('auth.signup.emailAddress') }}</label>
          <input
            type="email"
            v-model="registerForm.email"
            placeholder="example@mail.com"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('auth.signup.iWantToBe') }}</label>
          <select v-model="registerForm.role" class="custom-select">
            <option value="client">{{ t('auth.signup.asClient') }}</option>
            <option value="driver">{{ t('auth.signup.asDriver') }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('auth.signup.passwordLabel') }}</label>
          <input
            type="password"
            v-model="registerForm.password"
            :placeholder="t('auth.signup.passwordPlaceholder')"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('auth.signup.passwordConfirmLabel') }}</label>
          <input
            type="password"
            v-model="registerForm.passwordConfirm"
            :placeholder="t('auth.signup.passwordConfirmPlaceholder')"
            required
          >
        </div>

        <button
          type="submit"
          class="btn-submit"
          :disabled="loading"
        >
          {{ loading ? t('auth.signup.creatingAccount') : t('auth.signup.continue') }}
        </button>

        <p class="form-switch">
          {{ t('auth.signup.alreadyHaveAccount') }}
          <span @click="isSignupMode = false" class="switch-link">{{ t('auth.login.submit') }}</span>
        </p>
      </form>
    </div>

    <!-- Login form -->
    <div class="login" :class="{ active: !isSignupMode }">
      <form @submit.prevent="handleLogin">
        <label for="chk" class="form-title">{{ t('auth.login.title') }}</label>

        <div v-if="loginError" class="form-error">
          {{ loginError }}
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('auth.login.emailLabel') }}</label>
          <input
            type="email"
            v-model="loginForm.email"
            :placeholder="t('auth.login.emailPlaceholder')"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('auth.login.passwordLabel') }}</label>
          <input
            type="password"
            v-model="loginForm.password"
            :placeholder="t('auth.login.passwordPlaceholder')"
            required
          >
        </div>

        <button
          type="submit"
          class="btn-submit"
          :disabled="loading"
        >
          {{ loading ? t('auth.login.submitLoading') : t('auth.login.submit') }}
        </button>

        <p class="form-switch">
          {{ t('auth.login.noAccount') }}
          <span @click="isSignupMode = true" class="switch-link">{{ t('auth.signup.title') }}</span>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t } = useI18n()
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
    loginError.value = e.message || t('auth.errors.loginFailed')
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  registerError.value = ''
  if (registerForm.password !== registerForm.passwordConfirm) {
    registerError.value = t('auth.errors.passwordsMismatch')
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

    message.success(t('auth.signup.accountCreated'))
    if (user?.role === 'driver') {
      router.push('/cabinet/driver')
    } else {
      router.push('/cabinet/client')
    }
  } catch (e: any) {
    registerError.value = e.message || t('auth.errors.registerFailed')
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
