<template>
  <n-tabs type="line" animated class="admin-driver-tabs">
    <n-tab-pane name="card" tab="Карточка">
      <n-card embedded :bordered="false" class="mt-16">
        <DriverCardView :is-driver-context="false" :initial-profile="profile" />
      </n-card>
    </n-tab-pane>
    <n-tab-pane name="edit" tab="Редактирование">
      <n-card embedded :bordered="false" class="mt-16">
        <AdminUsersAdminDriverCardForm
          ref="formRef"
          :load-url="loadUrl"
          :save-url="saveUrl"
          :api-base="apiBase"
          :initial-profile="profile"
          @saved="$emit('saved')"
        />
      </n-card>
    </n-tab-pane>
    <n-tab-pane name="requests" tab="Запросы">
      <n-card embedded :bordered="false" class="mt-16">
        <AdminUsersChangeRequestsTab
          :filter="changeRequestsFilter"
          :requests="changeRequests"
          :loading="changeRequestsLoading"
          :approving-id="approvingRequestId"
          :rejecting-id="rejectingRequestId"
          :field-label="fieldLabel"
          :status-label="statusLabel"
          :status-tag-type="statusTagType"
          @update:filter="(v) => $emit('update:filter', v)"
          @fetch="$emit('fetch-requests')"
          @approve="$emit('approve-request', $event)"
          @reject="$emit('reject-request', $event)"
        />
      </n-card>
    </n-tab-pane>
  </n-tabs>
</template>

<script setup lang="ts">
import { NTabs, NTabPane, NCard } from 'naive-ui'

defineProps<{
  profile: any
  loadUrl: string
  saveUrl: string
  apiBase: string
  changeRequestsFilter: string
  changeRequests: any[]
  changeRequestsLoading: boolean
  approvingRequestId: string | null
  rejectingRequestId: string | null
  fieldLabel: (key: string) => string
  statusLabel: (s: string) => string
  statusTagType: (s: string) => string
}>()

defineEmits<{
  saved: []
  'update:filter': [value: string]
  'fetch-requests': []
  'approve-request': [r: any]
  'reject-request': [r: any]
}>()

const formRef = ref<{ loadProfile: () => Promise<void>; handleSave: () => Promise<void> } | null>(null)
defineExpose({ formRef })
</script>

<style scoped>
.mt-16 { margin-top: 16px; }
.admin-driver-tabs { margin-top: 8px; }
</style>
