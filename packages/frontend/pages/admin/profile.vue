<template>
  <div class="admin-profile">
    <n-grid :cols="3" :x-gap="24" responsive="screen">
      <!-- Левая колонка: Аватар и основная инфа -->
      <n-gi :span="1">
        <n-card class="shadow-sm text-center">
          <n-space vertical align="center" size="large">
            <n-avatar
              round
              :size="120"
              :style="{ backgroundColor: '#ff6b4a', fontSize: '48px' }"
            >
              {{ session?.user?.name?.charAt(0) || 'A' }}
            </n-avatar>
            <div>
              <n-h2 style="margin: 0">{{ session?.user?.name || 'Администратор' }}</n-h2>
              <n-text depth="3">Super Admin</n-text>
            </div>
            <n-tag type="success" round :bordered="false">Активен</n-tag>
            
            <n-divider />
            
            <div class="profile-details">
              <div class="detail-item">
                <n-text depth="3">Email:</n-text>
                <n-text strong>{{ session?.user?.email }}</n-text>
              </div>
              <div class="detail-item">
                <n-text depth="3">Телефон:</n-text>
                <n-text strong>{{ session?.user?.phone || 'Не указан' }}</n-text>
              </div>
            </div>
          </n-space>
        </n-card>
      </n-gi>

      <!-- Правая колонка: Формы редактирования -->
      <n-gi :span="2">
        <n-tabs type="line" animated>
          <n-tab-pane name="basic" tab="Основные данные">
            <n-form class="mt-20">
              <n-form-item label="Полное имя">
                <n-input v-model:value="profileForm.name" placeholder="Введите имя" />
              </n-form-item>
              <n-form-item label="Email">
                <n-input v-model:value="profileForm.email" disabled />
              </n-form-item>
              <n-form-item label="Номер телефона">
                <n-input v-model:value="profileForm.phone" placeholder="+993 ..." />
              </n-form-item>
              <n-button type="primary" @click="handleUpdateProfile">
                Сохранить изменения
              </n-button>
            </n-form>
          </n-tab-pane>
          
          <n-tab-pane name="security" tab="Безопасность">
            <n-form class="mt-20">
              <n-form-item label="Текущий пароль">
                <n-input type="password" show-password-on="mousedown" />
              </n-form-item>
              <n-form-item label="Новый пароль">
                <n-input type="password" show-password-on="mousedown" />
              </n-form-item>
              <n-form-item label="Подтвердите пароль">
                <n-input type="password" show-password-on="mousedown" />
              </n-form-item>
              <n-button type="primary">Обновить пароль</n-button>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

definePageMeta({
  layout: 'admin'
})

const { session } = useAuth()
const message = useMessage()

const profileForm = reactive({
  name: session.value?.user?.name || '',
  email: session.value?.user?.email || '',
  phone: session.value?.user?.phone || ''
})

const handleUpdateProfile = () => {
  message.success('Профиль успешно обновлен (демо)')
}
</script>

<style scoped>
.text-center {
  text-align: center;
}

.mt-20 {
  margin-top: 20px;
}

.profile-details {
  width: 100%;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.shadow-sm {
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}
</style>
