<template>
  <n-button
    :size="size"
    :disabled="disabled"
    class="ui-cancel-btn"
    @click="$emit('click')"
  >
    <template #icon>
      <n-icon :component="CloseOutline" />
    </template>
    {{ label || t('common.cancel') }}
  </n-button>
</template>

<script setup lang="ts">
import { CloseOutline } from '@vicons/ionicons5'

withDefaults(defineProps<{
  disabled?: boolean
  label?: string
  size?: 'tiny' | 'small' | 'medium' | 'large'
}>(), { size: 'medium' })
defineEmits(['click'])

const { t } = useI18n()
</script>
