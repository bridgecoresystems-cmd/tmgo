<template>
  <div>
    <n-h3 style="margin: 0 0 20px 0;">Мой транспорт</n-h3>
    <n-empty description="Пока нет добавленного транспорта" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })
</script>
