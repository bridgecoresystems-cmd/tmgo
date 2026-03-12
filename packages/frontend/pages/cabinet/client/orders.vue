<template>
  <div>
    <n-h3 style="margin: 0 0 20px 0;">Мои заказы</n-h3>
    <n-empty description="Пока нет заказов" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-client', middleware: 'cabinet-auth' })
</script>
