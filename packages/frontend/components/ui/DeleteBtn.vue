<template>
  <n-popconfirm
    :positive-text="t('common.yes')"
    :negative-text="t('common.cancel')"
    @positive-click="$emit('confirm')"
  >
    <template #trigger>
      <n-button
        :type="danger ? 'error' : 'warning'"
        :size="size"
        :loading="loading"
        :disabled="disabled"
        ghost
        class="ui-delete-btn"
      >
        <template #icon>
          <n-icon :component="icon === 'unlink' ? UnlinkOutline : TrashOutline" />
        </template>
        {{ label || t('common.delete') }}
      </n-button>
    </template>
    {{ confirmText || t('common.deleteConfirm') }}
  </n-popconfirm>
</template>

<script setup lang="ts">
import { TrashOutline, UnlinkOutline } from '@vicons/ionicons5'

withDefaults(defineProps<{
  loading?: boolean
  disabled?: boolean
  label?: string
  confirmText?: string
  size?: 'tiny' | 'small' | 'medium' | 'large'
  danger?: boolean
  icon?: 'trash' | 'unlink'
}>(), { size: 'small', danger: true, icon: 'trash' })
defineEmits(['confirm'])

const { t } = useI18n()
</script>
