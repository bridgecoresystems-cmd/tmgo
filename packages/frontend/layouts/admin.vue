<template>
  <n-layout has-sider style="min-height: 100vh;">
    <!-- Mobile backdrop -->
    <Transition name="backdrop-fade">
      <div v-if="mobileSidebarOpen" class="mobile-sider-backdrop" @click="mobileSidebarOpen = false" />
    </Transition>

    <!-- Sider (Sidebar) -->
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="260"
      :collapsed="collapsed"
      show-trigger="arrow-circle"
      class="admin-sider"
      :class="{ 'mobile-open': mobileSidebarOpen }"
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="logo-section" @click="navigateTo('/admin')">
        <img src="/images/logo.png" alt="Logo" class="admin-logo-img" :class="{ 'collapsed': collapsed }" />
        <span v-if="!collapsed" class="logo-text">ADMIN</span>
        <button class="mobile-sider-close" @click.stop="mobileSidebarOpen = false">✕</button>
      </div>
      
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        class="admin-menu"
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>

    <!-- Main Content Area -->
    <n-layout content-style="display: flex; flex-direction: column; min-height: 100vh;">
      <n-layout-header bordered class="admin-header">
        <div class="header-left">
          <button class="mobile-burger" @click="openMobileSidebar">
            <span class="burger-line" />
            <span class="burger-line" />
            <span class="burger-line" />
          </button>
          <n-breadcrumb class="desktop-breadcrumb">
            <n-breadcrumb-item @click="navigateTo('/admin')">{{ t('layout.admin.panel') }}</n-breadcrumb-item>
            <n-breadcrumb-item>{{ pageTitle }}</n-breadcrumb-item>
          </n-breadcrumb>
          <span class="mobile-page-title">{{ pageTitle }}</span>
        </div>
        
        <div class="header-right">
          <n-space align="center" size="large">
            <LanguageSwitcher />
            <n-badge :value="0" dot color="#ff6b4a">
              <n-button quaternary circle size="large">
                <template #icon>🔔</template>
              </n-button>
            </n-badge>
            
            <n-dropdown :options="userMenuOptions" @select="handleUserSelect">
              <div class="user-profile-trigger">
                <img
                  v-if="avatarSrc"
                  :src="avatarSrc"
                  alt=""
                  class="header-avatar-img"
                />
                <n-avatar
                  v-else
                  round
                  size="medium"
                  :style="{ backgroundColor: '#ff6b4a' }"
                >
                  {{ session?.user?.name?.charAt(0) || 'A' }}
                </n-avatar>
                <div class="user-info">
                  <span class="user-name">{{ session?.user?.name || t('layout.admin.administrator') }}</span>
                  <span class="user-role">Super Admin</span>
                </div>
              </div>
            </n-dropdown>
          </n-space>
        </div>
      </n-layout-header>

      <n-layout-content class="admin-content-bg" style="flex: 1;">
        <div class="page-container">
          <div class="page-header">
            <n-h1 class="page-title">{{ pageTitle }}</n-h1>
            <div class="page-actions">
              <slot name="header-actions" />
            </div>
          </div>
          
          <n-card :bordered="false" class="main-card shadow-sm">
            <slot />
          </n-card>
        </div>
      </n-layout-content>
      
      <n-layout-footer bordered class="admin-footer">
        {{ t('layout.admin.footer') }}
      </n-layout-footer>
    </n-layout>
    <ScrollToTopButton />
  </n-layout>
</template>

<script setup lang="ts">
import { h, ref, computed, type Component } from 'vue'
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'
import {
  StatsChartOutline,
  CubeOutline,
  PeopleOutline,
  MailOutline,
  CarOutline,
  SettingsOutline,
  ListOutline,
  LocationOutline,
  PersonRemoveOutline,
  PersonOutline,
  DocumentTextOutline,
  CalendarOutline,
  ChatbubbleOutline,
} from '@vicons/ionicons5'

const { t } = useI18n()
const { session, signOut } = useAuth()
const avatarSrc = computed(() => useAvatarUrl(session.value?.user?.image))
const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const mobileSidebarOpen = ref(false)

function openMobileSidebar() {
  collapsed.value = false
  mobileSidebarOpen.value = true
}

watch(() => route.path, () => { mobileSidebarOpen.value = false })

const activeKey = computed(() => route.path)

const pageTitle = computed(() => {
  if (route.path.startsWith('/admin/legal')) return t('legalDocs.pageTitle')
  if (route.path === '/admin/roadmap') return t('layout.admin.roadmap')
  const titles: Record<string, string> = {
    '/admin': t('layout.admin.dashboard'),
    '/admin/users': t('layout.admin.users'),
    '/admin/mailing': t('layout.admin.mailing'),
    '/admin/cities': t('layout.admin.cities'),
    '/admin/cities/add': t('layout.admin.addCity'),
    '/admin/settings': t('layout.admin.settings'),
    '/admin/settings/deactivated-users': t('layout.admin.deactivatedUsers'),
    '/admin/orders': t('layout.admin.allOrders'),
    '/admin/vehicles': t('layout.admin.vehicles'),
    '/admin/profile': t('layout.admin.profile'),
    '/admin/contacts': t('admin.adminIndex.contactMessages'),
  }
  return titles[route.path] || t('layout.admin.controlPanel')
})

