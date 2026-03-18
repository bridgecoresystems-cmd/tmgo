<template>
  <div v-if="isImpersonating" class="impersonate-banner">
    <div class="impersonate-banner__content">
      <span class="impersonate-banner__icon">👤</span>
      <span class="impersonate-banner__text">
        {{ t('impersonate.loggedInAs') }}
        <strong>{{ session?.user?.name || session?.user?.email }}</strong>
        ({{ session?.user?.role }})
      </span>
    </div>
    <n-button size="small" type="warning" :loading="stopping" @click="handleStop">
      {{ t('impersonate.returnToAdmin') }}
    </n-button>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { session } = useAuth()
const { isImpersonating, stopImpersonating } = useImpersonate()
const stopping = ref(false)

async function handleStop() {
  stopping.value = true
  try {
    await stopImpersonating()
  } finally {
    stopping.value = false
  }
}
</script>

<style scoped>
.impersonate-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(90deg, #f97316, #fb923c);
  color: white;
  padding: 10px 24px;
  font-size: 0.9rem;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
}
.impersonate-banner__content {
  display: flex;
  align-items: center;
  gap: 10px;
}
.impersonate-banner__icon {
  font-size: 1.2rem;
}
.impersonate-banner__text strong {
  font-weight: 700;
  text-decoration: underline;
}
</style>
