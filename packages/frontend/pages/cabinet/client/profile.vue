<template>
  <div>
    <n-h3 style="margin: 0 0 20px 0;">Профиль</n-h3>
    <n-descriptions :column="1" bordered>
      <n-descriptions-item label="Имя">{{ session?.user?.name }}</n-descriptions-item>
      <n-descriptions-item label="Email">{{ session?.user?.email }}</n-descriptions-item>
      <n-descriptions-item label="Роль">Заказчик</n-descriptions-item>
    </n-descriptions>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-client', middleware: 'cabinet-auth' })

const { session } = useAuth()
</script>
