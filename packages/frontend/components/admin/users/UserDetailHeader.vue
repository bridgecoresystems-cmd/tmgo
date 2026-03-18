<template>
  <div class="user-detail-header">
    <n-h3 style="margin: 0;">{{ user?.name || user?.email || t('admin.user') }}</n-h3>
    <n-space>
      <n-button
        v-if="user?.role !== 'admin' && user?.isActive"
        type="info"
        quaternary
        @click="$emit('impersonate')"
      >
        👤 {{ t('admin.impersonate') }}
      </n-button>
      <n-tag v-if="!user?.isActive" type="error">{{ t('admin.deactivated') }}</n-tag>
      <n-tag v-else-if="user?.role" :type="roleTagType">{{ user.role }}</n-tag>
      <n-tag v-if="profile?.verification_status === 'verified'" type="success">{{ t('admin.verified') }}</n-tag>
      <n-tag v-else-if="profile?.verification_status === 'submitted' || profile?.verification_status === 'waiting_verification'" type="warning">{{ t('admin.waitingVerification') }}</n-tag>
      <n-tag v-else-if="profile?.verification_status === 'request'" type="info">{{ t('admin.request') }}</n-tag>
      <n-tag v-else-if="profile?.verification_status === 'rejected'" type="error">{{ t('admin.rejected') }}</n-tag>
      <n-tag v-else-if="profile?.verification_status === 'suspended'" type="error">{{ t('admin.suspended') }}</n-tag>
      <n-tag v-else-if="profile?.verification_status === 'not_verified' || profile?.verification_status === 'not_submitted'" type="default">{{ t('admin.notVerified') }}</n-tag>
      <n-space v-if="user?.role === 'driver' && profile" :size="8">
        <n-button type="info" quaternary @click="typeof window !== 'undefined' && window.print()">
          {{ t('admin.print') }}
        </n-button>
        <n-button v-if="canVerify" type="primary" :loading="verifying" @click="$emit('verify')">
          {{ t('admin.verify') }}
        </n-button>
        <n-button v-if="canReject" type="error" quaternary :loading="rejecting" @click="$emit('reject')">
          {{ t('admin.reject') }}
        </n-button>
        <n-button v-if="canSuspend" type="warning" quaternary :loading="suspending" @click="$emit('suspend')">
          {{ t('admin.suspend') }}
        </n-button>
        <n-button v-if="canRestore" type="success" quaternary :loading="restoring" @click="$emit('restore')">
          {{ t('admin.restore') }}
        </n-button>
      </n-space>
      <n-button v-if="!user?.isActive" type="success" :loading="activating" @click="$emit('activate')">
        {{ t('admin.restore') }}
      </n-button>
      <n-popconfirm
        v-if="!user?.isActive"
        :positive-text="t('common.delete')"
        :negative-text="t('common.cancel')"
        @positive-click="$emit('delete-permanent')"
      >
        <template #trigger>
          <n-button type="error" :loading="deleting" quaternary>
            {{ t('admin.deletePermanent') }}
          </n-button>
        </template>
        {{ t('admin.deletePermanentConfirm') }}
      </n-popconfirm>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { NH3, NSpace, NButton, NTag, NPopconfirm } from 'naive-ui'

const { t } = useI18n()

defineProps<{
  user: any
  profile: any
  roleTagType: string
  canVerify: boolean
  canReject: boolean
  canSuspend: boolean
  canRestore: boolean
  verifying: boolean
  rejecting: boolean
  suspending: boolean
  restoring: boolean
  activating: boolean
  deleting: boolean
}>()

defineEmits<{
  impersonate: []
  verify: []
  reject: []
  suspend: []
  restore: []
  activate: []
  'delete-permanent': []
}>()
</script>

<style scoped>
.user-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
