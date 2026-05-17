<template>
  <n-card>
    <n-descriptions :column="1" :label-placement="isMobile ? 'top' : 'left'" :label-width="isMobile ? undefined : 160">
      <n-descriptions-item :label="t('admin.name')">{{ user?.name || '—' }}</n-descriptions-item>
      <n-descriptions-item :label="t('admin.email')">{{ user?.email || '—' }}</n-descriptions-item>
      <n-descriptions-item :label="t('admin.role')">{{ user?.role || '—' }}</n-descriptions-item>
      <n-descriptions-item :label="t('admin.registrationDate')">{{ user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—' }}</n-descriptions-item>
    </n-descriptions>
    <n-text v-if="user?.role !== 'driver'" depth="3" style="display: block; margin-top: 16px;">
      {{ t('admin.driverCardOnlyForDrivers') }}
    </n-text>
  </n-card>
</template>

<script setup lang="ts">
import { NCard, NDescriptions, NDescriptionsItem, NText } from 'naive-ui'

const { t } = useI18n()

defineProps<{
  user: any
}>()

const isMobile = ref(false)
onMounted(() => {
  isMobile.value = window.innerWidth < 640
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 640 })
})
</script>
