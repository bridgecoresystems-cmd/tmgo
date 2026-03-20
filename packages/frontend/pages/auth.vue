<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-main">
      <!-- Hidden checkbox for mode toggle via v-model -->
      <input 
        type="checkbox" 
        id="chk" 
        v-model="isSignupMode"
        aria-hidden="true"
      >
      
      <!-- Signup form -->
      <div class="signup" :class="{ active: isSignupMode }">
        <form @submit.prevent="handleRegister">
          <label for="chk" class="form-title">{{ $t('auth.signup.title') }}</label>

          <div v-if="registerError" class="form-error">
            {{ registerError }}
          </div>
          
          <div class="form-group">
            <label class="form-label">{{ $t('auth.signup.emailLabel') }}</label>
            <input 
              type="email" 
              v-model="registerForm.email"
              :placeholder="$t('auth.signup.emailPlaceholder')" 
              required 
            >
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('auth.signup.roleLabel') }}</label>
            <select v-model="registerForm.role" class="custom-select">
              <option value="client">{{ $t('auth.signup.roleClient') }}</option>
              <option value="driver">{{ $t('auth.signup.roleDriver') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('auth.signup.passwordLabel') }}</label>
            <n-input
              v-model:value="registerForm.password"
              type="password"
              show-password-on="click"
              :placeholder="$t('auth.signup.passwordPlaceholder')"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('auth.signup.passwordConfirmLabel') }}</label>
            <n-input
              v-model:value="registerForm.passwordConfirm"
              type="password"
              show-password-on="click"
              :placeholder="$t('auth.signup.passwordConfirmPlaceholder')"
              required
            />
          </div>

          <button 
            type="submit" 
            class="btn-submit"
            :disabled="loading"
          >
            {{ loading ? $t('auth.signup.submitLoading') : $t('auth.signup.submit') }}
          </button>
          
          <p class="form-switch">
            {{ $t('auth.signup.alreadyHave') }}
            <span @click="navigateTo('/auth?mode=login')" class="switch-link">{{ $t('auth.signup.loginLink') }}</span>
          </p>
          <p class="form-legal">
            {{ $t('auth.signup.agreementPrefix') }}
            <NuxtLink to="/legal/agreement" target="_blank" class="legal-link">{{ $t('auth.agreement') }}</NuxtLink>
          </p>
        </form>
      </div>

      <!-- Login form -->
      <div class="login" :class="{ active: !isSignupMode }">
        <form @submit.prevent="handleLogin">
          <label for="chk" class="form-title">{{ $t('auth.login.title') }}</label>

          <div v-if="loginError" class="form-error">
            {{ loginError }}
          </div>
          
          <div class="form-group">
            <label class="form-label">{{ $t('auth.login.emailLabel') }}</label>
          <input 
            type="email" 
            v-model="loginForm.email"
            :placeholder="$t('auth.login.emailPlaceholder')"
            @input="loginError = ''"
            required 
          >
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('auth.login.passwordLabel') }}</label>
            <n-input
              v-model:value="loginForm.password"
              type="password"
              show-password-on="click"
              :placeholder="$t('auth.login.passwordPlaceholder')"
              @update:value="loginError = ''"
              required
            />
          </div>

          <button 
            type="submit" 
            class="btn-submit"
            :disabled="loading"
          >
            {{ loading ? $t('auth.login.submitLoading') : $t('auth.login.submit') }}
          </button>
          
          <p class="form-switch">
            {{ $t('auth.login.noAccount') }} 
            <span @click="navigateTo('/auth?mode=signup')" class="switch-link">{{ $t('auth.login.signupLink') }}</span>
          </p>
        </form>
      </div>
      </div>
    </div>

    <footer class="page-footer">{{ $t('layout.footer') }}</footer>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'default' })

const { signIn, signUp } = useAuth()
const route = useRoute()
const message = useMessage()
const { t } = useI18n()

const isSignupMode = ref(route.query.mode === 'signup')
const loading = ref(false)
const loginError = ref('')
const registerError = ref('')

watch(() => route.query.mode, (mode) => {
  isSignupMode.value = mode === 'signup'
  loginError.value = ''
  registerError.value = ''
}, { immediate: true })

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
    if (user?.role === 'admin') {
      await navigateTo('/admin')
    } else if (user?.role === 'driver') {
      await navigateTo('/cabinet/driver')
    } else {
      await navigateTo('/cabinet/client')
    }
  } catch (e: any) {
    const is429 = e?.isRateLimited || e?.statusCode === 429 || e?.status === 429 || e?.response?.status === 429
    if (is429) {
      throw createError({ statusCode: 429, fatal: true })
    }
    const msg = e?.message || ''
    if (msg.toLowerCase().includes('failed to fetch') || msg.includes('network')) {
      message.error(t('auth.errors.serverUnavailable'))
    } else {
      loginError.value = msg || t('auth.errors.loginFailed')
    }
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
      message.error(t('auth.errors.serverUnavailableShort'))
    } else {
      registerError.value = msg || t('auth.errors.registerFailed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Липкий футер: на высоком экране — внизу viewport; если контент выше экрана — скролл, футер после формы. */
.auth-page {
  display: flex;
  flex-direction: column;
  /* высота контента под хедером лейаута (80px, см. layouts/default.vue) */
  min-height: calc(100vh - 80px);
  min-height: calc(100dvh - 80px);
  box-sizing: border-box;
}

.auth-container {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.page-footer {
  flex-shrink: 0;
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0px));
  min-height: 60px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  font-size: 14px;
  color: #666;
}

.auth-main {
  width: 100%;
  max-width: 450px;
  background: #f5f6f8; /* Gray block for form */  
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
  padding: 25px 35px;
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
  font-size: 22px;
  font-weight: 800;
  color: #ff6b4a;
  margin-bottom: 15px;
  text-align: center;
  display: block;
}

.form-group {
  margin-bottom: 10px;
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

.form-group :deep(.n-input) {
  width: 100%;
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

.form-legal {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}

.legal-link {
  color: #aaa;
  text-decoration: underline;
}

.legal-link:hover {
  color: #ff6b4a;
}

/* Узкий по высоте экран: форма сверху, футер внизу после скролла — ничего не обрезаем */
@media (max-height: 720px) {
  .auth-container {
    align-items: flex-start;
    padding-top: 16px;
  }
}
</style>
