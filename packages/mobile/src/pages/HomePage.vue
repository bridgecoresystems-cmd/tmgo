<script setup lang="ts">
import { ref } from 'vue'
import { 
  Search, 
  Truck, 
  MapPin, 
  User, 
  MessageSquare, 
  Bell,
  Filter,
  Plus
} from 'lucide-vue-next'
import CargoCard from '../components/CargoCard.vue'

const activeTab = ref('search')

const cargoList = ref([
  {
    id: 1,
    from: 'Алматы',
    to: 'Астана',
    cargo: 'Овощи, 20т (Реф)',
    price: '450 000 ₸',
    date: 'Завтра',
    type: 'Рефрижератор',
    verified: true
  },
  {
    id: 2,
    from: 'Шымкент',
    to: 'Ташкент',
    cargo: 'Запчасти, 3т',
    price: '180 000 ₸',
    date: '14 мая',
    type: 'Тент',
    verified: false
  },
  {
    id: 3,
    from: 'Атырау',
    to: 'Актау',
    cargo: 'Трубы ПВХ, 15т',
    price: 'Договорная',
    date: '15 мая',
    type: 'Бортовой',
    verified: true
  }
])
</script>

<template>
  <div class="mobile-layout">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo">TMGO<span>.mobile</span></div>
        <div class="header-actions">
          <button class="icon-btn">
            <Bell :size="22" />
            <span class="badge-dot"></span>
          </button>
          <button class="icon-btn">
            <MessageSquare :size="22" />
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- Welcome Section -->
      <section class="welcome-section">
        <h1>Куда едем сегодня?</h1>
        <p>Найдите лучшие заказы по всему Казахстану</p>
      </section>

      <!-- Search Container -->
      <div class="search-box">
        <div class="input-group">
          <MapPin :size="18" class="input-icon" />
          <input type="text" placeholder="Откуда" class="search-input">
        </div>
        <div class="divider"></div>
        <div class="input-group">
          <MapPin :size="18" class="input-icon" style="color: var(--accent);" />
          <input type="text" placeholder="Куда" class="search-input">
        </div>
        <button class="search-btn">
          <Search :size="20" />
        </button>
      </div>

      <!-- Quick Stats / Filters -->
      <div class="filter-scroll">
        <button class="filter-chip active">Все грузы</button>
        <button class="filter-chip">Тент</button>
        <button class="filter-chip">Реф</button>
        <button class="filter-chip">Борт</button>
        <button class="filter-chip"><Filter :size="14" /> Фильтры</button>
      </div>

      <!-- Feed Section -->
      <section class="feed-section">
        <div class="section-header">
          <h2>Лента грузов</h2>
          <button class="text-link">См. все</button>
        </div>
        
        <div class="cargo-list">
          <CargoCard 
            v-for="item in cargoList" 
            :key="item.id" 
            :item="item" 
          />
        </div>
      </section>
    </main>

    <!-- Floating Action Button -->
    <button class="fab">
      <Plus :size="28" />
    </button>

    <!-- Bottom Navigation -->
    <nav class="tab-bar">
      <button class="tab-item" :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">
        <Search :size="22" />
        <span>Поиск</span>
      </button>
      <button class="tab-item" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
        <Truck :size="22" />
        <span>Заказы</span>
      </button>
      <button class="tab-item" :class="{ active: activeTab === 'map' }" @click="activeTab = 'map'">
        <MapPin :size="22" />
        <span>Карта</span>
      </button>
      <button class="tab-item" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
        <User :size="22" />
        <span>Профиль</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.5px;
}

.logo span {
  color: var(--text-secondary);
  font-weight: 400;
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  position: relative;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #ff4757;
  border-radius: 50%;
  border: 2px solid white;
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-section h1 {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 4px;
}

.welcome-section p {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.search-box {
  background: white;
  border-radius: var(--radius-lg);
  padding: 8px;
  display: flex;
  align-items: center;
  box-shadow: var(--shadow-md);
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
}

.input-group {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 12px;
}

.input-icon {
  color: var(--primary);
  margin-right: 8px;
}

.search-input {
  border: none;
  width: 100%;
  font-size: 0.9rem;
  font-weight: 500;
  outline: none;
  background: transparent;
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
}

.search-btn {
  background: var(--primary);
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s active;
}

.filter-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 16px;
  scrollbar-width: none;
}

.filter-scroll::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  white-space: nowrap;
  background: white;
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-chip.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.feed-section {
  padding-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
}

.text-link {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 600;
  font-size: 0.9rem;
}

.cargo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fab {
  position: fixed;
  bottom: calc(var(--tabbar-height) + var(--safe-area-bottom) + 20px);
  right: 20px;
  width: 60px;
  height: 60px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(255, 126, 0, 0.4);
  z-index: 900;
}

.tab-item {
  background: none;
  border: none;
}
</style>
