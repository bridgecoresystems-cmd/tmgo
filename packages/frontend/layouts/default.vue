<template>
  <n-layout position="absolute" content-style="display: flex; flex-direction: column; min-height: 100vh;">
    <n-layout-header bordered class="header">
      <div class="header-content">
        <div class="logo-container" @click="goHome">
          <img src="/images/logo.png" alt="tmGo Logo" class="logo-img" />
        </div>
        <n-space align="center">
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
      </div>
    </n-layout-header>
    <n-layout-content :class="['main-content', { 'main-content--no-pad-bottom': isIndexPage }]" style="flex: 1;">
      <slot />
    </n-layout-content>
    <n-layout-footer v-if="!isIndexPage" bordered class="footer">
      {{ $t('layout.footer') }}
    </n-layout-footer>
  </n-layout>
</template>

<script setup lang="ts">
const STORAGE_KEY = 'tmgo_i18n_locale'
const VALID_LOCALES = ['ru', 'en', 'tk']

const { session, signOut } = useAuth()
const { locale, setLocale, t } = useI18n()

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && VALID_LOCALES.includes(stored) && stored !== locale.value) {
    setLocale(stored)
  }
})
watch(locale, (v) => {
  if (import.meta.client) localStorage.setItem(STORAGE_KEY, v)
}, { immediate: true })

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
const isIndexPage = computed(() => route.path === '/')

const goHome = () => navigateTo('/')
const goToAuth = (mode: string) => navigateTo(`/auth?mode=${mode}`)

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
  height: 80px;
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
  height: 40px;
  object-fit: contain;
}

.main-content {
  padding-top: 80px;
  padding-bottom: 60px;
}
.main-content--no-pad-bottom {
  padding-bottom: 0;
}

.footer {
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

@media (max-width: 768px) {
  .header {
    padding: 0 20px;
  }
}
</style>
