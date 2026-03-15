<template>
  <div class="dashboard-page">
    <!-- Уведомление о заполнении карточки -->
    <n-alert
      v-if="showOnboardingAlert"
      title="Заполните карточку водителя"
      type="warning"
      class="mb-24"
    >
      Для того чтобы начать принимать заказы и проходить верификацию, вам необходимо заполнить полную информацию о себе и своих документах.
      <template #footer>
        <n-button type="primary" size="small" @click="navigateTo('/cabinet/driver/card-v2')">
          Заполнить карточку
        </n-button>
      </template>
    </n-alert>

    <n-card title="Добро пожаловать в кабинет перевозчика" class="shadow-sm onboarding-card">
      <div class="stats-grid">
        <n-grid :cols="4" :x-gap="12">
          <n-gi>
            <n-statistic label="Активные заказы" :value="0" />
          </n-gi>
          <n-gi>
            <n-statistic label="Завершено" :value="0" />
          </n-gi>
          <n-gi>
            <n-statistic label="Рейтинг" value="0.00" />
          </n-gi>
          <n-gi>
            <n-statistic label="Баланс" value="0 TMT" />
          </n-gi>
        </n-grid>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

const { session } = useAuth()
const { status: verificationStatus } = useDriverVerificationStatus()

const showOnboardingAlert = computed(() => {
  return verificationStatus.value === 'not_submitted' || verificationStatus.value === 'not_verified'
})
</script>

<style scoped>
.dashboard-page {
  padding: 20px 0;
}
.mb-24 { margin-bottom: 24px; }
.shadow-sm {
  box-shadow: 0 4px 24px rgba(0,0,0,0.05);
}
.onboarding-card {
  border-radius: 16px;
}
.stats-grid {
  margin-top: 20px;
}
</style>
