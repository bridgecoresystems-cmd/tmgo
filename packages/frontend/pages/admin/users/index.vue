<template>
  <div>
    <n-alert v-if="loadError" type="error" closable style="margin-bottom: 16px">
      {{ loadError }}
      <template #footer>
        <n-button size="small" type="primary" ghost @click="loadUsers">{{ $t('common.retry') }}</n-button>
      </template>
    </n-alert>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <n-h3 style="margin: 0;">{{ $t('admin.usersIndex.title') }}</n-h3>
      <n-space>
        <UiAddBtn :label="$t('admin.usersIndex.addUser')" @click="showAddModal = true" />
        <n-button quaternary size="small" @click="navigateTo('/admin/settings/deactivated-users')">{{ $t('admin.usersIndex.deactivated') }}</n-button>
        <n-select
          v-model:value="verificationFilter"
          :options="verificationFilterOptions"
          :placeholder="$t('admin.usersIndex.verificationPlaceholder')"
          clearable
          style="width: 180px"
        />
        <n-select
          v-model:value="onlineFilter"
          :options="onlineFilterOptions"
          :placeholder="$t('admin.usersIndex.onlinePlaceholder')"
          clearable
          style="width: 140px"
        />
        <n-input v-model:value="search" :placeholder="$t('admin.usersIndex.searchPlaceholder')" style="width: 280px;" clearable />
      </n-space>
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredUsers"
      :loading="loading"
      :pagination="pagination"
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => navigateTo(`/admin/users/${row.id}`) })"
      striped
      @update:page="pagination.page = $event"
      @update:page-size="onPageSizeChange"
    />

    <n-modal v-model:show="showAddModal" preset="card" :title="$t('admin.usersIndex.modalTitle')" style="max-width: 420px" @after-leave="resetAddForm">
      <n-form ref="addFormRef" :model="addForm" :rules="addRules" label-placement="top">
        <n-form-item :label="$t('admin.usersIndex.emailLabel')" path="email" required>
          <n-input v-model:value="addForm.email" :placeholder="$t('admin.usersIndex.emailPlaceholder')" type="email" />
        </n-form-item>
        <n-form-item :label="$t('admin.usersIndex.nameLabel')" path="name">
          <n-input v-model:value="addForm.name" :placeholder="$t('admin.usersIndex.namePlaceholder')" />
        </n-form-item>
        <n-form-item :label="$t('admin.usersIndex.passwordLabel')" path="password" required>
          <n-input v-model:value="addForm.password" type="password" show-password-on="click" :placeholder="$t('admin.usersIndex.passwordPlaceholder')" />
        </n-form-item>
        <n-form-item :label="$t('admin.usersIndex.roleLabel')" path="role" required>
          <n-select v-model:value="addForm.role" :options="addRoleOptions" :placeholder="$t('admin.usersIndex.rolePlaceholder')" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <UiCancelBtn @click="showAddModal = false" />
          <UiSaveBtn :loading="adding" :label="$t('admin.usersIndex.create')" @click="handleAddUser" />
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, NButton, NPopconfirm, NTooltip, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'admin',  })

const { t } = useI18n()
const { apiBase } = useApiBase()
const { session } = useAuth()
const message = useMessage()
const { impersonate } = useImpersonate()
const dialog = useDialog()
const search = ref('')
const verificationFilter = ref<string | null>(null)
const onlineFilter = ref<string | null>(null)
const loading = ref(true)
const showAddModal = ref(false)
const adding = ref(false)
const addFormRef = ref<any>(null)
const addForm = reactive({
  email: '',
  name: '',
  password: '',
  role: 'admin' as 'admin' | 'dispatcher',
})
const addRoleOptions = computed(() => [
  { label: t('admin.usersIndex.roleAdmin'), value: 'admin' },
  { label: t('admin.usersIndex.roleDispatcher'), value: 'dispatcher' },
])
const addRules = computed(() => ({
  email: { required: true, message: t('admin.usersIndex.validationEmail'), trigger: 'blur' as const },
  password: { required: true, message: t('admin.usersIndex.validationPassword'), trigger: 'blur' as const },
  role: { required: true, message: t('admin.usersIndex.validationRole'), trigger: 'change' as const },
}))
const loadError = ref<string | null>(null)
const users = ref<any[]>([])

