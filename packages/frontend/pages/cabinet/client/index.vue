<template>
  <div>
    <!-- Verification prompt -->
    <n-alert
      v-if="profileStatus === 'none'"
      type="warning"
      :title="t('client.dashboard.verifyTitle')"
      style="margin-bottom: 20px; border-radius: 12px; cursor: pointer;"
      @click="navigateTo('/cabinet/client/verification')"
    >
      {{ t('client.dashboard.verifyText') }}
      <template #action>
        <n-button type="warning" size="small" @click.stop="navigateTo('/cabinet/client/verification')">
          {{ t('client.dashboard.verifyBtn') }}
        </n-button>
      </template>
    </n-alert>

    <n-alert
      v-else-if="profileStatus === 'pending'"
      type="info"
      :title="t('client.dashboard.pendingTitle')"
      style="margin-bottom: 20px; border-radius: 12px;"
    >
      {{ t('client.dashboard.pendingText') }}
    </n-alert>

    <n-alert
      v-else-if="profileStatus === 'rejected'"
      type="error"
      :title="t('client.dashboard.rejectedTitle')"
      style="margin-bottom: 20px; border-radius: 12px;"
      closable
    >
      {{ profile?.rejectionReason ?? t('client.dashboard.rejectedText') }}
      <template #action>
        <n-button type="error" size="small" @click="navigateTo('/cabinet/client/verification')">
          {{ t('client.dashboard.resubmitBtn') }}
        </n-button>
      </template>
    </n-alert>

    <!-- Dashboard cards -->
    <n-grid :cols="isMobile ? 1 : 3" :x-gap="16" :y-gap="16" style="margin-bottom: 24px;">
      <n-gi>
        <n-card hoverable style="border-radius: 12px; cursor: pointer;" @click="navigateTo('/cabinet/client/orders')">
          <n-statistic :label="t('client.dashboard.myOrders')" :value="stats.totalOrders" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card hoverable style="border-radius: 12px; cursor: pointer;" @click="navigateTo('/cabinet/client/orders?status=published,negotiating')">
          <n-statistic :label="t('client.dashboard.activeOrders')" :value="stats.activeOrders" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card hoverable style="border-radius: 12px; cursor: pointer;" @click="navigateTo('/cabinet/client/orders?status=completed')">
          <n-statistic :label="t('client.dashboard.completedOrders')" :value="stats.completedOrders" />
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Quick actions -->
    <n-card :title="t('client.dashboard.quickActions')" style="border-radius: 12px; margin-bottom: 24px;">
      <n-space>
        <n-button type="primary" @click="navigateTo('/cabinet/client/orders/create')">
          {{ t('client.dashboard.createOrder') }}
        </n-button>
        <n-button @click="navigateTo('/cabinet/client/orders')">
          {{ t('client.dashboard.viewOrders') }}
        </n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet-client' })

const { t } = useI18n()
const { apiBase: API } = useApiBase()
const route = useRoute()
const message = useMessage()

const isMobile = ref(false)
const profile = ref<any>(null)
const profileStatus = ref<'none' | 'unverified' | 'pending' | 'verified' | 'rejected'>('none')
const stats = reactive({ totalOrders: 0, activeOrders: 0, completedOrders: 0 })

async function loadProfile() {
  try {
    const data = await $fetch<any>(`${API}/cabinet/client/profile`, { credentials: 'include' })
    profile.value = data.profile
    profileStatus.value = data.profile?.verificationStatus ?? 'unverified'
  } catch (e: any) {
    if (e?.status === 404 || e?.statusCode === 404) {
      profileStatus.value = 'none'
    }
  }
}

async function loadStats() {
  try {
    const data = await $fetch<any>(`${API}/cabinet/orders/my`, { credentials: 'include' })
    const orders = data.orders ?? []
    stats.totalOrders = orders.length
    stats.activeOrders = orders.filter((o: any) => ['published', 'negotiating', 'confirmed', 'pickup', 'in_transit', 'delivering'].includes(o.order?.status ?? o.status)).length
    stats.completedOrders = orders.filter((o: any) => (o.order?.status ?? o.status) === 'completed').length
  } catch { /* ignore */ }
}

onMounted(async () => {
  await loadProfile()
  loadStats()

  if (route.query.profile_created === 'true') {
    message.success(t('client.dashboard.profileCreated'))
    navigateTo('/cabinet/client', { replace: true })
  }
})
</script>
