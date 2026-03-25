<template>
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
    <n-spin size="large" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { apiBase: API } = useApiBase()

onMounted(async () => {
  const token = route.query.token as string
  if (!token) {
    navigateTo('/auth')
    return
  }
  // Редиректим на бэкенд — он сам сделает redirect в /cabinet?verified=true
  window.location.href = `${API}/api/auth/verify-email?token=${token}`
})
</script>
