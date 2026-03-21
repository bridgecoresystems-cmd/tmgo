<template>
  <div>
    <UiBackBtn to="/admin/settings" :label="$t('admin.settingsPage.title')" />

    <n-alert v-if="loadError" type="error" closable style="margin-bottom: 16px">
      {{ loadError }}
      <template #footer>
        <n-button size="small" @click="loadUsers">{{ $t('admin.deactivatedPage.retry') }}</n-button>
      </template>
    </n-alert>

    <n-h4 style="margin: 0 0 16px 0;">{{ $t('admin.deactivatedPage.title') }}</n-h4>
    <n-text depth="3" style="display: block; margin-bottom: 20px;">
      {{ $t('admin.deactivatedPage.subtitle') }}
    </n-text>

    <n-data-table
      :columns="columns"
      :data="filteredUsers"
      :loading="loading"
      :pagination="{ pageSize: 20 }"
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => navigateTo(`/admin/users/${row.id}`) })"
      striped
    />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, NButton, NPopconfirm, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'admin',  })

const { t } = useI18n()
const { apiBase } = useApiBase()
const message = useMessage()
const search = ref('')
const loading = ref(true)
const loadError = ref<string | null>(null)
const users = ref<any[]>([])

const roleColors: Record<string, string> = {
  admin: 'error',
  dispatcher: 'warning',
  driver: 'info',
  client: 'default',
}

function getVerificationTag(status: string | null) {
  const s = status ?? 'not_verified'
  const labels: Record<string, string> = {
    not_verified: t('admin.deactivatedPage.verificationNotVerified'),
    waiting_verification: t('admin.deactivatedPage.verificationWaiting'),
    verified: t('admin.deactivatedPage.verificationVerified'),
  }
  const types: Record<string, string> = {
    not_verified: 'default',
    waiting_verification: 'warning',
    verified: 'success',
  }
  return h(NTag, { type: types[s] || 'default', size: 'small' }, { default: () => labels[s] || s })
}

const deletingId = ref<string | null>(null)

const columns = computed<DataTableColumns>(() => [
  {
    title: t('admin.deactivatedPage.columnName'),
    key: 'name',
    ellipsis: true,
    render: (row) => row.driverName || row.name || row.email || '—',
  },
  { title: t('admin.deactivatedPage.columnEmail'), key: 'email', ellipsis: true },
  {
    title: t('admin.deactivatedPage.columnRole'),
    key: 'role',
    render: (row) => h(NTag, { type: roleColors[row.role as string] || 'default', size: 'small' }, { default: () => row.role }),
  },
  {
    title: t('admin.deactivatedPage.columnVerification'),
    key: 'verification_status',
    width: 140,
    render: (row: any) => row.role === 'driver' ? getVerificationTag(row.verification_status ?? null) : '—',
  },
  {
    title: t('admin.deactivatedPage.columnRegisteredAt'),
    key: 'createdAt',
    render: (row) => new Date(row.createdAt as string).toLocaleDateString('ru-RU'),
  },
  {
    title: t('admin.deactivatedPage.columnActions'),
    key: 'actions',
    width: 200,
    render: (row: any) =>
      h(NPopconfirm, {
        onPositiveClick: () => handleDeletePermanent(String(row.id)),
        positiveText: t('admin.deactivatedPage.deletePermanent'),
        negativeText: t('admin.deactivatedPage.deleteCancel'),
      }, {
        default: () => t('admin.deactivatedPage.deleteConfirm'),
        trigger: () =>
          h(NButton, {
            size: 'small',
            type: 'error',
            quaternary: true,
            loading: deletingId.value === row.id,
            onClick: (e: Event) => e.stopPropagation(),
          }, { default: () => t('admin.deactivatedPage.deletePermanent') }),
      }),
  },
])

const filteredUsers = computed(() => {
  let list = Array.isArray(users.value) ? users.value : []
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter(
    (u) =>
      u.email?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      (u.driverName && String(u.driverName).toLowerCase().includes(q))
  )
})

async function handleDeletePermanent(id: string) {
  deletingId.value = id
  try {
    await $fetch(`${apiBase}/admin/users/${id}`, { method: 'DELETE', credentials: 'include' })
    message.success(t('admin.deactivatedPage.userDeleted'))
    users.value = users.value.filter((u) => u.id !== id)
  } catch (e: any) {
    message.error(e?.data?.error || e?.data?.message || e?.message || t('common.error'))
  } finally {
    deletingId.value = null
  }
}

async function loadUsers() {
  loadError.value = null
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${apiBase}/admin/users?inactive_only=1`, { credentials: 'include' })
    users.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || t('admin.deactivatedPage.loadError')
    message.error(loadError.value)
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)
</script>
