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
          <template #checked>Онлайн</template>
          <template #unchecked>Оффлайн</template>
        </n-switch>
      </template>
      {{ isOnline ? 'Вы онлайн — доступны для заказов' : 'Вы оффлайн' }}
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { isOnline, setOnline, fetchStatus } = useDriverOnlineStatus()
const message = useMessage()
const loading = ref(false)

async function onChange(value: boolean) {
  loading.value = true
  try {
    await setOnline(value)
    message.success(value ? 'Вы онлайн' : 'Вы оффлайн')
  } catch (e: any) {
    message.error(e?.message || 'Ошибка')
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
