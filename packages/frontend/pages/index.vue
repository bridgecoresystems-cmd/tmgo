<script setup lang="ts">
const { session, loading } = useAuth()

watch([session, loading], () => {
  if (loading.value) return
  
  if (session.value?.user) {
    const role = session.value.user.role
    if (role === 'admin') navigateTo('/admin')
    else if (role === 'driver') navigateTo('/cabinet/driver')
    else if (role === 'client') navigateTo('/cabinet/client')
    else navigateTo('/landing')
  } else {
    navigateTo('/landing')
  }
}, { immediate: true })
</script>
