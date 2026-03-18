<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/cabinet/driver/vehicles')">
      {{ t('common.backToList') }}
    </n-button>
    <n-card :title="t('driver.vehicles.vehicleTitle')">
      <n-empty :description="t('common.inDevelopment')" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })
</script>
