<script setup lang="ts">
import { ref } from 'vue'
import { Truck, Navigation, Star, Search } from 'lucide-vue-next'

const stats = ref({
  trips: 45,
  rating: 4.9,
  active: 1
})
</script>

<template>
  <div class="dashboard">
    <header class="page-header">
      <h1>Кабинет водителя</h1>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon purple"><Truck :size="20" /></div>
        <div class="stat-value">{{ stats.trips }}</div>
        <div class="stat-label">Поездок</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow"><Star :size="20" /></div>
        <div class="stat-value">{{ stats.rating }}</div>
        <div class="stat-label">Рейтинг</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><Navigation :size="20" /></div>
        <div class="stat-value">{{ stats.active }}</div>
        <div class="stat-label">В пути</div>
      </div>
    </div>

    <div class="actions-section">
      <button class="action-btn primary">
        <Search :size="20" />
        <span>Найти новые грузы</span>
      </button>
      <button class="action-btn secondary">
        <span>Управление транспортом</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dashboard { padding: 20px; }
.page-header h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 24px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 16px 12px;
  border-radius: 16px;
  text-align: center;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.purple { background: #f3e5f5; color: #7b1fa2; }
.stat-icon.yellow { background: #fffde7; color: #fbc02d; }
.stat-icon.blue { background: #e1f5fe; color: #0288d1; }

.stat-value { font-size: 1.25rem; font-weight: 800; margin-bottom: 4px; }
.stat-label { font-size: 0.7rem; color: var(--text-secondary); font-weight: 600; line-height: 1.2; }

.actions-section { display: flex; flex-direction: column; gap: 12px; }
.action-btn {
  padding: 16px;
  border-radius: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: none;
  cursor: pointer;
}
.action-btn.primary { background: var(--primary); color: white; }
.action-btn.secondary { background: white; color: var(--primary); border: 1px solid var(--primary); }
</style>
