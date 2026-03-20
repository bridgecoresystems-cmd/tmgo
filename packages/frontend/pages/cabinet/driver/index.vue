<template>
  <div class="dashboard-page">
    <!-- Уведомление о верификации -->
    <n-alert
      v-if="showOnboardingAlert"
      :title="t('driver.dashboard.verificationAlert')"
      type="warning"
      class="mb-24"
    >
      {{ t('driver.dashboard.verificationText') }}
      <NuxtLink to="/cabinet/driver/card-v2" class="alert-link">{{ t('driver.dashboard.verificationHere') }}</NuxtLink>.
      <template #footer>
        <n-button type="primary" size="small" @click="navigateTo('/cabinet/driver/card-v2')">
          {{ t('driver.dashboard.verificationButton') }}
        </n-button>
      </template>
    </n-alert>

    <n-card :title="t('driver.dashboard.title')" class="shadow-sm onboarding-card">
      <div class="stats-grid">
        <n-grid :cols="4" :x-gap="12">
          <n-gi>
            <n-statistic :label="t('driver.dashboard.activeOrders')" :value="0" />
          </n-gi>
          <n-gi>
            <n-statistic :label="t('driver.dashboard.completed')" :value="0" />
          </n-gi>
          <n-gi>
            <n-statistic :label="t('driver.dashboard.rating')" value="0.00" />
          </n-gi>
          <n-gi>
            <n-statistic :label="t('driver.dashboard.balance')" value="0 TMT" />
          </n-gi>
        </n-grid>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver',  })

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
.alert-link {
  color: var(--n-primary-color);
  text-decoration: underline;
  font-weight: 500;
}
.alert-link:hover {
  opacity: 0.9;
}
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
