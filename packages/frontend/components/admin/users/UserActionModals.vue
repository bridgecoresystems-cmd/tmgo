<template>
  <div>
    <n-modal :show="rejectModal" preset="card" title="Отклонить верификацию" style="max-width: 450px" @update:show="$emit('update:rejectModal', $event)">
      <n-form-item label="Причина отклонения (обязательно)">
        <n-input :value="actionComment" type="textarea" placeholder="Укажите причину..." :rows="3" @update:value="$emit('update:actionComment', $event)" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="rejectModal = false">Отмена</n-button>
          <n-button type="error" :loading="rejecting" @click="$emit('submit-reject')">Отклонить</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal :show="suspendModal" preset="card" title="Приостановить водителя" style="max-width: 450px" @update:show="$emit('update:suspendModal', $event)">
      <n-form-item label="Причина приостановки (обязательно)">
        <n-input :value="actionComment" type="textarea" placeholder="Укажите причину..." :rows="3" @update:value="$emit('update:actionComment', $event)" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="suspendModal = false">Отмена</n-button>
          <n-button type="warning" :loading="suspending" @click="$emit('submit-suspend')">Приостановить</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal :show="approveRequestModal" preset="card" title="Одобрить запрос" style="max-width: 400px" @update:show="$emit('update:approveRequestModal', $event)">
      <n-form-item label="Комментарий (опционально)">
        <n-input :value="approveRequestComment" type="textarea" placeholder="Комментарий для водителя" :rows="2" @update:value="$emit('update:approveRequestComment', $event)" />
      </n-form-item>
      <n-form-item label="Срок разблокировки (дней)">
        <n-input-number :value="approveRequestUnlockDays" :min="1" :max="90" @update:value="$emit('update:approveRequestUnlockDays', $event)" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="approveRequestModal = false">Отмена</n-button>
          <n-button type="success" :loading="!!approvingRequestId" @click="$emit('submit-approve-request')">Одобрить</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal :show="rejectRequestModal" preset="card" title="Отклонить запрос" style="max-width: 400px" @update:show="$emit('update:rejectRequestModal', $event)">
      <n-form-item label="Причина отклонения (обязательно)">
        <n-input :value="rejectRequestComment" type="textarea" placeholder="Укажите причину..." :rows="3" @update:value="$emit('update:rejectRequestComment', $event)" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="rejectRequestModal = false">Отмена</n-button>
          <n-button
            type="error"
            :loading="!!rejectingRequestId"
            :disabled="!rejectRequestComment?.trim()"
            @click="$emit('submit-reject-request')"
          >
            Отклонить
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { NModal, NFormItem, NInput, NSpace, NButton, NInputNumber } from 'naive-ui'

defineProps<{
  rejectModal: boolean
  suspendModal: boolean
  actionComment: string
  rejecting: boolean
  suspending: boolean
  approveRequestModal: boolean
  rejectRequestModal: boolean
  approveRequestComment: string
  approveRequestUnlockDays: number
  rejectRequestComment: string
  approvingRequestId: string | null
  rejectingRequestId: string | null
}>()

defineEmits<{
  'update:rejectModal': [v: boolean]
  'update:suspendModal': [v: boolean]
  'update:approveRequestModal': [v: boolean]
  'update:rejectRequestModal': [v: boolean]
  'update:actionComment': [v: string]
  'update:approveRequestComment': [v: string]
  'update:approveRequestUnlockDays': [v: number]
  'update:rejectRequestComment': [v: string]
  'submit-reject': []
  'submit-suspend': []
  'submit-approve-request': []
  'submit-reject-request': []
}>()
</script>
