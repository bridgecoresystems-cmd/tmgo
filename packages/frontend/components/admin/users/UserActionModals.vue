<template>
  <div>
    <n-modal :show="rejectModal" preset="card" :title="t('admin.rejectVerification')" style="max-width: 450px" @update:show="$emit('update:rejectModal', $event)">
      <n-form-item :label="t('admin.rejectReasonRequired')">
        <n-input :value="actionComment" type="textarea" :placeholder="t('admin.specifyReason')" :rows="3" @update:value="$emit('update:actionComment', $event)" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="$emit('update:rejectModal', false)">{{ t('common.cancel') }}</n-button>
          <n-button type="error" :loading="rejecting" @click="$emit('submit-reject')">{{ t('admin.reject') }}</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal :show="suspendModal" preset="card" :title="t('admin.suspendDriver')" style="max-width: 450px" @update:show="$emit('update:suspendModal', $event)">
      <n-form-item :label="t('admin.suspendReasonRequired')">
        <n-input :value="actionComment" type="textarea" :placeholder="t('admin.specifyReason')" :rows="3" @update:value="$emit('update:actionComment', $event)" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="$emit('update:suspendModal', false)">{{ t('common.cancel') }}</n-button>
          <n-button type="warning" :loading="suspending" @click="$emit('submit-suspend')">{{ t('admin.suspend') }}</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal :show="approveRequestModal" preset="card" :title="t('admin.approveRequest')" style="max-width: 400px" @update:show="$emit('update:approveRequestModal', $event)">
      <n-form-item :label="t('admin.commentOptional')">
        <n-input :value="approveRequestComment" type="textarea" :placeholder="t('admin.commentForDriver')" :rows="2" @update:value="$emit('update:approveRequestComment', $event)" />
      </n-form-item>
      <n-form-item :label="t('admin.unlockDays')">
        <n-input-number :value="approveRequestUnlockDays" :min="1" :max="90" @update:value="$emit('update:approveRequestUnlockDays', $event)" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="$emit('update:approveRequestModal', false)">{{ t('common.cancel') }}</n-button>
          <n-button type="success" :loading="!!approvingRequestId" @click="$emit('submit-approve-request')">{{ t('admin.approve') }}</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal :show="rejectRequestModal" preset="card" :title="t('admin.rejectRequest')" style="max-width: 400px" @update:show="$emit('update:rejectRequestModal', $event)">
      <n-form-item :label="t('admin.rejectReasonRequiredShort')">
        <n-input :value="rejectRequestComment" type="textarea" :placeholder="t('admin.specifyReason')" :rows="3" @update:value="$emit('update:rejectRequestComment', $event)" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="$emit('update:rejectRequestModal', false)">{{ t('common.cancel') }}</n-button>
          <n-button
            type="error"
            :loading="!!rejectingRequestId"
            :disabled="!rejectRequestComment?.trim()"
            @click="$emit('submit-reject-request')"
          >
            {{ t('admin.reject') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { NModal, NFormItem, NInput, NSpace, NButton, NInputNumber } from 'naive-ui'

const { t } = useI18n()

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
