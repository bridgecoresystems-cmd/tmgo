<template>
  <n-button
    type="primary"
    ghost
    :size="size"
    :disabled="disabled"
    class="ui-edit-btn"
    @click="$emit('click')"
  >
    <template #icon>
      <n-icon :component="CreateOutline" />
    </template>
    {{ label || t('common.edit') }}
  </n-button>
</template>

<script setup lang="ts">
import { CreateOutline } from '@vicons/ionicons5'

withDefaults(defineProps<{
  disabled?: boolean
  label?: string
  size?: 'tiny' | 'small' | 'medium' | 'large'
}>(), { size: 'small' })
defineEmits(['click'])

const { t } = useI18n()
</script>
