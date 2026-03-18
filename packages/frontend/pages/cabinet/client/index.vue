<template>
  <div class="onboarding-page">
    <n-card :bordered="false" class="shadow-sm onboarding-card">
      <n-steps :current="currentStep" :status="currentStatus">
        <n-step :title="t('client.dashboard.contactData')" :description="t('client.dashboard.contactSubtitle')" />
        <n-step :title="t('client.dashboard.documentsStep')" :description="t('client.dashboard.documentsSubtitle')" />
        <n-step :title="t('client.dashboard.completion')" :description="t('client.dashboard.completionSubtitle')" />
      </n-steps>

      <div class="step-content mt-40">
        <div v-if="currentStep === 1">
          <n-form :model="form" ref="formRef">
            <n-grid :cols="2" :x-gap="24">
              <n-gi>
                <n-form-item :label="t('client.dashboard.fullName')" path="name">
                  <n-input v-model:value="form.name" :placeholder="t('client.dashboard.fullNamePlaceholder')" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('client.dashboard.phoneNumber')" path="phone">
                  <n-input v-model:value="form.phone" placeholder="+993 ..." />
                </n-form-item>
              </n-gi>
            </n-grid>
            <n-button type="primary" size="large" @click="nextStep">{{ t('client.dashboard.next') }}</n-button>
          </n-form>
        </div>

        <div v-if="currentStep === 2">
          <n-alert :title="t('client.dashboard.security')" type="info" class="mb-20">
            {{ t('client.dashboard.securityInfo') }}
          </n-alert>
          <n-grid :cols="2" :x-gap="24">
            <n-gi>
              <n-form-item :label="t('client.dashboard.passportSeriesNumber')">
                <n-input v-model:value="form.passport" placeholder="I-AS 123456" />
              </n-form-item>
              <n-upload action="#" :default-upload="false">
                <n-button>{{ t('client.dashboard.uploadPassport') }}</n-button>
              </n-upload>
            </n-gi>
          </n-grid>
          <n-space class="mt-20">
            <n-button @click="prevStep">{{ t('client.dashboard.back') }}</n-button>
            <n-button type="primary" size="large" @click="nextStep">{{ t('client.dashboard.sendForVerification') }}</n-button>
          </n-space>
        </div>

        <div v-if="currentStep === 3" class="text-center py-40">
          <n-result
            status="success"
            :title="t('client.dashboard.dataSent')"
            :description="t('client.dashboard.dataDescription')"
          >
            <template #footer>
              <n-button @click="navigateTo('/')">{{ t('client.dashboard.toMain') }}</n-button>
            </template>
          </n-result>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'cabinet-client', middleware: 'cabinet-auth' })

const { session } = useAuth()

const currentStep = ref(1)
const currentStatus = ref<'process' | 'finish' | 'error' | 'wait'>('process')

const form = reactive({
  name: '',
  phone: '',
  passport: '',
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
