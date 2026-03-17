<template>
  <div class="user-detail-header">
    <n-h3 style="margin: 0;">{{ user?.name || user?.email || 'Пользователь' }}</n-h3>
    <n-space>
      <n-button
        v-if="user?.role !== 'admin' && user?.isActive"
        type="info"
        quaternary
        @click="$emit('impersonate')"
      >
        👤 Войти под пользователем
      </n-button>
      <n-tag v-if="!user?.isActive" type="error">Деактивирован</n-tag>
      <n-tag v-else-if="user?.role" :type="roleTagType">{{ user.role }}</n-tag>
      <n-tag v-if="profile?.verification_status === 'verified'" type="success">Верифицирован</n-tag>
      <n-tag v-else-if="profile?.verification_status === 'submitted' || profile?.verification_status === 'waiting_verification'" type="warning">Ожидает проверки</n-tag>
      <n-tag v-else-if="profile?.verification_status === 'request'" type="info">Запрос</n-tag>
      <n-tag v-else-if="profile?.verification_status === 'rejected'" type="error">Отклонён</n-tag>
      <n-tag v-else-if="profile?.verification_status === 'suspended'" type="error">Приостановлен</n-tag>
      <n-tag v-else-if="profile?.verification_status === 'not_verified' || profile?.verification_status === 'not_submitted'" type="default">Не верифицирован</n-tag>
      <n-space v-if="user?.role === 'driver' && profile" :size="8">
        <n-button type="info" quaternary @click="typeof window !== 'undefined' && window.print()">
          Печать
        </n-button>
        <n-button v-if="canVerify" type="primary" :loading="verifying" @click="$emit('verify')">
          Верифицировать
        </n-button>
        <n-button v-if="canReject" type="error" quaternary :loading="rejecting" @click="$emit('reject')">
          Отклонить
        </n-button>
        <n-button v-if="canSuspend" type="warning" quaternary :loading="suspending" @click="$emit('suspend')">
          Приостановить
        </n-button>
        <n-button v-if="canRestore" type="success" quaternary :loading="restoring" @click="$emit('restore')">
          Восстановить
        </n-button>
      </n-space>
      <n-button v-if="!user?.isActive" type="success" :loading="activating" @click="$emit('activate')">
        Восстановить
      </n-button>
      <n-popconfirm
        v-if="!user?.isActive"
        positive-text="Удалить"
        negative-text="Отмена"
        @positive-click="$emit('delete-permanent')"
      >
        <template #trigger>
          <n-button type="error" :loading="deleting" quaternary>
            Удалить навсегда
          </n-button>
        </template>
        Удалить пользователя навсегда? Все данные будут безвозвратно потеряны.
      </n-popconfirm>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { NH3, NSpace, NButton, NTag, NPopconfirm } from 'naive-ui'

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