function renderIcon(Icon: Component) {
  return () => h(NIcon, null, { default: () => h(Icon) })
}

const menuOptions = computed<MenuOption[]>(() => [
  { label: t('layout.admin.dashboard'), key: '/admin', icon: renderIcon(StatsChartOutline) },
  { label: t('layout.admin.roadmap'), key: '/admin/roadmap', icon: renderIcon(CalendarOutline) },
  { label: t('layout.admin.orders'), key: '/admin/orders', icon: renderIcon(CubeOutline) },
  { label: t('layout.admin.users'), key: '/admin/users', icon: renderIcon(PeopleOutline) },
  { label: t('layout.admin.mailing'), key: '/admin/mailing', icon: renderIcon(MailOutline) },
  { label: t('layout.admin.vehicles'), key: '/admin/vehicles', icon: renderIcon(CarOutline) },
  { label: t('admin.adminIndex.contactMessages'), key: '/admin/contacts', icon: renderIcon(ChatbubbleOutline) },
  { label: t('layout.admin.legalDocs'), key: '/admin/legal', icon: renderIcon(DocumentTextOutline) },
  {
    label: t('layout.admin.settings'),
    key: 'settings',
    icon: renderIcon(SettingsOutline),
    children: [
      { label: t('layout.admin.overview'), key: '/admin/settings', icon: renderIcon(ListOutline) },
      { label: t('layout.admin.cities'), key: '/admin/cities', icon: renderIcon(LocationOutline) },
      { label: t('layout.admin.deactivatedUsers'), key: '/admin/settings/deactivated-users', icon: renderIcon(PersonRemoveOutline) },
    ],
  },
  { label: t('layout.admin.profile'), key: '/admin/profile', icon: renderIcon(PersonOutline) },
])

const userMenuOptions = computed(() => [
  { label: t('layout.home'), key: 'home' },
  { label: t('layout.logout'), key: 'logout' },
])

function handleMenuSelect(key: string) {
  if (key.startsWith('/')) {
    navigateTo(key)
  }
}

async function handleUserSelect(key: string) {
  if (key === 'logout') {
    await signOut()
    navigateTo('/auth')
  } else if (key === 'home') {
    navigateTo('/landing')
  }
}
</script>

<style scoped>
.admin-sider {
  background: #fff;
  box-shadow: 2px 0 8px rgba(0,0,0,0.05);
  z-index: 10;
}

.logo-section {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
}

.admin-logo-img {
  height: 32px;
  transition: all 0.3s ease;
}

.admin-logo-img.collapsed {
  height: 24px;
}

.logo-text {
  font-weight: 800;
  font-size: 18px;
  color: #ff6b4a;
  letter-spacing: 1px;
}

.admin-header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  position: sticky;
  top: 0;
  z-index: 100;
}

.user-profile-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.3s;
}

.user-profile-trigger:hover {
  background: #f5f5f5;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  color: #999;
}

.admin-content-bg {
  background: #f8f9fa;
  padding: 24px;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.main-card {
  border-radius: 16px;
  min-height: 400px;
}

.shadow-sm {
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}

.admin-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #999;
  font-size: 12px;
}

.admin-menu :deep(.n-menu-item-content) {
  border-radius: 8px;
  margin: 4px 8px;
}

.header-avatar-img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

/* ── Burger button ──────────────────────────── */
.mobile-burger {
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
  flex-shrink: 0;
  transition: background 0.2s;
}
.mobile-burger:hover { background: #f5f5f5; }
.burger-line {
  display: block;
  width: 20px;
  height: 2px;
  background: #1a1a1a;
  border-radius: 2px;
}

/* ── Close button inside sider (mobile) ─────── */
.mobile-sider-close {
  display: none;
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  color: #bbb;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  line-height: 1;
  flex-shrink: 0;
}
.mobile-sider-close:hover { color: #444; }

/* ── Mobile backdrop ───────────��────────────── */
.mobile-sider-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: 199;
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active { transition: opacity 0.25s ease; }
.backdrop-fade-enter-from,
.backdrop-fade-leave-to { opacity: 0; }

/* ── Mobile breakpoint ──────────────────────── */
@media (max-width: 900px) {
  .mobile-burger { display: flex; }
  .mobile-sider-close { display: block; }

  /* Sider becomes a fixed drawer */
  .admin-sider {
    position: fixed !important;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100vh !important;
    max-height: 100vh !important;
    z-index: 200;
    width: 260px !important;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: none;
  }

  .admin-sider.mobile-open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
  }

  /* Hide NaiveUI's built-in collapse arrow trigger */
  .admin-sider :deep(.n-layout-sider__trigger) {
    display: none !important;
  }

  .admin-header { padding: 0 12px; }
  .user-info { display: none; }
  .admin-content-bg { padding: 12px; }
  .desktop-breadcrumb { display: none; }
  .mobile-page-title { display: block; }
}

.mobile-page-title {
  display: none;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
