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
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>

    <n-layout>
      <ImpersonateBanner />
      <n-layout-header bordered class="cabinet-header">
        <div class="header-left">
          <n-text strong style="font-size: 16px;">Личный кабинет (Перевозчик)</n-text>
        </div>
        <div class="header-right">
          <n-space align="center" style="gap: 12px">
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

      <n-layout-content class="cabinet-content">
        <div class="content-container">
          <slot />
        </div>
      </n-layout-content>
    </n-layout>
  </n-layout>

  <ChatWidget
    v-model="chatOpen"
    :order-id="chatOrderId"
    :title="chatTitle"
    :current-user-id="session?.user?.id"
  />
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
  const label = h('span', 'Оповещения')
  if (alertsCount.value > 0) {
    return h('div', { class: 'menu-item-with-badge' }, [
      label,
      h(NBadge, { value: alertsCount.value, max: 99, type: 'error', offset: [4, 0] }),
    ])
  }
  return label
}

const menuOptions: MenuOption[] = [
  { label: 'Главная', key: '/cabinet/driver', icon: renderIcon(HomeOutline) },
  { label: 'Карточка водителя', key: '/cabinet/driver/card', icon: renderIcon(IdCardOutline) },
  { label: () => renderAlertsLabel(), key: '/cabinet/driver/alerts', icon: renderIcon(AlertCircleOutline) },
  { label: 'Мой транспорт', key: '/cabinet/driver/vehicles', icon: renderIcon(CarOutline) },
  { label: 'Мои заказы', key: '/cabinet/driver/orders', icon: renderIcon(CubeOutline) },
  { label: 'Доступные заказы', key: '/cabinet/driver/orders/available', icon: renderIcon(ClipboardOutline) },
  { label: 'Мои услуги', key: '/cabinet/driver/services', icon: renderIcon(MapOutline) },
  { label: 'Рассылки', key: '/cabinet/driver/mailing', icon: renderIcon(MailOutline) },
  { label: 'Профиль', key: '/cabinet/driver/profile', icon: renderIcon(PersonOutline) },
]

const userMenuOptions = [
  { label: 'Главная', key: 'home' },
  { label: 'Выйти', key: 'logout' },
]

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
</style>
