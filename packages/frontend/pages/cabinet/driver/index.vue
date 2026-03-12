<template>
  <div class="onboarding-page">
    <n-card :bordered="false" class="shadow-sm onboarding-card">
      <n-steps :current="currentStep" :status="currentStatus">
        <n-step title="Контактные данные" description="Телефон и имя" />
        <n-step title="Документы" description="Паспорт и права" />
        <n-step title="Завершение" description="Проверка модератором" />
      </n-steps>

      <div class="step-content mt-40">
        <div v-if="currentStep === 1">
          <n-form :model="form" ref="formRef">
            <n-grid :cols="2" :x-gap="24">
              <n-gi>
                <n-form-item label="Ваше полное имя" path="name">
                  <n-input v-model:value="form.name" placeholder="Иван Иванов" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Номер телефона" path="phone">
                  <n-input v-model:value="form.phone" placeholder="+993 ..." />
                </n-form-item>
              </n-gi>
            </n-grid>
            <n-button type="primary" size="large" @click="nextStep">Далее</n-button>
          </n-form>
        </div>

        <div v-if="currentStep === 2">
          <n-alert title="Безопасность" type="info" class="mb-20">
            Для работы на платформе необходимо подтвердить личность. Загрузите фото документов.
          </n-alert>
          <n-grid :cols="2" :x-gap="24">
            <n-gi>
              <n-form-item label="Серия и номер паспорта">
                <n-input v-model:value="form.passport" placeholder="I-AS 123456" />
              </n-form-item>
              <n-upload action="#" :default-upload="false">
                <n-button>Загрузить фото паспорта</n-button>
              </n-upload>
            </n-gi>
            <n-gi>
              <n-form-item label="Водительское удостоверение">
                <n-input v-model:value="form.license" placeholder="123456" />
              </n-form-item>
              <n-upload action="#" :default-upload="false">
                <n-button>Загрузить фото прав</n-button>
              </n-upload>
            </n-gi>
          </n-grid>
          <n-space class="mt-20">
            <n-button @click="prevStep">Назад</n-button>
            <n-button type="primary" size="large" @click="nextStep">Отправить на проверку</n-button>
          </n-space>
        </div>

        <div v-if="currentStep === 3" class="text-center py-40">
          <n-result
            status="success"
            title="Данные отправлены"
            description="Наш модератор проверит ваши документы в течение 24 часов. Вы получите уведомление."
          >
            <template #footer>
              <n-button @click="navigateTo('/')">На главную</n-button>
            </template>
          </n-result>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const { session } = useAuth()

const currentStep = ref(1)
const currentStatus = ref<'process' | 'finish' | 'error' | 'wait'>('process')

const form = reactive({
  name: '',
  phone: '',
  passport: '',
  license: '',
})

onMounted(() => {
  form.name = session.value?.user?.name || ''
})

const nextStep = () => {
  if (currentStep.value < 3) currentStep.value++
}

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--
}
</script>

<style scoped>
.mt-40 { margin-top: 40px; }
.mb-20 { margin-bottom: 20px; }
.py-40 { padding: 40px 0; }
.text-center { text-align: center; }

.onboarding-card {
  border-radius: 20px;
  padding: 40px;
}

.shadow-sm {
  box-shadow: 0 4px 24px rgba(0,0,0,0.05);
}
</style>
