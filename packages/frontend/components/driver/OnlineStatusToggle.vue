<template>
  <div class="online-toggle">
    <n-tooltip>
      <template #trigger>
        <n-switch
          :value="isOnline"
          :loading="loading"
          size="medium"
          @update:value="onChange"
        >
          <template #checked>{{ t('online.online') }}</template>
          <template #unchecked>{{ t('online.offline') }}</template>
        </n-switch>
      </template>
      {{ isOnline ? t('online.tooltipOnline') : t('online.tooltipOffline') }}
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t } = useI18n()
const { isOnline, setOnline, fetchStatus } = useDriverOnlineStatus()
const message = useMessage()
const loading = ref(false)

async function onChange(value: boolean) {
  loading.value = true
  try {
    await setOnline(value)
    message.success(value ? t('online.online') : t('online.offline'))
  } catch (e: any) {
    message.error(e?.message || t('common.error'))
    await fetchStatus()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.online-toggle {
  display: inline-flex;
  align-items: center;
}
</style>
