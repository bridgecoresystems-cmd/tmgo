<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/cabinet/driver/vehicles')">
      ← Назад к списку
    </n-button>
    <n-card title="Транспорт">
      <n-empty description="Страница в разработке" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })
</script>
