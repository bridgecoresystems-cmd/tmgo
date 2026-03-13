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
        <n-select
          v-model:value="verificationFilter"
          :options="verificationFilterOptions"
          placeholder="Верификация"
          clearable
          style="width: 180px"
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
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { apiBase } = useApiBase()
const message = useMessage()
const search = ref('')
const verificationFilter = ref<string | null>(null)
const loading = ref(true)
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
  { label: 'Верифицирован', value: 'verified' },
]

function getVerificationTag(status: string | null) {
  const s = status ?? 'not_verified'
  const labels: Record<string, string> = {
    not_verified: 'Не верифицирован',
    waiting_verification: 'Ожидает',
    verified: 'Верифицирован',
  }
  const types: Record<string, string> = {
    not_verified: 'default',
    waiting_verification: 'warning',
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
    title: 'Дата регистрации',
    key: 'createdAt',
    render: (row) => new Date(row.createdAt as string).toLocaleDateString('ru-RU'),
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

onMounted(loadUsers)
</script>
