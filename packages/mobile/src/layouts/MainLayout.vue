<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Package, User, Truck } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const route  = useRoute()
const router = useRouter()
const { user } = useAuth()

const navItems = computed(() => {
  if (user.user?.role === 'driver') {
    return [
      { id: 'search',    icon: Search,  label: 'Поиск',   path: '/search' },
      { id: 'available', icon: Truck,   label: 'Грузы',   path: '/cabinet/driver/available' },
      { id: 'cabinet',   icon: Package, label: 'Кабинет', path: '/cabinet/driver' },
      { id: 'profile',   icon: User,    label: 'Профиль', path: '/profile' },
    ]
  }
  return [
    { id: 'search',  icon: Search,  label: 'Поиск',   path: '/search' },
    { id: 'cabinet', icon: Package, label: 'Заказы',  path: '/cabinet/client' },
    { id: 'profile', icon: User,    label: 'Профиль', path: '/profile' },
  ]
})

const isActive = (path: string) => {
  if (path === '/profile') return route.path === '/profile'
  if (path === '/cabinet/driver') return route.path === '/cabinet/driver'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="main-layout">
    <div class="page-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- Bottom Navigation -->
    <nav class="tab-bar">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="tab-item"
        :class="{ active: isActive(item.path) }"
        @click="router.push(item.path)"
      >
        <component :is="item.icon" :size="22" />
        <span>{{ item.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.page-content {
  flex: 1;
  padding-bottom: calc(var(--tabbar-height) + var(--safe-area-bottom));
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.tab-item {
  background: none;
  border: none;
}
</style>
