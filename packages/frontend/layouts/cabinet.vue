<template>
  <n-layout has-sider style="min-height: 100vh;">
    <!-- Sider -->
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
      <div class="logo-section" @click="navigateTo('/cabinet')">
        <img src="/images/logo.png" alt="Logo" class="logo-img" :class="{ 'collapsed': collapsed }" />
      </div>
      
      <n-menu
        :collapsed="collapsed"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>

    <!-- Main -->
    <n-layout content-style="display: flex; flex-direction: column; min-height: 100vh;">
      <n-layout-header bordered class="cabinet-header">
        <div class="header-left">
          <n-text strong style="font-size: 16px;">{{ t('layout.cabinet.title') }} {{ roleLabel }}</n-text>
        </div>
        
        <div class="header-right">
          <n-space align="center" style="gap: 12px">
            <LanguageSwitcher />
            <n-dropdown :options="userMenuOptions" @select="handleUserSelect">
            <n-space align="center" style="cursor: pointer">
              <n-avatar round size="small" :style="{ backgroundColor: '#ff6b4a' }">
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
</template>

<script setup lang="ts">
import { h, ref, computed, type Component } from 'vue'
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'
import {
  HomeOutline,
  CubeOutline,
  CarOutline,
  ChatbubblesOutline,
  PersonOutline,
} from '@vicons/ionicons5'

const { t } = useI18n()
const { session, signOut } = useAuth()
const router = useRouter()
const route = useRoute()
const collapsed = ref(false)

const activeKey = computed(() => route.path)
const roleLabel = computed(() => session.value?.user?.role === 'driver' ? t('layout.cabinet.roleDriver') : t('layout.cabinet.roleClient'))

function renderIcon(Icon: Component) {
  return () => h(NIcon, null, { default: () => h(Icon) })
}

const menuOptions = computed<MenuOption[]>(() => {
  const base = [
    { label: t('layout.cabinet.menuHome'), key: '/cabinet', icon: renderIcon(HomeOutline) },
    { label: t('layout.cabinet.menuMyOrders'), key: '/cabinet/orders', icon: renderIcon(CubeOutline) },
    { label: t('layout.cabinet.menuMessages'), key: '/cabinet/chat', icon: renderIcon(ChatbubblesOutline) },
    { label: t('layout.cabinet.menuProfile'), key: '/cabinet/profile', icon: renderIcon(PersonOutline) },
  ]
  
  if (session.value?.user?.role === 'driver') {
    base.splice(1, 0, { label: t('layout.cabinet.menuMyVehicles'), key: '/cabinet/vehicles', icon: renderIcon(CarOutline) })
  }
  
  return base
})

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
.cabinet-sider {
  background: #fff;
}
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
