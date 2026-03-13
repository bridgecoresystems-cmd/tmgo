<template>
  <div>
    <n-button text style="margin-bottom: 16px" @click="navigateTo('/admin/settings')">← Настройки</n-button>

    <n-alert v-if="loadError" type="error" closable style="margin-bottom: 16px">
      {{ loadError }}
      <template #footer>
        <n-button size="small" @click="loadUsers">Повторить</n-button>
      </template>
    </n-alert>

    <n-h4 style="margin: 0 0 16px 0;">Удалённые пользователи</n-h4>
    <n-text depth="3" style="display: block; margin-bottom: 20px;">
      Пользователи, деактивированные администратором. Данные сохранены. Можно восстановить.
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
import { NTag, NButton, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

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
    const data = await $fetch<any[]>(`${apiBase}/admin/users?inactive_only=1`, { credentials: 'include' })
    users.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Ошибка загрузки'
    message.error(loadError.value)
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)
</script>
