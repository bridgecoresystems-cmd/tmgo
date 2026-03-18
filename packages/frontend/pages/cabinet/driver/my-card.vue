<template>
  <div>
    <div class="card-header mb-24">
      <div class="header-row">
        <div>
          <n-h2 style="margin: 0;">{{ t('driver.card.myCardTitle') }}</n-h2>
          <n-text depth="3">{{ t('driver.card.myCardSubtitle') }}</n-text>
        </div>
        <n-button type="primary" @click="doPrint">
          {{ t('driver.card.print') }}
        </n-button>
      </div>
    </div>

    <n-card class="shadow-sm print-card print-area">
      <DriverCardView :is-driver-context="true" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

useSeoMeta({ title: t('driver.card.myCardPageTitle') })

function doPrint() {
  if (typeof window !== 'undefined') window.print()
}
</script>

<style scoped>
.mb-24 { margin-bottom: 24px; }
.shadow-sm {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
}
.card-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
@media print {
  .card-header {
    display: none !important;
  }
}
</style>
