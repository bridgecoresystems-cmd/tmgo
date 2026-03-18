<template>
  <div>
    <n-tabs :value="filter" type="line" @update:value="(v) => { $emit('update:filter', v); $emit('fetch') }">
      <n-tab-pane name="pending" :tab="t('admin.changeRequestsPending')" />
      <n-tab-pane name="approved" :tab="t('admin.changeRequestsApproved')" />
      <n-tab-pane name="rejected" :tab="t('admin.changeRequestsRejected')" />
      <n-tab-pane name="all" :tab="t('admin.changeRequestsAll')" />
    </n-tabs>
    <n-spin :show="loading">
      <n-empty v-if="!loading && requests.length === 0" :description="t('admin.noRequests')" />
      <n-list v-else bordered>
        <n-list-item v-for="r in requests" :key="r.id">
          <n-thing>
            <template #header>
              <n-space align="center">
                <span>{{ fieldLabel(r.field_key) }}</span>
                <n-tag :type="statusTagType(r.status)" size="small">{{ statusLabel(r.status) }}</n-tag>
              </n-space>
            </template>
            <template #description>
              <p v-if="r.reason" style="margin: 4px 0;">{{ r.reason }}</p>
              <p v-if="r.requested_value" style="margin: 4px 0; font-size: 13px;">{{ t('admin.desiredValue') }}: {{ r.requested_value }}</p>
              <p v-if="r.admin_comment" style="margin: 4px 0; font-size: 12px; opacity: 0.9;">{{ t('admin.answer') }}: {{ r.admin_comment }}</p>
              <p style="margin: 4px 0; font-size: 12px; opacity: 0.7;">{{ r.requested_at }}</p>
            </template>
          </n-thing>
          <template #suffix>
            <n-space v-if="r.status === 'pending'">
              <n-button type="success" size="small" :loading="approvingId === r.id" @click="$emit('approve', r)">
                {{ t('admin.approve') }}
              </n-button>
              <n-button type="error" quaternary size="small" :loading="rejectingId === r.id" @click="$emit('reject', r)">
                {{ t('admin.reject') }}
              </n-button>
            </n-space>
          </template>
        </n-list-item>
      </n-list>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { NTabs, NTabPane, NSpin, NEmpty, NList, NListItem, NThing, NSpace, NTag, NButton } from 'naive-ui'

const { t } = useI18n()

defineProps<{
  filter: string
  requests: any[]
  loading: boolean
  approvingId: string | null
  rejectingId: string | null
  fieldLabel: (key: string) => string
  statusLabel: (s: string) => string
  statusTagType: (s: string) => string
}>()

defineEmits<{
  'update:filter': [value: string]
  fetch: []
  approve: [r: any]
  reject: [r: any]
}>()
</script>