const PAGE_SIZE_KEY = 'admin:users:pageSize'
const savedPageSize = parseInt(localStorage.getItem(PAGE_SIZE_KEY) || '20', 10)
const pagination = reactive({
  page: 1,
  pageSize: [10, 20, 50, 100].includes(savedPageSize) ? savedPageSize : 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix: ({ itemCount }: { itemCount: number }) => `Всего: ${itemCount}`,
})

function onPageSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  localStorage.setItem(PAGE_SIZE_KEY, String(size))
}

const roleColors: Record<string, any> = {
  admin: 'error',
  dispatcher: 'warning',
  driver: 'info',
  client: 'default',
}

const verificationFilterOptions = computed(() => [
  { label: t('admin.usersIndex.verificationNotVerified'), value: 'not_verified' },
  { label: t('admin.usersIndex.verificationWaiting'), value: 'waiting_verification' },
  { label: t('admin.usersIndex.verificationRequest'), value: 'request' },
  { label: t('admin.usersIndex.verificationVerified'), value: 'verified' },
])

const onlineFilterOptions = computed(() => [
  { label: t('admin.usersIndex.online'), value: 'online' },
  { label: t('admin.usersIndex.offline'), value: 'offline' },
])

const activeAdminCount = ref(0)
function isLastAdmin(row: { role?: string }) {
  return row.role === 'admin' && activeAdminCount.value <= 1
}

const roleLabels: Record<string, string> = {
  admin: 'admin.usersIndex.roleAdmin',
  dispatcher: 'admin.usersIndex.roleDispatcher',
  driver: 'admin.usersIndex.roleDriver',
  client: 'admin.usersIndex.roleClient',
}

function getVerificationTag(status: string | null) {
  const s = status ?? 'not_verified'
  const labels: Record<string, string> = {
    not_verified: t('admin.usersIndex.verificationNotVerified'),
    waiting_verification: t('admin.usersIndex.verificationWaiting'),
    request: t('admin.usersIndex.verificationRequest'),
    verified: t('admin.usersIndex.verificationVerified'),
  }
  const types: Record<string, string> = {
    not_verified: 'default',
    waiting_verification: 'warning',
    request: 'info',
    verified: 'success',
  }
  return h(NTag, { type: types[s] || 'default', size: 'small' }, { default: () => labels[s] || s })
}

const columns = computed<DataTableColumns>(() => [
  {
    title: t('admin.usersIndex.columnName'),
    key: 'name',
    ellipsis: true,
    render: (row) => row.driverName || row.name || row.email || '—',
  },
  { title: t('admin.usersIndex.columnEmail'), key: 'email', ellipsis: true },
  {
    title: t('admin.usersIndex.columnRole'),
    key: 'role',
    render: (row) => {
      const role = row.role as string
      const label = roleLabels[role] ? t(roleLabels[role]) : role
      return h(NTag, { type: roleColors[role] || 'default', size: 'small' }, { default: () => label })
    },
  },
  {
    title: t('admin.usersIndex.columnVerification'),
    key: 'verification_status',
    width: 140,
    render: (row) => row.role === 'driver' ? getVerificationTag(row.verification_status) : '—',
  },
  {
    title: t('admin.usersIndex.columnOnline'),
    key: 'is_online',
    width: 90,
    render: (row) => {
      if (row.role !== 'driver') return '—'
      const online = row.is_online === true
      return h(NTag, {
        type: online ? 'success' : 'default',
        size: 'small',
      }, { default: () => online ? t('admin.usersIndex.online') : t('admin.usersIndex.offline') })
    },
  },
  {
    title: '',
    key: 'actions',
    width: 96,
    render: (row) => {
      const canDelete = row.id !== session?.user?.id && !isLastAdmin(row);
      const canImpersonate = row.role !== 'admin' && row.id !== session?.user?.id;
      return h('div', { style: 'display: flex; align-items: center; gap: 4px;' }, [
        canImpersonate
          ? h(NTooltip, null, {
              trigger: () => h(NButton, {
                quaternary: true,
                type: 'info',
                size: 'small',
                circle: true,
                onClick: (e: Event) => {
                  e.stopPropagation();
                  handleImpersonate(row);
                },
              }, { default: () => '👤' }),
              default: () => t('admin.usersIndex.impersonateTooltip'),
            })
          : null,
        canDelete
          ? h(NPopconfirm, {
              onPositiveClick: () => handleDeactivate(row),
              positiveText: t('common.yes'),
              negativeText: t('admin.usersIndex.cancel'),
            }, {
              trigger: () => h(NButton, {
                quaternary: true,
                type: 'error',
                size: 'small',
                circle: true,
                onClick: (e: Event) => e.stopPropagation(),
              }, { default: () => '×' }),
              default: () => t('admin.usersIndex.deactivateConfirm'),
            })
          : null,
      ].filter(Boolean));
    },
  },
])

