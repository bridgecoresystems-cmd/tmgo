<template>
  <n-layout has-sider style="min-height: 100vh;">
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger="arrow-circle"
      class="cabinet-sider"
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="logo-section" @click="navigateTo('/cabinet/driver')">
        <img src="/images/logo.png" alt="Logo" class="logo-img" :class="{ 'collapsed': collapsed }" />
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
          <n-text strong style="font-size: 16px;">{{ t('layout.cabinet.title') }} {{ t('layout.cabinet.roleDriver') }}</n-text>
        </div>
        <div class="header-right">
          <n-space align="center" style="gap: 12px">
            <LanguageSwitcher />
            <DriverOnlineStatusToggle v-if="session?.user?.role === 'driver'" />
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
                <n-text v-if="!collapsed">{{ session?.user?.name }}</n-text>
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

  <ChatWidget
    v-model="chatOpen"
    :order-id="chatOrderId"
    :title="chatTitle"
    :current-user-id="session?.user?.id"
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
const { chatOpen, chatOrderId, chatTitle } = useOrderChat()
const { status: verificationStatus } = useDriverVerificationStatus()
const { count: alertsCount, fetchAlerts } = useDriverAlerts()
const route = useRoute()
const collapsed = ref(false)

const activeKey = computed(() => route.path)

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
    navigateTo('/')
  }
}
</script>

<style scoped>
.cabinet-sider { background: #fff; }
.logo-section {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
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
</style>
