<template>
  <div>
    <n-h3 style="margin: 0 0 20px 0;">{{ t('client.chat.title') }}</n-h3>
    <n-empty :description="t('common.noMessages')" />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'cabinet-client', middleware: 'cabinet-auth' })
</script>
