<template>
  <n-layout position="absolute" content-style="display: flex; flex-direction: column; min-height: 100vh;">
    <n-layout-header bordered class="header">
      <div class="header-content">
        <div class="logo-container" @click="navigateTo('/')">
          <img src="/images/logo.png" alt="tmGo Logo" class="logo-img" />
        </div>
        <n-space v-if="!session?.user">
          <n-button quaternary @click="navigateTo('/auth?mode=login')">Войти</n-button>
          <n-button type="primary" @click="navigateTo('/auth?mode=signup')">Регистрация</n-button>
        </n-space>
        <n-space v-else>
          <n-dropdown :options="userOptions" @select="handleUserSelect">
            <n-button quaternary class="user-btn">{{ session.user.name || session.user.email }}</n-button>
          </n-dropdown>
        </n-space>
      </div>
    </n-layout-header>
    <n-layout-content class="main-content" style="flex: 1;">
      <slot />
    </n-layout-content>
    <n-layout-footer bordered class="footer">
      &copy; 2026 BridgeCore Systems | TMGO Logistics Platform
    </n-layout-footer>
  </n-layout>
</template>

<script setup lang="ts">
const { session, signOut } = useAuth()

const userOptions = [
  { label: 'Кабинет', key: 'profile' },
  { label: 'Выйти', key: 'logout' }
]

const handleUserSelect = async (key: string) => {
  if (key === 'logout') {
    await signOut()
    navigateTo('/auth')
  } else if (key === 'profile') {
    const role = session.value?.user?.role
    if (role === 'admin') navigateTo('/admin')
    else if (role === 'driver') navigateTo('/cabinet/driver')
    else navigateTo('/cabinet/client')
  }
}
</script>

<style scoped>
.header {
  height: 80px;
  padding: 0 40px;
  display: flex;
  align-items: center;
  background: #fff;
}

.header-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-container {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.logo-img {
  height: 40px;
  object-fit: contain;
}

.main-content {
  padding-top: 80px;
  padding-bottom: 60px;
}

.footer {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
}

.user-btn {
  border: 1px solid #f97316;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .header {
    padding: 0 20px;
  }
}
</style>
