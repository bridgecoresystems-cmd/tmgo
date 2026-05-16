<template>
  <n-layout class="tmgo-public-layout" content-style="display: flex; flex-direction: column; min-height: 100vh;">
    <n-layout-header bordered class="header">
      <div class="header-content">
        <div class="logo-container" @click="goHome">
          <img src="/images/logo.png" alt="tmGo Logo" class="logo-img" />
        </div>
        <n-space align="center" class="nav-links" :size="32">
          <n-button quaternary @click="navTo('/landing')">{{ $t('layout.home') }}</n-button>
          <n-button quaternary @click="navTo('/landing/search')">{{ $t('layout.search') }}</n-button>
          <n-button quaternary @click="navTo('/landing/contacts')">{{ $t('layout.contacts') }}</n-button>
        </n-space>
        <n-space align="center" class="desktop-actions">
          <n-select
            :value="locale"
            :options="localeOptions"
            size="small"
            :consistent-menu-width="false"
            style="width: 130px"
            @update:value="(v) => setLocale(v)"
          />
          <template v-if="!session?.user">
            <n-button quaternary @click="goToAuth('login')">{{ $t('layout.login') }}</n-button>
            <n-button type="primary" @click="goToAuth('signup')">{{ $t('layout.signup') }}</n-button>
          </template>
          <template v-else>
            <n-dropdown :options="userOptions" @select="handleUserSelect">
              <n-button quaternary class="user-btn">{{ session.user.name || session.user.email }}</n-button>
            </n-dropdown>
          </template>
        </n-space>

        <!-- Burger button (mobile only) -->
        <button class="burger-btn" :class="{ open: mobileMenuOpen }" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Menu">
          <span class="burger-line" />
          <span class="burger-line" />
          <span class="burger-line" />
        </button>
      </div>
    </n-layout-header>

    <!-- Mobile slide-down menu (fixed overlay) -->
    <Transition name="mobile-menu">
      <div v-if="mobileMenuOpen" class="mobile-menu-overlay">
        <div class="mobile-menu-panel">
          <nav class="mobile-nav">
            <button class="mobile-nav-item" @click="navTo('/landing')">{{ $t('layout.home') }}</button>
            <button class="mobile-nav-item" @click="navTo('/landing/search')">{{ $t('layout.search') }}</button>
            <button class="mobile-nav-item" @click="navTo('/landing/contacts')">{{ $t('layout.contacts') }}</button>
          </nav>
          <div class="mobile-menu-controls">
            <n-select
              :value="locale"
              :options="localeOptions"
              size="small"
              :consistent-menu-width="false"
              style="width: 100%"
              @update:value="(v) => setLocale(v)"
            />
            <template v-if="!session?.user">
              <div class="mobile-auth-row">
                <n-button block quaternary @click="navGoToAuth('login')">{{ $t('layout.login') }}</n-button>
                <n-button block type="primary" @click="navGoToAuth('signup')">{{ $t('layout.signup') }}</n-button>
              </div>
            </template>
            <template v-else>
              <n-button block quaternary class="user-btn" @click="navProfile">
                {{ session.user.name || session.user.email }}
              </n-button>
              <n-button block @click="navLogout">{{ $t('layout.logout') }}</n-button>
            </template>
          </div>
        </div>
        <div class="mobile-menu-backdrop" @click="mobileMenuOpen = false" />
      </div>
    </Transition>

    <n-layout-content :class="['main-content', { 'main-content--no-pad-bottom': pageHasOwnFooter }]">
      <slot />
    </n-layout-content>
    <!-- Скрываем на /, /auth, /legal/*: футер внутри страницы (липкий низ экрана / низ документа) -->
    <n-layout-footer v-if="!pageHasOwnFooter" bordered class="footer">
      {{ $t('layout.footer') }}
    </n-layout-footer>
  </n-layout>
</template>

<script setup lang="ts">
const { session, signOut } = useAuth()
const { locale, setLocale, t } = useI18n()

const localeOptions = [
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
  { label: 'Türkmençe', value: 'tk' },
]

const userOptions = computed(() => [
  { label: t('layout.profile'), key: 'profile' },
  { label: t('layout.logout'), key: 'logout' }
])

const route = useRoute()
const pageHasOwnFooter = computed(
  () => route.path === '/' || route.path === '/landing' || route.path === '/auth' || route.path.startsWith('/legal/'),
)

const mobileMenuOpen = ref(false)
watch(() => route.path, () => { mobileMenuOpen.value = false })

const goHome = () => navigateTo('/')
const goToAuth = (mode: string) => navigateTo(`/auth?mode=${mode}`)

const navTo = (path: string) => {
  mobileMenuOpen.value = false
  navigateTo(path)
}

const navGoToAuth = (mode: string) => {
  mobileMenuOpen.value = false
  navigateTo(`/auth?mode=${mode}`)
}

const navProfile = () => {
  mobileMenuOpen.value = false
  const role = session.value?.user?.role
  if (role === 'admin') navigateTo('/admin')
  else if (role === 'driver') navigateTo('/cabinet/driver')
  else navigateTo('/cabinet/client')
}

const navLogout = async () => {
  mobileMenuOpen.value = false
  await signOut()
  navigateTo('/auth')
}

const handleUserSelect = async (key: string) => {
  if (key === 'logout') {
    await signOut()
    navigateTo('/auth')
  } else if (key === 'profile') {
    const role = session.value?.user?.role
    if (role === 'admin') navigateTo('/admin')
    else if (role === 'driver') navigateTo('/cabinet/driver')
    else navigateTo('/cabinet/client')
  }
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
  height: 64px;
  padding: 0 40px;
  display: flex;
  align-items: center;
  background: #fff;
}

.header-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-container {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.logo-img {
  height: 36px;
  object-fit: contain;
}

.main-content {
  flex: 1;
  padding-top: 0;
  padding-bottom: 0;
}
.main-content--no-pad-bottom {
  padding-bottom: 0;
}

.footer {
  flex-shrink: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
}

.user-btn {
  border: 1px solid #f97316;
  border-radius: 6px;
}

/* ── Burger ─────────────────────────────────────────── */
.burger-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.2s;
}

