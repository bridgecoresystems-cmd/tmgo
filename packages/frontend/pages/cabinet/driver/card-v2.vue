<template>
  <div>
    <div class="card-header mb-24">
      <n-h2 style="margin: 0;">Карточка водителя (Новая форма V2)</n-h2>
      <n-text depth="3">Заполните все разделы для прохождения верификации</n-text>
    </div>

    <DriverProfileVerificationStatus />

    <n-card class="shadow-sm">
      <DriverCardV2 :is-driver-context="true" @submitted="onSubmitted" @saved="onSaved" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

useSeoMeta({ title: 'Карточка водителя V2 — BridgeCore Systems' })

const { fetchStatus: refreshVerification } = useDriverVerificationStatus()
const { fetchAlerts } = useDriverAlerts()

function onSaved() {
  refreshVerification()
  fetchAlerts()
}

function onSubmitted() {
  refreshVerification()
  fetchAlerts()
}
</script>

<style scoped>
.mb-24 { margin-bottom: 24px; }
.shadow-sm {
  box-shadow: 0 4px 24px rgba(0,0,0,0.05);
}
.card-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}
</style>
