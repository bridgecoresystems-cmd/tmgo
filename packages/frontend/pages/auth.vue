<template>
  <div class="auth-container">
    <n-card :title="isLogin ? 'Вход в систему' : 'Регистрация'" style="max-width: 400px; margin: 100px auto;">
      <n-form @submit.prevent="handleAuth">
        <n-form-item label="Email">
          <n-input v-model:value="form.email" placeholder="example@mail.com" />
        </n-form-item>
        <n-form-item label="Пароль">
          <n-input v-model:value="form.password" type="password" show-password-on="click" />
        </n-form-item>
        
        <template v-if="!isLogin">
          <n-form-item label="Ваша роль">
            <n-radio-group v-model:value="form.role">
              <n-radio value="CLIENT">Заказчик</n-radio>
              <n-radio value="DRIVER">Перевозчик</n-radio>
            </n-radio-group>
          </n-form-item>
          <n-form-item label="Имя">
            <n-input v-model:value="form.name" placeholder="Иван Иванов" />
          </n-form-item>
        </template>

        <n-button type="primary" block attr-type="submit" :loading="loading">
          {{ isLogin ? 'Войти' : 'Зарегистрироваться' }}
        </n-button>
      </n-form>

      <template #footer>
        <n-button quaternary block @click="isLogin = !isLogin">
          {{ isLogin ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Вход' }}
        </n-button>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { signIn, signUp } = useAuth()
const router = useRouter()
const message = useMessage()

const isLogin = ref(true)
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
  role: 'CLIENT',
  name: ''
})

const handleAuth = async () => {
  loading.value = true
  try {
    if (isLogin.value) {
      const { data, error } = await signIn.email({
        email: form.email,
        password: form.password,
        callbackURL: '/'
      })
      if (error) throw error
    } else {
      const { data, error } = await signUp.email({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        callbackURL: '/'
      })
      if (error) throw error
    }
    router.push('/')
  } catch (e: any) {
    message.error(e.message || 'Ошибка авторизации')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
