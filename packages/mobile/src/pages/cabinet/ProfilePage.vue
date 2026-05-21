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
import { switchRole } from '@/api/cabinet'

const router = useRouter()
const { user, signOut, setUser } = useAuth()

const currentRole = computed(() => user.user?.role ?? 'client')
const switching = ref(false)

async function handleSignOut() {
  await signOut()
  router.replace('/login')
}

async function handleSwitchRole() {
  const next = currentRole.value === 'driver' ? 'client' : 'driver'
  switching.value = true
  try {
    const data = await switchRole(next)
    setUser(data.user)
    router.replace(next === 'driver' ? '/cabinet/driver' : '/cabinet/client')
  } catch { /* ignore */ } finally {
    switching.value = false
  }
}

// Menu items change based on role
const getMenuItems = () => {
  const common = [
    { id: 'profile', label: 'Личные данные', icon: User, color: '#6366f1', action: () => {} },
    { id: 'notifications', label: 'Уведомления', icon: Bell, color: '#f59e0b', action: () => {} },
    { id: 'support', label: 'Служба поддержки', icon: Headset, color: '#06b6d4', action: () => {} },
    { id: 'settings', label: 'Настройки', icon: Settings, color: '#64748b', action: () => {} },
  ]

  if (currentRole.value === 'client') {
    return [
      { id: 'my-orders', label: 'Мои заказы', icon: Package, color: '#ff6b4a', action: () => router.push('/cabinet/client/orders') },
      { id: 'verification', label: 'Верификация компании', icon: ShieldCheck, color: '#10b981', action: () => {} },
      ...common
    ]
  } else {
    return [
      { id: 'my-vehicles', label: 'Мой транспорт', icon: Truck, color: '#f59e0b', action: () => {} },
      { id: 'driver-orders', label: 'Принятые заказы', icon: FileText, color: '#ff6b4a', action: () => {} },
      { id: 'verification', label: 'Документы водителя', icon: ShieldCheck, color: '#10b981', action: () => {} },
      ...common
    ]
  }
}
</script>

<template>
  <div class="profile-page animate-fade">
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
      <button class="logout-btn" @click="handleSignOut" aria-label="Выйти">
        <LogOut :size="20" />
      </button>
    </header>

    <main class="profile-content">

      <!-- Email Card -->
      <div class="info-card">
        <span class="info-label">Электронная почта</span>
        <span class="info-val">{{ user.user?.email ?? '—' }}</span>
      </div>

      <!-- Role switcher -->
      <button class="role-switch-card" :disabled="switching" @click="handleSwitchRole">
        <div class="role-switch-icon">
          <Truck v-if="currentRole === 'client'" :size="20" />
          <Package v-else :size="20" />
        </div>
        <div class="role-switch-text">
          <span class="role-switch-label">Переключить профиль</span>
          <span class="role-switch-sub">
            {{ currentRole === 'client' ? 'Стать перевозчиком' : 'Стать грузовладельцем' }}
          </span>
        </div>
        <ChevronRight :size="18" class="chevron-switch" />
      </button>

      <!-- Menu List -->
      <div class="menu-list">
        <button v-for="item in getMenuItems()" :key="item.id" class="menu-item" @click="item.action()">
          <div class="item-left">
            <div class="icon-wrapper" :style="{ backgroundColor: item.color + '12', color: item.color }">
              <component :is="item.icon" :size="20" />
            </div>
            <span>{{ item.label }}</span>
          </div>
          <ChevronRight :size="18" class="chevron-right" />
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
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary-light);
  overflow: hidden;
  border: 2px solid var(--primary-light);
  box-shadow: var(--shadow-sm);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.details h1 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
  letter-spacing: -0.5px;
}

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  margin-top: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.client { background: var(--primary-light); color: var(--primary); }
.role-badge.driver { background: #fff3e0; color: #ef6c00; }

.logout-btn {
  background: #fff5f5;
  color: #ef4444;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08);
}

.logout-btn:active {
  transform: scale(0.95);
  background: #ffebeb;
}

.profile-content {
  padding: 20px;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}
.info-label { font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; }
.info-val { font-size: 0.9rem; font-weight: 700; color: var(--text-main); }

.role-switch-card {
  width: 100%;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  cursor: pointer;
  text-align: left;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.role-switch-card:active {
  transform: scale(0.99);
}

.role-switch-card:disabled { opacity: 0.6; cursor: not-allowed; }

.role-switch-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(255, 107, 74, 0.12);
}

.role-switch-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.role-switch-label { font-size: 0.9rem; font-weight: 700; color: var(--text-main); }
.role-switch-sub { font-size: 0.78rem; color: var(--text-secondary); }
.chevron-switch { color: var(--text-muted); transition: transform 0.2s ease; }
.role-switch-card:active .chevron-switch { transform: translateX(2px); }

.menu-list {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
}

.menu-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border: none;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:last-child { border-bottom: none; }

.menu-item:active {
  background-color: var(--bg-color);
}

.item-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.menu-item:active .icon-wrapper {
  transform: scale(0.95);
}

.item-left span {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-main);
  letter-spacing: -0.3px;
}

.chevron-right {
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.menu-item:active .chevron-right {
  transform: translateX(2px);
}

.app-info {
  margin-top: 36px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.6;
}

.animate-fade {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
