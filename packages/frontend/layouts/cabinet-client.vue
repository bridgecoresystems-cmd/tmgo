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
      <div class="logo-section" @click="navigateTo('/cabinet/client')">
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
      <n-layout-header bordered class="cabinet-header">
        <div class="header-left">
          <n-text strong style="font-size: 16px;">Личный кабинет (Заказчик)</n-text>
        </div>
        <div class="header-right">
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
import {
  HomeOutline,
  CubeOutline,
  MapOutline,
  MailOutline,
  PersonOutline,
} from '@vicons/ionicons5'

const { session, signOut } = useAuth()
const avatarSrc = computed(() => useAvatarUrl(session.value?.user?.image))
const { chatOpen, chatOrderId, chatTitle } = useOrderChat()
const route = useRoute()
const collapsed = ref(false)

const activeKey = computed(() => route.path)

function renderIcon(Icon: Component) {
  return () => h(NIcon, null, { default: () => h(Icon) })
}

const menuOptions: MenuOption[] = [
  { label: 'Главная', key: '/cabinet/client', icon: renderIcon(HomeOutline) },
  { label: 'Мои заказы', key: '/cabinet/client/orders', icon: renderIcon(CubeOutline) },
  { label: 'Услуги перевозчиков', key: '/cabinet/client/services', icon: renderIcon(MapOutline) },
  { label: 'Рассылки', key: '/cabinet/client/mailing', icon: renderIcon(MailOutline) },
  { label: 'Профиль', key: '/cabinet/client/profile', icon: renderIcon(PersonOutline) },
]

const userMenuOptions = [
  { label: 'На главную сайта', key: 'home' },
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

.header-avatar-img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
