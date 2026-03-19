<template>
  <n-button
    type="primary"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    class="ui-save-btn"
    @click="$emit('click')"
  >
    <template #icon>
      <n-icon :component="SaveOutline" />
    </template>
    {{ label || t('common.save') }}
  </n-button>
</template>

<script setup lang="ts">
import { SaveOutline } from '@vicons/ionicons5'

withDefaults(defineProps<{
  loading?: boolean
  disabled?: boolean
  label?: string
  size?: 'tiny' | 'small' | 'medium' | 'large'
}>(), { size: 'medium' })
defineEmits(['click'])

const { t } = useI18n()
</script>
