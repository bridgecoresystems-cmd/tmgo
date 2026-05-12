<script setup lang="ts">
import { ArrowRightLeft, Clock, Truck, ShieldCheck } from 'lucide-vue-next'

interface Cargo {
  id: number;
  from: string;
  to: string;
  cargo: string;
  price: string;
  date: string;
  type: string;
  verified?: boolean;
}

defineProps<{
  item: Cargo
}>()
</script>

<template>
  <div class="card cargo-card">
    <div class="card-header">
      <div class="route">
        <span class="city">{{ item.from }}</span>
        <ArrowRightLeft :size="16" class="route-icon" />
        <span class="city">{{ item.to }}</span>
      </div>
      <div class="price-box">
        <div class="price">{{ item.price }}</div>
        <div class="payment-type">Б/Н с НДС</div>
      </div>
    </div>

    <div class="card-details">
      <div class="detail-item">
        <Clock :size="14" />
        <span>{{ item.date }}</span>
      </div>
      <div class="detail-item">
        <Truck :size="14" />
        <span>{{ item.type }}</span>
      </div>
    </div>

    <div class="cargo-info">
      <div class="cargo-name">{{ item.cargo }}</div>
      <div v-if="item.verified" class="verified-badge">
        <ShieldCheck :size="14" />
        Надёжный
      </div>
    </div>

    <div class="card-footer">
      <button class="btn-secondary">Подробнее</button>
      <button class="btn-action">Предложить</button>
    </div>
  </div>
</template>

<style scoped>
.cargo-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.route {
  display: flex;
  align-items: center;
  gap: 8px;
}

.city {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-main);
}

.route-icon {
  color: var(--text-muted);
}

.price-box {
  text-align: right;
}

.price {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--accent);
}

.payment-type {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.card-details {
  display: flex;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.cargo-info {
  background: var(--bg-color);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cargo-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #2e7d32;
  font-size: 0.75rem;
  font-weight: 600;
}

.card-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 4px;
}

.btn-secondary {
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  padding: 8px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.9rem;
}

.btn-action {
  background: var(--primary);
  color: white;
  border: none;
  padding: 8px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
