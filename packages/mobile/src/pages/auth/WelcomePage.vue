<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LogIn, UserPlus, ArrowRight, Search, Truck, Eye } from 'lucide-vue-next'

const router = useRouter()

const skipRegistration = () => {
  router.push('/search')
}
</script>

<template>
  <div class="welcome-container">
    <div class="content-wrapper animate-fade">
      
      <!-- Speech Bubble 1 -->
      <div class="speech-bubble top-bubble">
        <div class="bubble-header">
          <div class="logo-dot"></div>
          <h2 class="brand-title">TMGO LOGISTICS</h2>
        </div>
        <p>Добро пожаловать на биржу грузоперевозок <strong>TMGO</strong>!</p>
        <p>Чтобы получить полный доступ ко всем функциям, войдите в свой аккаунт или зарегистрируйте новый.</p>
      </div>

      <!-- Auth Buttons -->
      <div class="btn-group right-align">
        <button class="welcome-btn primary-btn" @click="router.push('/login')">
          <span>Войти в аккаунт</span>
          <LogIn :size="18" />
        </button>
        <button class="welcome-btn secondary-btn" @click="router.push('/register')">
          <span>Зарегистрироваться</span>
          <UserPlus :size="18" />
        </button>
        <button class="welcome-btn ghost-btn" @click="skipRegistration">
          <span>Пропустить</span>
          <ArrowRight :size="18" />
        </button>
      </div>

      <!-- Speech Bubble 2 -->
      <div class="speech-bubble middle-bubble">
        <div class="bubble-header">
          <div class="logo-dot accent-dot"></div>
          <h2 class="brand-title">ГОСТЕВОЙ РЕЖИМ</h2>
        </div>
        <p>Без регистрации вы сможете просматривать заказы, но контакты и тарифы будут скрыты.</p>
        <p>Выберите вашу роль ниже, чтобы быстрее освоиться в приложении:</p>
      </div>

      <!-- Task Buttons -->
      <div class="btn-group right-align bottom-group">
        <button class="welcome-btn role-btn" @click="router.push('/search')">
          <span>Я ищу груз (Водитель)</span>
          <Search :size="18" />
        </button>
        <button class="welcome-btn role-btn" @click="skipRegistration">
          <span>Я отправляю груз (Клиент)</span>
          <Truck :size="18" />
        </button>
        <button class="welcome-btn ghost-btn" @click="skipRegistration">
          <span>Посмотреть демо-режим</span>
          <Eye :size="18" />
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.welcome-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fffcfb 0%, #fff0ed 50%, #fef3f0 100%);
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: calc(32px + var(--safe-area-top));
  padding-bottom: calc(32px + var(--safe-area-bottom));
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

.speech-bubble {
  background: white;
  padding: 22px;
  border-radius: 20px;
  box-shadow: var(--shadow-md);
  position: relative;
  width: 88%;
  border: 1px solid rgba(255, 107, 74, 0.08);
  transition: transform 0.3s ease;
}

.speech-bubble::after {
  content: '';
  position: absolute;
  left: -8px;
  top: 24px;
  border-width: 8px 8px 8px 0;
  border-style: solid;
  border-color: transparent white transparent transparent;
}

.bubble-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.logo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 8px var(--primary);
}

.logo-dot.accent-dot {
  background: var(--primary-dark);
}

.brand-title {
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.speech-bubble p {
  font-size: 0.95rem;
  color: var(--text-main);
  margin-bottom: 10px;
  line-height: 1.5;
}

.speech-bubble p:last-child {
  margin-bottom: 0;
}

.btn-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.right-align {
  align-items: flex-end;
}

.welcome-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  width: 85%;
  min-width: 240px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-sm);
}

.primary-btn {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 74, 0.25);
}

.primary-btn:active {
  transform: scale(0.97);
  box-shadow: 0 2px 8px rgba(255, 107, 74, 0.15);
}

.secondary-btn {
  background: white;
  color: var(--primary);
  border: 1px solid rgba(255, 107, 74, 0.2);
}

.secondary-btn:active {
  transform: scale(0.97);
  background: var(--primary-light);
}

.role-btn {
  background: white;
  color: var(--text-main);
  border: 1px solid var(--border-color);
}

.role-btn:active {
  transform: scale(0.97);
  border-color: var(--primary);
  color: var(--primary);
}

.ghost-btn {
  background: transparent;
  color: var(--text-secondary);
  box-shadow: none;
  font-size: 0.9rem;
  padding: 8px 16px;
  justify-content: flex-end;
  gap: 8px;
  width: auto;
  min-width: auto;
}

.ghost-btn:active {
  color: var(--primary);
  transform: translateX(2px);
}

.bottom-group {
  margin-top: 8px;
}

.animate-fade {
  animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
