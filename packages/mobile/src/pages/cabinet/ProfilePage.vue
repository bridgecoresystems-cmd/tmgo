<script setup lang="ts">
import { ref } from 'vue'
import { 
  User, 
  ChevronRight, 
  Wallet, 
  ShieldCheck, 
  Truck, 
  Settings, 
  Headset, 
  LogOut,
  FileText,
  Bell,
  ArrowLeftRight,
  Package
} from 'lucide-vue-next'

// Role state: 'client' or 'driver'
const currentRole = ref<'client' | 'driver'>('client')

const toggleRole = () => {
  currentRole.value = currentRole.value === 'client' ? 'driver' : 'client'
}

const userProfile = ref({
  name: 'Батыр',
  balance: '125,000 ₸',
  status: 'verified'
})

// Menu items change based on role
const getMenuItems = () => {
  const common = [
    { id: 'profile', label: 'Личные данные', icon: User, color: '#4834d4' },
    { id: 'notifications', label: 'Уведомления', icon: Bell, color: '#6ab04c' },
    { id: 'support', label: 'Служба поддержки', icon: Headset, color: '#7ed6df' },
    { id: 'settings', label: 'Настройки', icon: Settings, color: '#95afc0' },
  ]

  if (currentRole.value === 'client') {
    return [
      { id: 'my-orders', label: 'Мои заказы (Грузы)', icon: Package, color: '#eb4d4b' },
      { id: 'verification', label: 'Верификация компании', icon: ShieldCheck, color: '#22a6b3' },
      ...common
    ]
  } else {
    return [
      { id: 'my-vehicles', label: 'Мой транспорт', icon: Truck, color: '#f0932b' },
      { id: 'driver-orders', label: 'Принятые заказы', icon: FileText, color: '#eb4d4b' },
      { id: 'verification', label: 'Документы водителя', icon: ShieldCheck, color: '#22a6b3' },
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
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Batyr" alt="Avatar" />
        </div>
        <div class="details">
          <h1>{{ userProfile.name }}</h1>
          <div class="role-badge" :class="currentRole">
            {{ currentRole === 'client' ? 'Грузоотправитель' : 'Перевозчик' }}
          </div>
        </div>
      </div>
      <button class="logout-btn">
        <LogOut :size="20" />
      </button>
    </header>

    <main class="profile-content">
      <!-- Role Switcher -->
      <div class="role-switcher-card" @click="toggleRole">
        <div class="switcher-text">
          <h3>Сменить роль</h3>
          <p>Переключиться на {{ currentRole === 'client' ? 'перевозчика' : 'отправителя' }}</p>
        </div>
        <div class="switcher-icon">
          <ArrowLeftRight :size="20" />
        </div>
      </div>

      <!-- Balance Card -->
      <div class="balance-card">
        <div class="balance-info">
          <div class="label">Ваш баланс</div>
          <div class="amount">{{ userProfile.balance }}</div>
        </div>
        <button class="top-up-btn">
          <span>Пополнить</span>
        </button>
      </div>

      <!-- Menu List -->
      <div class="menu-list">
        <button v-for="item in getMenuItems()" :key="item.id" class="menu-item">
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

.balance-card {
  background: var(--primary);
  border-radius: 16px;
  padding: 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.balance-info .label { font-size: 0.8rem; opacity: 0.8; }
.balance-info .amount { font-size: 1.4rem; font-weight: 800; }

.top-up-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
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
