<template>
  <div>
    <n-h4 style="margin: 0 0 20px 0;">Настройки</n-h4>
    <n-space vertical :size="16">
      <n-card size="small" hoverable style="cursor: pointer; max-width: 400px" @click="navigateTo('/admin/cities')">
        <n-thing>
          <template #avatar>🏙️</template>
          <template #header>Города</template>
          <template #header-extra>
            <n-button text type="primary">→</n-button>
          </template>
          <template #description>Управление городами отправления и назначения</template>
        </n-thing>
      </n-card>
      <n-card size="small" hoverable style="cursor: pointer; max-width: 400px" @click="navigateTo('/admin/settings/deactivated-users')">
        <n-thing>
          <template #avatar>👤</template>
          <template #header>Удалённые пользователи</template>
          <template #header-extra>
            <n-button text type="primary">→</n-button>
          </template>
          <template #description>Просмотр и восстановление деактивированных пользователей</template>
        </n-thing>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
</script>