const filteredUsers = computed(() => {
  let list = Array.isArray(users.value) ? users.value : []
  if (verificationFilter.value) {
    list = list.filter((u) => {
      if (u.role !== 'driver') return false
      const s = u.verification_status ?? 'not_verified'
      return s === verificationFilter.value
    })
  }
  if (onlineFilter.value) {
    list = list.filter((u) => {
      if (u.role !== 'driver') return false
      const online = u.is_online === true
      return onlineFilter.value === 'online' ? online : !online
    })
  }
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter(
    (u) =>
      u.email?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      (u.driverName && String(u.driverName).toLowerCase().includes(q))
  )
})

async function loadUsers() {
  loadError.value = null
  loading.value = true
  try {
    const url = `${apiBase || ''}/admin/users`
    const data = await $fetch<any[]>(url, { credentials: 'include' })
    users.value = Array.isArray(data) ? data : []
    activeAdminCount.value = users.value.filter((u) => u.role === 'admin').length
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || t('admin.usersIndex.loadError')
    const isNetwork = String(e?.message || '').toLowerCase().includes('fetch') || String(e?.message || '').includes('network')
    const err = isNetwork ? t('admin.usersIndex.loadErrorNetwork', { msg }) : msg
    loadError.value = err
    message.error(loadError.value)
    if (import.meta.dev) console.error('Admin users fetch failed:', e)
  } finally {
    loading.value = false
  }
}

function resetAddForm() {
  addForm.email = ''
  addForm.name = ''
  addForm.password = ''
  addForm.role = 'admin'
}

async function handleAddUser() {
  try {
    await addFormRef.value?.validate()
  } catch {
    return
  }
  if (addForm.password.length < 6) {
    message.error(t('admin.usersIndex.passwordMinLength'))
    return
  }
  adding.value = true
  try {
    await $fetch(`${apiBase}/admin/users`, {
      method: 'POST',
      credentials: 'include',
      body: {
        email: addForm.email.trim(),
        name: addForm.name.trim() || undefined,
        password: addForm.password,
        role: addForm.role,
      },
    })
    message.success(t('admin.usersIndex.userCreated'))
    showAddModal.value = false
    loadUsers()
  } catch (e: any) {
    message.error(e?.data?.message || e?.message || t('admin.usersIndex.createError'))
  } finally {
    adding.value = false
  }
}

async function handleDeactivate(row: { id: string; name?: string; email?: string }) {
  try {
    await $fetch(`${apiBase}/admin/users/${row.id}/deactivate`, {
      method: 'POST',
      credentials: 'include',
    })
    message.success(t('admin.usersIndex.userDeactivated'))
    loadUsers()
  } catch (e: any) {
    message.error(e?.data?.message || e?.message || t('common.error'))
  }
}

function handleImpersonate(row: { id: string; name?: string; email?: string; role?: string; driverName?: string }) {
  const name = row.driverName || row.name || row.email || '—'
  dialog.warning({
    title: t('admin.usersIndex.impersonateTitle'),
    content: t('admin.usersIndex.impersonateContent', { name, role: row.role || '' }),
    positiveText: t('admin.usersIndex.impersonateConfirm'),
    negativeText: t('admin.usersIndex.cancel'),
    onPositiveClick: async () => {
      try {
        await impersonate(row.id)
        message.success(t('admin.usersIndex.impersonateSuccess', { name }))
      } catch (e: any) {
        message.error(e?.message || e?.data?.error || t('admin.usersIndex.impersonateError'))
      }
    },
  })
}

onMounted(loadUsers)
</script>