.burger-btn:hover { background: #f5f5f5; }

.burger-line {
  display: block;
  width: 22px;
  height: 2px;
  background: #1a1a1a;
  border-radius: 2px;
  transition: transform 0.25s ease, opacity 0.25s ease;
  transform-origin: center;
}

.burger-btn.open .burger-line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.burger-btn.open .burger-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
.burger-btn.open .burger-line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ── Mobile menu overlay (fixed) ────────────────────── */
.mobile-menu-overlay {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
  display: flex;
  flex-direction: column;
}

.mobile-menu-panel {
  background: #fff;
  padding: 8px 0 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
}

.mobile-nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: none;
  border: none;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.mobile-nav-item:hover { background: #fafafa; }
.mobile-nav-item:last-child { border-bottom: none; }

.mobile-menu-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 24px 4px;
  border-top: 1px solid #f0f0f0;
}

.mobile-auth-row {
  display: flex;
  gap: 10px;
}

.mobile-menu-backdrop {
  flex: 1;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
}

/* ── Transition ─────────────────────────────────────── */
.mobile-menu-enter-active {
  animation: menuSlideIn 0.22s ease-out;
}
.mobile-menu-leave-active {
  animation: menuSlideOut 0.18s ease-in;
}

@keyframes menuSlideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes menuSlideOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-10px); }
}

/* ── Breakpoints ────────────────────────────────────── */
@media (max-width: 900px) {
  .nav-links { display: none !important; }
  .desktop-actions { display: none !important; }
  .burger-btn { display: flex; }
}

@media (max-width: 768px) {
  .header { padding: 0 16px; }
}
</style>
