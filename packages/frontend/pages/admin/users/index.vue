<template>
  <div>
    <n-alert v-if="loadError" type="error" closable style="margin-bottom: 16px">
      {{ loadError }}
      <template #footer>
        <n-button size="small" @click="loadUsers">Повторить</n-button>
      </template>
    </n-alert>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <n-h3 style="margin: 0;">Пользователи</n-h3>
      <n-space>
        <n-button type="primary" @click="showAddModal = true">Добавить пользователя</n-button>
        <n-button quaternary @click="navigateTo('/admin/settings/deactivated-users')">Удалённые</n-button>
        <n-select
          v-model:value="verificationFilter"
          :options="verificationFilterOptions"
          placeholder="Верификация"
          clearable
          style="width: 180px"
        />
        <n-select
          v-model:value="onlineFilter"
          :options="onlineFilterOptions"
          placeholder="Онлайн"
          clearable
          style="width: 140px"
        />
        <n-input v-model:value="search" placeholder="Поиск по email / имени" style="width: 280px;" clearable />
      </n-space>
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredUsers"
      :loading="loading"
      :pagination="{ pageSize: 20 }"
      :row-props="(row) => ({ style: 'cursor: pointer', onClick: () => navigateTo(`/admin/users/${row.id}`) })"
      striped
    />

    <n-modal v-model:show="showAddModal" preset="card" title="Добавить пользователя" style="max-width: 420px" @after-leave="resetAddForm">
      <n-form ref="addFormRef" :model="addForm" :rules="addRules" label-placement="top">
        <n-form-item label="Email" path="email" required>
          <n-input v-model:value="addForm.email" placeholder="admin@tmgo.com" type="email" />
        </n-form-item>
        <n-form-item label="Имя" path="name">
          <n-input v-model:value="addForm.name" placeholder="Иван Иванов" />
        </n-form-item>
        <n-form-item label="Пароль" path="password" required>
          <n-input v-model:value="addForm.password" type="password" show-password-on="click" placeholder="Минимум 6 символов" />
        </n-form-item>
        <n-form-item label="Роль" path="role" required>
          <n-select v-model:value="addForm.role" :options="addRoleOptions" placeholder="Выберите роль" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddModal = false">Отмена</n-button>
          <n-button type="primary" :loading="adding" @click="handleAddUser">Создать</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, NButton, NPopconfirm, NTooltip, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

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
const addRoleOptions = [
  { label: 'Администратор', value: 'admin' },
  { label: 'Диспетчер', value: 'dispatcher' },
]
const addRules = {
  email: { required: true, message: 'Введите email', trigger: 'blur' },
  password: { required: true, message: 'Введите пароль', trigger: 'blur' },
  role: { required: true, message: 'Выберите роль', trigger: 'change' },
}
const loadError = ref<string | null>(null)
const users = ref<any[]>([])

const roleColors: Record<string, any> = {
  admin: 'error',
  dispatcher: 'warning',
  driver: 'info',
  client: 'default',
}

const verificationFilterOptions = [
  { label: 'Не верифицирован', value: 'not_verified' },
  { label: 'Ожидает проверки', value: 'waiting_verification' },
  { label: 'Запрос', value: 'request' },
  { label: 'Верифицирован', value: 'verified' },
]

const onlineFilterOptions = [
  { label: 'Онлайн', value: 'online' },
  { label: 'Оффлайн', value: 'offline' },
]

const activeAdminCount = ref(0)
function isLastAdmin(row: { role?: string }) {
  return row.role === 'admin' && activeAdminCount.value <= 1
}

function getVerificationTag(status: string | null) {
  const s = status ?? 'not_verified'
  const labels: Record<string, string> = {
    not_verified: 'Не верифицирован',
    waiting_verification: 'Ожидает',
    request: 'Запрос',
    verified: 'Верифицирован',
  }
  const types: Record<string, string> = {
    not_verified: 'default',
    waiting_verification: 'warning',
    request: 'info',
    verified: 'success',
  }
  return h(NTag, { type: types[s] || 'default', size: 'small' }, { default: () => labels[s] || s })
}

const columns: DataTableColumns = [
  {
    title: 'Имя',
    key: 'name',
    ellipsis: true,
    render: (row) => row.driverName || row.name || row.email || '—',
  },
  { title: 'Email', key: 'email', ellipsis: true },
  {
    title: 'Роль',
    key: 'role',
    render: (row) => h(NTag, { type: roleColors[row.role as string] || 'default', size: 'small' }, { default: () => row.role }),
  },
  {
    title: 'Верификация',
    key: 'verification_status',
    width: 140,
    render: (row) => row.role === 'driver' ? getVerificationTag(row.verification_status) : '—',
  },
  {
    title: 'Онлайн',
    key: 'is_online',
    width: 90,
    render: (row) => {
      if (row.role !== 'driver') return '—'
      const online = row.is_online === true
      return h(NTag, {
        type: online ? 'success' : 'default',
        size: 'small',
      }, { default: () => online ? 'Онлайн' : 'Оффлайн' })
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
              default: () => 'Войти под пользователем',
            })
          : null,
        canDelete
          ? h(NPopconfirm, {
              onPositiveClick: () => handleDeactivate(row),
              positiveText: 'Да',
              negativeText: 'Отмена',
            }, {
              trigger: () => h(NButton, {
                quaternary: true,
                type: 'error',
                size: 'small',
                circle: true,
                onClick: (e: Event) => e.stopPropagation(),
              }, { default: () => '×' }),
              default: () => 'Деактивировать пользователя? Он исчезнет из списка, но данные сохранятся.',
            })
          : null,
      ].filter(Boolean));
    },
  },
]

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
    const msg = e?.data?.message || e?.message || 'Ошибка загрузки'
    const isNetwork = String(e?.message || '').toLowerCase().includes('fetch') || String(e?.message || '').includes('network')
    const err = isNetwork ? `${msg}. Проверь: backend запущен? (bun run dev в packages/backend)` : msg
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
    message.error('Пароль должен быть не менее 6 символов')
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
    message.success('Пользователь создан')
    showAddModal.value = false
    loadUsers()
  } catch (e: any) {
    message.error(e?.data?.message || e?.message || 'Ошибка создания')
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
    message.success('Пользователь деактивирован')
    loadUsers()
  } catch (e: any) {
    message.error(e?.data?.message || e?.message || 'Ошибка')
  }
}

function handleImpersonate(row: { id: string; name?: string; email?: string; role?: string; driverName?: string }) {
  const name = row.driverName || row.name || row.email || '—'
  dialog.warning({
    title: 'Войти под пользователем',
    content: `Вы войдёте под учётной записью ${name} (${row.role}). Чтобы вернуться — нажмите баннер в кабинете.`,
    positiveText: 'Войти',
    negativeText: 'Отмена',
    onPositiveClick: async () => {
      try {
        await impersonate(row.id)
        message.success(`Вход под ${name}`)
      } catch (e: any) {
        message.error(e?.message || e?.data?.error || 'Ошибка при входе под пользователем')
      }
    },
  })
}

onMounted(loadUsers)
</script>
