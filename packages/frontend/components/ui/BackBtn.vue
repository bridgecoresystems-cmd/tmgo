<template>
  <n-button
    quaternary
    size="small"
    class="ui-back-btn"
    @click="to ? navigateTo(to) : $emit('click')"
  >
    <template #icon>
      <n-icon :component="ArrowBackOutline" />
    </template>
    {{ label || t('common.backToList') }}
  </n-button>
</template>

<script setup lang="ts">
import { ArrowBackOutline } from '@vicons/ionicons5'

defineProps<{
  to?: string
  label?: string
}>()
defineEmits(['click'])

const { t } = useI18n()
</script>

<style scoped>
.ui-back-btn {
  margin-bottom: 16px;
  font-weight: 500;
  color: var(--n-text-color-2);
  transition: color 0.2s;
}
.ui-back-btn:hover {
  color: var(--n-primary-color);
}
</style>
