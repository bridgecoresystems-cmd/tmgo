<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  User,
  ChevronRight,
  ShieldCheck,
  Truck,
  Settings,
  Headset,
  LogOut,
  FileText,
  Bell,
  Package
} from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, signOut } = useAuth()

const currentRole = computed(() => user.user?.role ?? 'client')

async function handleSignOut() {
  await signOut()
  router.replace('/login')
}

// Menu items change based on role
const getMenuItems = () => {
  const common = [
    { id: 'profile', label: 'Личные данные', icon: User, color: '#4834d4', action: () => {} },
    { id: 'notifications', label: 'Уведомления', icon: Bell, color: '#6ab04c', action: () => {} },
    { id: 'support', label: 'Служба поддержки', icon: Headset, color: '#7ed6df', action: () => {} },
    { id: 'settings', label: 'Настройки', icon: Settings, color: '#95afc0', action: () => {} },
  ]

  if (currentRole.value === 'client') {
    return [
      { id: 'my-orders', label: 'Мои заказы', icon: Package, color: '#eb4d4b', action: () => router.push('/cabinet/client/orders') },
      { id: 'verification', label: 'Верификация компании', icon: ShieldCheck, color: '#22a6b3', action: () => {} },
      ...common
    ]
  } else {
    return [
      { id: 'my-vehicles', label: 'Мой транспорт', icon: Truck, color: '#f0932b', action: () => {} },
      { id: 'driver-orders', label: 'Принятые заказы', icon: FileText, color: '#eb4d4b', action: () => {} },
      { id: 'verification', label: 'Документы водителя', icon: ShieldCheck, color: '#22a6b3', action: () => {} },
      ...common
    ]
  }
}
</script>

<template>
  <div class="profile-page">
    <!-- Header -->
    <header class="profile-header">
      <div class="user-info">
        <div class="avatar">
          <img :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user?.email ?? 'tmgo'}`" alt="Avatar" />
        </div>
        <div class="details">
          <h1>{{ user.user?.name ?? '—' }}</h1>
          <div class="role-badge" :class="currentRole">
            {{ currentRole === 'client' ? 'Грузоотправитель' : 'Перевозчик' }}
          </div>
        </div>
      </div>
      <button class="logout-btn" @click="handleSignOut">
        <LogOut :size="20" />
      </button>
    </header>

    <main class="profile-content">

      <!-- Email -->
      <div class="email-card">
        <span class="email-label">Email</span>
        <span class="email-val">{{ user.user?.email ?? '—' }}</span>
      </div>

      <!-- Menu List -->
      <div class="menu-list">
        <button v-for="item in getMenuItems()" :key="item.id" class="menu-item" @click="item.action()">
          <div class="item-left">
            <div class="icon-wrapper" :style="{ backgroundColor: item.color + '20', color: item.color }">
              <component :is="item.icon" :size="20" />
            </div>
            <span>{{ item.label }}</span>
          </div>
          <ChevronRight :size="18" color="var(--text-muted)" />
        </button>
      </div>

      <!-- App Info -->
      <div class="app-info">
        <p>TMGO Mobile v1.0.0</p>
        <p>© 2026 BridgeCore Systems</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: var(--bg-color);
  padding-top: var(--safe-area-top);
}

.profile-header {
  padding: 24px 20px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary-light);
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.details h1 {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-top: 4px;
  text-transform: uppercase;
}

.role-badge.client { background: #e3f2fd; color: #1976d2; }
.role-badge.driver { background: #fff3e0; color: #ef6c00; }

.logout-btn {
  background: #fff5f5;
  color: #eb4d4b;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-content {
  padding: 16px;
}

.email-card {
  background: white;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
}
.email-label { font-size: 0.8rem; color: var(--text-secondary); }
.email-val   { font-size: 0.88rem; font-weight: 600; color: #222; }

.role-switcher-card {
  background: white;
  padding: 16px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.switcher-text h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
}

.switcher-text p {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 2px 0 0;
}

.switcher-icon {
  background: var(--bg-color);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
}


.menu-list {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.menu-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: white;
  border: none;
  border-bottom: 1px solid var(--border-color);
}

.menu-item:last-child { border-bottom: none; }

.item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-left span {
  font-weight: 600;
  font-size: 0.9rem;
}

.app-info {
  margin-top: 32px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.75rem;
}
</style>
