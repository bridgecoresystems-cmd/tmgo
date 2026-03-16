<template>
  <n-card>
    <n-descriptions :column="1" label-placement="left">
      <n-descriptions-item label="Имя">{{ user?.name || '—' }}</n-descriptions-item>
      <n-descriptions-item label="Email">{{ user?.email || '—' }}</n-descriptions-item>
      <n-descriptions-item label="Роль">{{ user?.role || '—' }}</n-descriptions-item>
      <n-descriptions-item label="Дата регистрации">{{ user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—' }}</n-descriptions-item>
    </n-descriptions>
    <n-text v-if="user?.role !== 'driver'" depth="3" style="display: block; margin-top: 16px;">
      Карточка водителя доступна только для пользователей с ролью «driver».
    </n-text>
  </n-card>
</template>

<script setup lang="ts">
import { NCard, NDescriptions, NDescriptionsItem, NText } from 'naive-ui'

defineProps<{
  user: any
}>()
</script>
