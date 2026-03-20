<template>
  <div class="my-card-page">
    <div class="page-header no-print">
      <div class="header-left">
        <n-h3 style="margin: 0; line-height: 1.3;">{{ t('driver.card.myCardTitle') }}</n-h3>
        <n-text depth="3" style="font-size: 13px;">{{ t('driver.card.myCardSubtitle') }}</n-text>
      </div>
      <n-button type="primary" size="small" @click="doPrint">
        {{ t('driver.card.print') }}
      </n-button>
    </div>

    <div class="card-wrapper print-area">
      <DriverCardView :is-driver-context="true" />
    </div>
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
.my-card-page {
  max-width: 960px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-wrapper {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

@media print {
  .no-print {
    display: none !important;
  }
  .card-wrapper {
    box-shadow: none;
    border: none;
  }
}
</style>
