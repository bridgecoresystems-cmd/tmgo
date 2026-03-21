<template>
  <div class="auth-page">
    <div class="auth-wrapper">
      <div class="auth-card">

        <!-- Left: Brand panel -->
        <div class="brand-panel">
          <div class="shape shape-1" />
          <div class="shape shape-2" />
          <div class="shape shape-3" />
          <div class="shape shape-4" />

          <div class="brand-inner">
            <div class="brand-logo">
              <svg viewBox="0 0 32 32" fill="none" class="logo-icon">
                <rect width="32" height="32" rx="10" fill="rgba(255,255,255,0.2)"/>
                <path d="M6 20 Q10 12 16 12 Q22 12 26 20" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <circle cx="10" cy="21" r="2.5" fill="white"/>
                <circle cx="22" cy="21" r="2.5" fill="white"/>
                <rect x="5" y="18" width="22" height="4" rx="2" fill="rgba(255,255,255,0.3)"/>
              </svg>
              <span class="logo-text">TMGO</span>
            </div>

            <Transition name="brand-msg" mode="out-in">
              <div v-if="!isSignupMode" key="lmsg" class="brand-msg">
                <h2>{{ $t('auth.brand.loginTitle') }}</h2>
                <p>{{ $t('auth.brand.loginSubtitle') }}</p>
              </div>
              <div v-else key="smsg" class="brand-msg">
                <h2>{{ $t('auth.brand.signupTitle') }}</h2>
                <p>{{ $t('auth.brand.signupSubtitle') }}</p>
              </div>
            </Transition>

            <div class="brand-toggle">
              <p>{{ isSignupMode ? $t('auth.signup.alreadyHave') : $t('auth.login.noAccount') }}</p>
              <button class="brand-btn" type="button" @click="isSignupMode = !isSignupMode">
                {{ isSignupMode ? $t('auth.signup.loginLink') : $t('auth.login.signupLink') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Form panel -->
        <div class="form-panel">
          <Transition name="form-slide" mode="out-in">

            <!-- Login -->
            <form v-if="!isSignupMode" key="login" @submit.prevent="handleLogin" class="auth-form" novalidate>
              <h3 class="form-heading">{{ $t('auth.login.title') }}</h3>
              <p class="form-subheading">{{ $t('auth.login.subheading') }}</p>

              <div v-if="loginError" class="form-error">{{ loginError }}</div>

              <div class="field">
                <label>{{ $t('auth.login.emailLabel') }}</label>
                <div class="input-wrap">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M4 8l8 5 8-5M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <input
                    type="email"
                    v-model="loginForm.email"
                    :placeholder="$t('auth.login.emailPlaceholder')"
                    @input="loginError = ''"
                    required
                  />
                </div>
              </div>

              <div class="field">
                <label>{{ $t('auth.login.passwordLabel') }}</label>
                <div class="input-wrap input-wrap--ninput">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                  <n-input
                    v-model:value="loginForm.password"
                    type="password"
                    show-password-on="click"
                    :placeholder="$t('auth.login.passwordPlaceholder')"
                    @update:value="loginError = ''"
                    required
                  />
                </div>
              </div>

              <button type="submit" class="btn-submit" :disabled="loading">
                <svg v-if="loading" class="btn-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>
                  <path d="M12 3a9 9 0 019 9" stroke="white" stroke-width="3" stroke-linecap="round"/>
                </svg>
                {{ loading ? $t('auth.login.submitLoading') : $t('auth.login.submit') }}
              </button>

              <p class="form-alt">
                {{ $t('auth.login.noAccount') }}
                <span class="form-alt-link" @click="isSignupMode = true">{{ $t('auth.login.signupLink') }}</span>
              </p>
            </form>

            <!-- Signup -->
            <form v-else key="signup" @submit.prevent="handleRegister" class="auth-form" novalidate>
              <h3 class="form-heading">{{ $t('auth.signup.title') }}</h3>
              <p class="form-subheading">{{ $t('auth.signup.subheading') }}</p>

              <div v-if="registerError" class="form-error">{{ registerError }}</div>

              <div class="field">
                <label>{{ $t('auth.signup.emailLabel') }}</label>
                <div class="input-wrap">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M4 8l8 5 8-5M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <input type="email" v-model="registerForm.email" :placeholder="$t('auth.signup.emailPlaceholder')" required />
                </div>
              </div>

              <div class="field">
                <label>{{ $t('auth.signup.roleLabel') }}</label>
                <div class="input-wrap">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.6"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                  <select v-model="registerForm.role" class="native-select">
                    <option value="client">{{ $t('auth.signup.roleClient') }}</option>
                    <option value="driver">{{ $t('auth.signup.roleDriver') }}</option>
                  </select>
                  <svg class="select-chevron" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1l5 5 5-5" stroke="#999" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>

              <div class="field">
                <label>{{ $t('auth.signup.passwordLabel') }}</label>
                <div class="input-wrap input-wrap--ninput">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                  <n-input v-model:value="registerForm.password" type="password" show-password-on="click" :placeholder="$t('auth.signup.passwordPlaceholder')" required />
                </div>
              </div>

              <div class="field">
                <label>{{ $t('auth.signup.passwordConfirmLabel') }}</label>
                <div class="input-wrap input-wrap--ninput">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                  <n-input v-model:value="registerForm.passwordConfirm" type="password" show-password-on="click" :placeholder="$t('auth.signup.passwordConfirmPlaceholder')" required />
                </div>
              </div>

              <button type="submit" class="btn-submit" :disabled="loading">
                <svg v-if="loading" class="btn-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>
                  <path d="M12 3a9 9 0 019 9" stroke="white" stroke-width="3" stroke-linecap="round"/>
                </svg>
                {{ loading ? $t('auth.signup.submitLoading') : $t('auth.signup.submit') }}
              </button>

              <p class="form-alt">
                {{ $t('auth.signup.alreadyHave') }}
                <span class="form-alt-link" @click="isSignupMode = false">{{ $t('auth.signup.loginLink') }}</span>
              </p>
              <p class="form-legal">
                {{ $t('auth.signup.agreementPrefix') }}
                <NuxtLink to="/legal/agreement" target="_blank" class="legal-link">{{ $t('auth.agreement') }}</NuxtLink>
              </p>
            </form>

          </Transition>
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

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({ email: '', password: '', passwordConfirm: '', role: 'client' })

const handleLogin = async () => {
  loginError.value = ''
  loading.value = true
  try {
    const user = await signIn(loginForm.email, loginForm.password)
    if (user?.role === 'admin') await navigateTo('/admin')
    else if (user?.role === 'driver') await navigateTo('/cabinet/driver')
    else await navigateTo('/cabinet/client')
  } catch (e: any) {
    const is429 = e?.isRateLimited || e?.statusCode === 429 || e?.status === 429 || e?.response?.status === 429
    if (is429) throw createError({ statusCode: 429, fatal: true })
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
    if (user?.role === 'admin') await navigateTo('/admin')
    else if (user?.role === 'driver') await navigateTo('/cabinet/driver')
    else await navigateTo('/cabinet/client')
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
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

/* ─── Page ─────────────────────────────────── */
.auth-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 80px);
  min-height: calc(100dvh - 80px);
  box-sizing: border-box;
  background: #f0f2f5;
  font-family: 'Poppins', sans-serif;
}

.auth-wrapper {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 16px;
  box-sizing: border-box;
}

/* ─── Card ──────────────────────────────────── */
.auth-card {
  display: flex;
  width: 100%;
  max-width: 860px;
  min-height: 520px;
  border-radius: 28px;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.06);
}

/* ─── Brand panel ───────────────────────────── */
.brand-panel {
  position: relative;
  width: 40%;
  flex-shrink: 0;
  background: linear-gradient(145deg, #ff6b4a 0%, #ff9a3c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 40px 32px;
  box-sizing: border-box;
}

/* Animated floating shapes */
.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}
.shape-1 {
  width: 220px; height: 220px;
  top: -70px; right: -70px;
  animation: float1 7s ease-in-out infinite;
}
.shape-2 {
  width: 140px; height: 140px;
  bottom: -30px; left: -50px;
  animation: float2 9s ease-in-out infinite;
}
.shape-3 {
  width: 80px; height: 80px;
  bottom: 100px; right: 20px;
  animation: float1 5.5s ease-in-out infinite 1.5s;
  background: rgba(255, 255, 255, 0.08);
}
.shape-4 {
  width: 50px; height: 50px;
  top: 80px; left: 24px;
  animation: float2 6s ease-in-out infinite 0.8s;
  background: rgba(255, 255, 255, 0.15);
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(8px, -12px) scale(1.04); }
  66%       { transform: translate(-5px, 6px) scale(0.97); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50%       { transform: translate(-10px, 14px) rotate(12deg); }
}

.brand-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  color: #fff;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}
.logo-text {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #fff;
}

.brand-msg h2 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px;
  line-height: 1.3;
  color: #fff;
}
.brand-msg p {
  font-size: 13px;
  font-weight: 400;
  margin: 0;
  opacity: 0.85;
  line-height: 1.6;
  color: #fff;
}

