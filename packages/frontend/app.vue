<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#ff6b4a',
    primaryColorHover: '#ff8e71',
    primaryColorPressed: '#e55a3d',
    primaryColorSuppl: '#ff8e71',
    borderRadius: '12px'
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: v-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
</style>
