<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LogIn, UserPlus, ArrowRight, Search, Truck, Eye } from 'lucide-vue-next'

const router = useRouter()

const skipRegistration = () => {
  router.push('/home')
}
</script>

<template>
  <div class="welcome-container">
    <div class="content-wrapper">
      
      <!-- Speech Bubble 1 -->
      <div class="speech-bubble top-bubble">
        <h2 class="brand-title">TMGO</h2>
        <p>Добро пожаловать на Биржу грузоперевозок <strong>TMGO</strong>!</p>
        <p>Чтобы полноценно пользоваться приложением, войдите в свой аккаунт или зарегистрируйте новый.</p>
      </div>

      <!-- Auth Buttons -->
      <div class="btn-group right-align">
        <button class="welcome-btn white-btn" @click="router.push('/login')">
          <span>Войти в свой аккаунт</span>
          <LogIn :size="18" />
        </button>
        <button class="welcome-btn white-btn" @click="router.push('/register')">
          <span>Зарегистрироваться</span>
          <UserPlus :size="18" />
        </button>
        <button class="welcome-btn ghost-btn" @click="skipRegistration">
          <span>Пропустить регистрацию</span>
          <ArrowRight :size="18" />
        </button>
      </div>

      <!-- Speech Bubble 2 -->
      <div class="speech-bubble middle-bubble">
        <h2 class="brand-title">TMGO</h2>
        <p>Без регистрации вам будет доступна только часть возможностей TMGO. Вы сможете искать грузы и машины, но контактная информация и цены будут скрыты.</p>
        <p>Чтобы использовать приложение без регистрации — расскажите, какую задачу вы хотите решить с помощью TMGO.</p>
      </div>

      <!-- Task Buttons -->
      <div class="btn-group right-align bottom-group">
        <button class="welcome-btn white-btn task-btn" @click="skipRegistration">
          <span>Хочу найти груз</span>
          <Search :size="18" />
        </button>
        <button class="welcome-btn white-btn task-btn" @click="skipRegistration">
          <span>Хочу отправить груз</span>
          <Truck :size="18" />
        </button>
        <button class="welcome-btn ghost-btn" @click="skipRegistration">
          <span>Посмотреть приложение</span>
          <Eye :size="18" />
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.welcome-container {
  min-height: 100vh;
  background-color: #e9f0f8; /* Light blue background like in the photo */
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: calc(20px + var(--safe-area-top));
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.speech-bubble {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  position: relative;
  width: 85%;
}

/* Little tail for the speech bubble */
.speech-bubble::after {
  content: '';
  position: absolute;
  left: -10px;
  top: 20px;
  border-width: 10px 10px 10px 0;
  border-style: solid;
  border-color: transparent white transparent transparent;
}

.brand-title {
  color: var(--primary);
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.speech-bubble p {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
}

.btn-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.right-align {
  align-items: flex-end;
}

.welcome-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  width: auto;
  min-width: 220px;
  transition: all 0.2s;
}

.white-btn {
  background: white;
  color: var(--primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.white-btn:active {
  transform: scale(0.98);
  background: #f8f9fa;
}

.ghost-btn {
  background: transparent;
  color: var(--primary);
  padding: 8px 12px;
  font-size: 0.9rem;
}

.task-btn {
  border: 1px solid rgba(43, 80, 148, 0.1);
}

.bottom-group {
  margin-top: 10px;
}
</style>