.brand-toggle {
  margin-top: 8px;
}
.brand-toggle p {
  font-size: 12px;
  opacity: 0.8;
  margin: 0 0 10px;
  color: #fff;
}
.brand-btn {
  display: inline-block;
  padding: 8px 22px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 50px;
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 600;
  background: transparent;
  cursor: pointer;
  transition: background 0.25s, color 0.25s;
}
.brand-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* brand-msg transition */
.brand-msg-enter-active,
.brand-msg-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.brand-msg-enter-from   { opacity: 0; transform: translateY(10px); }
.brand-msg-leave-to     { opacity: 0; transform: translateY(-10px); }

/* ─── Form panel ────────────────────────────── */
.form-panel {
  flex: 1;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.auth-form {
  width: 100%;
  padding: 40px 44px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.form-heading {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 4px;
}
.form-subheading {
  font-size: 13px;
  color: #9a9a9a;
  margin: 0 0 20px;
  font-weight: 400;
}

.form-error {
  padding: 9px 14px;
  margin-bottom: 14px;
  background: #fff0f0;
  border-left: 3px solid #ff4444;
  border-radius: 8px;
  color: #cc0000;
  font-size: 13px;
}

/* Fields */
.field {
  margin-bottom: 12px;
}
.field > label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 5px;
  letter-spacing: 0.3px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 13px;
  width: 16px;
  height: 16px;
  color: #bbb;
  pointer-events: none;
  z-index: 1;
  flex-shrink: 0;
}

/* Native inputs */
.input-wrap input,
.input-wrap .native-select {
  width: 100%;
  height: 44px;
  padding: 0 14px 0 38px;
  border: 1.5px solid #ebebeb;
  border-radius: 12px;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: #222;
  background: #f9f9fb;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.input-wrap input:focus,
.input-wrap .native-select:focus {
  border-color: #ff6b4a;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(255, 107, 74, 0.1);
}
.input-wrap input::placeholder {
  color: #c5c5c5;
}

/* Select */
.native-select {
  appearance: none;
  cursor: pointer;
  padding-right: 36px !important;
}
.select-chevron {
  position: absolute;
  right: 12px;
  width: 12px;
  height: 8px;
  pointer-events: none;
}

/* n-input wrapper */
.input-wrap--ninput {
  align-items: stretch;
}
.input-wrap--ninput .input-icon {
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}
.input-wrap--ninput :deep(.n-input) {
  width: 100%;
  font-family: 'Poppins', sans-serif;
  --n-border-radius: 12px;
  --n-height: 44px;
  --n-font-size: 13px;
  --n-color: #f9f9fb;
  --n-color-focus: #fff;
  --n-border: 1.5px solid #ebebeb;
  --n-border-hover: 1.5px solid #ff6b4a;
  --n-border-focus: 1.5px solid #ff6b4a;
  --n-box-shadow-focus: 0 0 0 3px rgba(255, 107, 74, 0.1);
  --n-placeholder-color: #c5c5c5;
}
.input-wrap--ninput :deep(.n-input__input-el),
.input-wrap--ninput :deep(.n-input__placeholder) {
  padding-left: 38px !important;
}

/* Submit button */
.btn-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 46px;
  margin-top: 6px;
  background: linear-gradient(135deg, #ff6b4a 0%, #ff9a3c 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
  box-shadow: 0 4px 14px rgba(255, 107, 74, 0.4);
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 107, 74, 0.45);
}
.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}
.btn-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}
.btn-spin {
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-alt {
  text-align: center;
  margin-top: 16px;
  font-size: 12.5px;
  color: #aaa;
}
.form-alt-link {
  color: #ff6b4a;
  font-weight: 600;
  cursor: pointer;
  margin-left: 4px;
}
.form-alt-link:hover { text-decoration: underline; }

.form-legal {
  text-align: center;
  margin-top: 10px;
  font-size: 11.5px;
  color: #ccc;
}
.legal-link {
  color: #bbb;
  text-decoration: underline;
}
.legal-link:hover { color: #ff6b4a; }

/* form transition */
.form-slide-enter-active,
.form-slide-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.form-slide-enter-from   { opacity: 0; transform: translateX(16px); }
.form-slide-leave-to     { opacity: 0; transform: translateX(-16px); }

/* ─── Footer ────────────────────────────────── */
.page-footer {
  flex-shrink: 0;
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0px));
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  color: #bbb;
}

/* ─── Responsive ────────────────────────────── */
@media (max-width: 700px) {
  .auth-card {
    flex-direction: column;
    border-radius: 20px;
    min-height: unset;
  }
  .brand-panel {
    width: 100%;
    padding: 28px 24px;
    min-height: unset;
  }
  .brand-inner {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .brand-msg { display: none; }
  .brand-toggle { margin-top: 0; }
  .shape-1 { width: 160px; height: 160px; }
  .shape-2 { display: none; }
  .auth-form {
    padding: 28px 24px;
  }
}

@media (max-height: 680px) {
  .auth-wrapper { align-items: flex-start; padding-top: 16px; }
}
</style>
