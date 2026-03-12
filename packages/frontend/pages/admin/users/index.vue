<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <n-h3 style="margin: 0;">Пользователи</n-h3>
      <n-input v-model:value="search" placeholder="Поиск по email / имени" style="width: 280px;" clearable />
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredUsers"
      :loading="loading"
      :pagination="{ pageSize: 20 }"
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
const users = ref<any[]>([])

const roleColors: Record<string, any> = {
  admin: 'error',
  dispatcher: 'warning',
  driver: 'info',
  client: 'default',
}

const columns: DataTableColumns = [
  { title: 'Имя', key: 'name', ellipsis: true },
  { title: 'Email', key: 'email', ellipsis: true },
  {
    title: 'Роль',
    key: 'role',
    render: (row) => h(NTag, { type: roleColors[row.role as string] || 'default', size: 'small' }, { default: () => row.role }),
  },
  {
    title: 'Дата регистрации',
    key: 'createdAt',
    render: (row) => new Date(row.createdAt as string).toLocaleDateString('ru-RU'),
  },
  {
    title: '',
    key: 'actions',
    render: (row) =>
      h(NButton, { size: 'small', quaternary: true, onClick: () => navigateTo(`/admin/users/${row.id}`) }, { default: () => 'Подробнее' }),
  },
]

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const q = search.value.toLowerCase()
  return users.value.filter(
    (u) => u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try {
    const data = await $fetch<any[]>(`${apiBase}/admin/users`)
    users.value = data
  } catch {
    message.error('Ошибка загрузки пользователей')
  } finally {
    loading.value = false
  }
})
</script>
