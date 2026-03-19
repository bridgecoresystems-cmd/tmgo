<template>
  <div>
    <UiBackBtn class="no-print" to="/admin/users" />

    <n-spin v-if="userApi.loading" />
    <n-alert v-else-if="userApi.loadError" type="error" style="margin-bottom: 16px">
      {{ userApi.loadError }}
      <n-button size="small" style="margin-top: 8px" @click="load">{{ $t('common.retry') }}</n-button>
    </n-alert>

    <template v-else>
      <AdminUsersUserDetailHeader
        :user="userApi.user"
        :profile="userApi.profile"
        :role-tag-type="userApi.roleTagType"
        :can-verify="userApi.canVerify"
        :can-reject="userApi.canReject"
        :can-suspend="userApi.canSuspend"
        :can-restore="userApi.canRestore"
        :verifying="userApi.verifying"
        :rejecting="userApi.rejecting"
        :suspending="userApi.suspending"
        :restoring="userApi.restoring"
        :activating="userApi.activating"
        :deleting="userApi.deleting"
        @impersonate="userApi.handleImpersonate()"
        @verify="userApi.handleVerify()"
        @reject="userApi.handleReject()"
        @suspend="userApi.handleSuspend()"
        @restore="userApi.handleRestore()"
        @activate="userApi.handleActivate()"
        @delete-permanent="userApi.handleDeletePermanent()"
      />

      <AdminUsersUserDriverTabs
        v-if="userApi.user?.role === 'driver' && userApi.profile"
        ref="driverTabsRef"
        :profile="userApi.profile"
        :user-id="String(route.params.id)"
        :load-url="userApi.loadUrl"
        :save-url="userApi.saveUrl"
        :api-base="apiBase"
        :change-requests-filter="changeRequests.changeRequestsFilter"
        :change-requests="changeRequests.changeRequests"
        :change-requests-loading="changeRequests.changeRequestsLoading"
        :approving-request-id="changeRequests.approvingRequestId"
        :rejecting-request-id="changeRequests.rejectingRequestId"
        :field-label="changeRequests.fieldLabel"
        :status-label="changeRequests.statusLabel"
        :status-tag-type="changeRequests.statusTagType"
        @saved="onFormSaved"
        @update:filter="(v) => { changeRequests.changeRequestsFilter = v }"
        @fetch-requests="changeRequests.fetchChangeRequests()"
        @approve-request="(r) => changeRequests.openApproveModal(r)"
        @reject-request="(r) => changeRequests.openRejectModal(r)"
      />

      <AdminUsersUserNonDriverCard v-else :user="userApi.user" />

      <AdminUsersUserActionModals
        :reject-modal="userApi.rejectModal"
        :suspend-modal="userApi.suspendModal"
        :action-comment="userApi.actionComment"
        :approve-request-modal="changeRequests.approveRequestModal"
        :reject-request-modal="changeRequests.rejectRequestModal"
        :approve-request-comment="changeRequests.approveRequestComment"
        :approve-request-unlock-days="changeRequests.approveRequestUnlockDays"
        :reject-request-comment="changeRequests.rejectRequestComment"
        :rejecting="userApi.rejecting"
        :suspending="userApi.suspending"
        :approving-request-id="changeRequests.approvingRequestId"
        :rejecting-request-id="changeRequests.rejectingRequestId"
        @update:reject-modal="(v) => { userApi.rejectModal = v }"
        @update:suspend-modal="(v) => { userApi.suspendModal = v }"
        @update:action-comment="(v) => { userApi.actionComment = v }"
        @update:approve-request-modal="(v) => { changeRequests.approveRequestModal = v }"
        @update:reject-request-modal="(v) => { changeRequests.rejectRequestModal = v }"
        @update:approve-request-comment="(v) => { changeRequests.approveRequestComment = v }"
        @update:approve-request-unlock-days="(v) => { changeRequests.approveRequestUnlockDays = v }"
        @update:reject-request-comment="(v) => { changeRequests.rejectRequestComment = v }"
        @submit-reject="userApi.submitReject()"
        @submit-suspend="userApi.submitSuspend()"
        @submit-approve-request="changeRequests.submitApproveRequest()"
        @submit-reject-request="changeRequests.submitRejectRequest()"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { NButton, NSpin, NAlert } from 'naive-ui'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const { apiBase } = useApiBase()
const userApi = reactive(useAdminUser())
const changeRequests = reactive(useAdminChangeRequests(() => {
  userApi.onFormSaved()
}))

async function load() {
  await userApi.load()
  if (userApi.user?.role === 'driver') {
    await changeRequests.fetchChangeRequests()
  }
}

function onFormSaved() {
  userApi.onFormSaved()
  changeRequests.fetchChangeRequests()
}

onMounted(load)
watch(() => changeRequests.changeRequestsFilter, () => changeRequests.fetchChangeRequests())
</script>
