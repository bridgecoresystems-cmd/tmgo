<template>
  <n-layout has-sider style="min-height: 100vh;">
    <!-- Mobile backdrop -->
    <Transition name="backdrop-fade">
      <div v-if="mobileSidebarOpen" class="mobile-sider-backdrop" @click="mobileSidebarOpen = false" />
    </Transition>

    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger="arrow-circle"
      class="cabinet-sider"
      :class="{ 'mobile-open': mobileSidebarOpen }"
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="logo-section" @click="navigateTo('/cabinet/driver')">
        <img src="/images/logo.png" alt="Logo" class="logo-img" :class="{ 'collapsed': collapsed }" />
        <button class="mobile-sider-close" @click.stop="mobileSidebarOpen = false">✕</button>
      </div>
      <n-menu
        :collapsed="collapsed"
        :options="menuOptions"
        :value="activeKey"
        v-model:expanded-keys="expandedKeys"
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>

    <n-layout content-style="display: flex; flex-direction: column; min-height: 100vh;">
      <ImpersonateBanner />
      <n-layout-header bordered class="cabinet-header">
        <div class="header-left">
          <button class="mobile-burger" @click="openMobileSidebar">
            <span class="burger-line" />
            <span class="burger-line" />
            <span class="burger-line" />
          </button>
          <n-text strong class="header-title">{{ t('layout.cabinet.title') }} {{ t('layout.cabinet.roleDriver') }}</n-text>
        </div>
        <div class="header-right">
          <n-space align="center" style="gap: 12px">
            <LanguageSwitcher />
            <DriverOnlineStatusToggle v-if="session?.user?.role === 'driver'" />
            <DriverRatingBadge v-if="session?.user?.role === 'driver'" />
            <VerificationBadge v-if="verificationStatus" :status="verificationStatus" />
            <n-dropdown :options="userMenuOptions" @select="handleUserSelect">
              <n-space align="center" style="cursor: pointer">
                <img
                  v-if="avatarSrc"
                  :src="avatarSrc"
                  alt=""
                  class="header-avatar-img"
                />
                <n-avatar
                  v-else
                  round
                  size="small"
                  :style="{ backgroundColor: '#ff6b4a' }"
                >
                  {{ session?.user?.name?.charAt(0) || 'U' }}
                </n-avatar>
                <n-text v-if="!collapsed" class="user-name-text">{{ session?.user?.name }}</n-text>
              </n-space>
            </n-dropdown>
          </n-space>
        </div>
      </n-layout-header>

      <n-layout-content class="cabinet-content" style="flex: 1;">
        <div class="content-container">
          <slot />
        </div>
      </n-layout-content>

      <n-layout-footer bordered class="cabinet-footer">
        &copy; 2026 BridgeCore Systems | TMGO Logistics Platform
      </n-layout-footer>
    </n-layout>
  </n-layout>

  <DriverChatButton ref="chatBtnRef" />
  <ChatWidget
    :model-value="chatOpen"
    :order-id="chatOrderId"
    :carrier-id="chatCarrierId"
    :title="chatTitle"
    :current-user-id="session?.user?.id"
    :show-back="true"
    @close="closeChat"
    @back="handleChatBack"
  />
  <ScrollToTopButton />
</template>

<script setup lang="ts">
import { h, ref, computed, type Component } from 'vue'
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'
import { NBadge } from 'naive-ui'
import {
  HomeOutline,
  IdCardOutline,
  CarOutline,
  CubeOutline,
  ClipboardOutline,
  MapOutline,
  MailOutline,
  PersonOutline,
  AlertCircleOutline,
} from '@vicons/ionicons5'

const { t } = useI18n()
const { session, signOut } = useAuth()
const avatarSrc = computed(() => useAvatarUrl(session.value?.user?.image))
const { chatOpen, chatOrderId, chatCarrierId, chatTitle, closeChat } = useOrderChat()
const chatBtnRef = ref<{ openPicker: () => void } | null>(null)
const mobileSidebarOpen = ref(false)

function openMobileSidebar() {
  collapsed.value = false
  mobileSidebarOpen.value = true
}

async function handleChatBack() {
  await closeChat()
  chatBtnRef.value?.openPicker()
}

const { status: verificationStatus } = useDriverVerificationStatus()
const { count: alertsCount, fetchAlerts } = useDriverAlerts()
const route = useRoute()
const collapsed = ref(false)

