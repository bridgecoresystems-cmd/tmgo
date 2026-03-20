<template>
  <div>
    <UiBackBtn to="/admin/settings" label="Настройки" />

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
import { NTag, NButton, NPopconfirm, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'admin',  })

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

const deletingId = ref<string | null>(null)

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
    render: (row: any) => row.role === 'driver' ? getVerificationTag(row.verification_status ?? null) : '—',
  },
  {
    title: 'Дата регистрации',
    key: 'createdAt',
    render: (row) => new Date(row.createdAt as string).toLocaleDateString('ru-RU'),
  },
  {
    title: 'Действия',
    key: 'actions',
    width: 200,
    render: (row: any) =>
      h(NPopconfirm, {
        onPositiveClick: () => handleDeletePermanent(String(row.id)),
        positiveText: 'Удалить',
        negativeText: 'Отмена',
      }, {
        default: () => 'Удалить навсегда? Все данные будут безвозвратно потеряны.',
        trigger: () =>
          h(NButton, {
            size: 'small',
            type: 'error',
            quaternary: true,
            loading: deletingId.value === row.id,
            onClick: (e: Event) => e.stopPropagation(),
          }, { default: () => 'Удалить навсегда' }),
      }),
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

async function handleDeletePermanent(id: string) {
  deletingId.value = id
  try {
    await $fetch(`${apiBase}/admin/users/${id}`, { method: 'DELETE', credentials: 'include' })
    message.success('Пользователь удалён навсегда')
    users.value = users.value.filter((u) => u.id !== id)
  } catch (e: any) {
    message.error(e?.data?.error || e?.data?.message || e?.message || 'Ошибка удаления')
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
    loadError.value = e?.data?.message || e?.message || 'Ошибка загрузки'
    message.error(loadError.value)
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)
</script>
