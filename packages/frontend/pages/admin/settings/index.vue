<template>
  <div>
    <n-h4 style="margin: 0 0 20px 0;">{{ $t('admin.settingsPage.title') }}</n-h4>
    <n-space vertical :size="16">
      <n-card size="small" hoverable style="cursor: pointer; max-width: 400px" @click="navigateTo('/admin/cities')">
        <n-thing>
          <template #avatar>🏙️</template>
          <template #header>{{ $t('admin.settingsPage.citiesTitle') }}</template>
          <template #header-extra>
            <n-button text type="primary">→</n-button>
          </template>
          <template #description>{{ $t('admin.settingsPage.citiesDesc') }}</template>
        </n-thing>
      </n-card>
      <n-card size="small" hoverable style="cursor: pointer; max-width: 400px" @click="navigateTo('/admin/settings/deactivated-users')">
        <n-thing>
          <template #avatar>👤</template>
          <template #header>{{ $t('admin.settingsPage.deactivatedTitle') }}</template>
          <template #header-extra>
            <n-button text type="primary">→</n-button>
          </template>
          <template #description>{{ $t('admin.settingsPage.deactivatedDesc') }}</template>
        </n-thing>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin',  })
</script>