const activeKey = computed(() => route.path)

watch(() => route.path, () => { mobileSidebarOpen.value = false })

onMounted(() => {
  fetchAlerts()
})

function renderIcon(Icon: Component) {
  return () => h(NIcon, null, { default: () => h(Icon) })
}

function renderAlertsLabel() {
  const label = h('span', t('layout.cabinet.menuAlerts'))
  if (alertsCount.value > 0) {
    return h('div', { class: 'menu-item-with-badge' }, [
      label,
      h(NBadge, { value: alertsCount.value, max: 99, type: 'error', offset: [4, 0] }),
    ])
  }
  return label
}

const cardSubmenuKeys = ['/cabinet/driver/my-card', '/cabinet/driver/card-v2', '/cabinet/driver/add-documents']
const expandedKeys = ref<string[]>([])

watch(
  () => route.path,
  (path) => {
    if (cardSubmenuKeys.some((k) => path === k || path.startsWith(k + '/'))) {
      if (!expandedKeys.value.includes('card-driver')) {
        expandedKeys.value = [...expandedKeys.value, 'card-driver']
      }
    }
  },
  { immediate: true }
)

const menuOptions = computed<MenuOption[]>(() => [
  { label: t('layout.cabinet.menuHome'), key: '/cabinet/driver', icon: renderIcon(HomeOutline) },
  {
    label: t('layout.cabinet.menuDriverCard'),
    key: 'card-driver',
    icon: renderIcon(IdCardOutline),
    children: [
      { label: t('layout.cabinet.menuMyCard'), key: '/cabinet/driver/my-card' },
      { label: t('layout.cabinet.menuVerification'), key: '/cabinet/driver/card-v2' },
      { label: t('layout.cabinet.menuAddDocuments'), key: '/cabinet/driver/add-documents' },
    ],
  },
  { label: () => renderAlertsLabel(), key: '/cabinet/driver/alerts', icon: renderIcon(AlertCircleOutline) },
  { label: t('layout.cabinet.menuMyVehicles'), key: '/cabinet/driver/vehicles', icon: renderIcon(CarOutline) },
  { label: t('layout.cabinet.menuMyOrders'), key: '/cabinet/driver/orders', icon: renderIcon(CubeOutline) },
  { label: t('layout.cabinet.menuAvailableOrders'), key: '/cabinet/driver/orders/available', icon: renderIcon(ClipboardOutline) },
  { label: t('layout.cabinet.menuMyServices'), key: '/cabinet/driver/services', icon: renderIcon(MapOutline) },
  { label: t('layout.cabinet.menuMailing'), key: '/cabinet/driver/mailing', icon: renderIcon(MailOutline) },
  { label: t('layout.cabinet.menuProfile'), key: '/cabinet/driver/profile', icon: renderIcon(PersonOutline) },
])

const userMenuOptions = computed(() => [
  { label: t('layout.home'), key: 'home' },
  { label: t('layout.logout'), key: 'logout' },
])

function handleMenuSelect(key: string) {
  navigateTo(key)
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
.cabinet-sider {
  background: #fff;
  z-index: 10;
}

.logo-section {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
}

.logo-img { height: 32px; transition: all 0.3s; }
.logo-img.collapsed { height: 24px; }

.cabinet-header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.header-title {
  font-size: 16px;
}

.cabinet-content {
  background: #f5f7fa;
  padding: 24px;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
}

.menu-item-with-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}
.menu-item-with-badge .n-badge {
  flex-shrink: 0;
}

.header-avatar-img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.cabinet-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #999;
  font-size: 12px;
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

/* ── Mobile backdrop ────────────────────────── */
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
  .cabinet-sider {
    position: fixed !important;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100vh !important;
    max-height: 100vh !important;
    width: 240px !important;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: none;
  }

  .cabinet-sider.mobile-open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
  }

  /* Hide NaiveUI's built-in collapse arrow trigger */
  .cabinet-sider :deep(.n-layout-sider__trigger) {
    display: none !important;
  }

  /* Header: fixed on mobile */
  .cabinet-header {
    position: fixed !important;
    top: 0;
    left: 0;
    right: 0;
    z-index: 150;
    padding: 0 12px;
  }

  .cabinet-content { padding: 76px 12px 12px; }

  .user-name-text { display: none; }
  .header-title { display: none; }
}
</style>
