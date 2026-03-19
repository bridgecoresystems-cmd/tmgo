<template>
  <n-button
    type="primary"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <template #icon>
      <n-icon :component="AddOutline" />
    </template>
    {{ label || t('common.add') }}
  </n-button>
</template>

<script setup lang="ts">
import { AddOutline } from '@vicons/ionicons5'

withDefaults(defineProps<{
  loading?: boolean
  disabled?: boolean
  label?: string
  size?: 'tiny' | 'small' | 'medium' | 'large'
}>(), { size: 'medium' })
defineEmits(['click'])

const { t } = useI18n()
</script>
