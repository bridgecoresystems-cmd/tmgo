<template>
  <div class="admin-dashboard">
    <div class="stats-grid">
      <n-card v-for="stat in stats" :key="stat.title" class="stat-card shadow-sm">
        <n-statistic :label="stat.title" :value="stat.value">
          <template #prefix>
            <span class="stat-icon">{{ stat.icon }}</span>
          </template>
          <template #suffix>
            <n-text :type="stat.trend > 0 ? 'success' : 'error'" class="stat-trend">
              {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
            </n-text>
          </template>
        </n-statistic>
      </n-card>
    </div>

    <n-grid :cols="{ xs: 1, md: 2 }" :x-gap="24" :y-gap="24" class="mt-24" responsive="screen">
      <n-gi>
        <n-card :title="$t('admin.adminIndex.recentOrders')" class="shadow-sm">
          <template #header-extra>
            <n-button text type="primary" @click="navigateTo('/admin/orders')">{{ $t('admin.adminIndex.allOrders') }}</n-button>
          </template>
          <div class="table-scroll">
          <n-table :bordered="false" :single-line="false">
            <thead>
              <tr>
                <th>ID</th>
                <th>{{ $t('admin.adminIndex.columnRoute') }}</th>
                <th>{{ $t('admin.adminIndex.columnStatus') }}</th>
                <th>{{ $t('admin.adminIndex.columnAmount') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td style="font-family: monospace; font-weight: 600;">ORD{{ order.seqNo || order.id.split('-')[0] }}</td>
                <td>{{ order.route }}</td>
                <td>
                  <n-tag :type="getStatusType(order.status)" size="small" round :bordered="false">
                    {{ statusLabel(order.status) }}
                  </n-tag>
                </td>
                <td>{{ order.price }} TMT</td>
              </tr>
            </tbody>
          </n-table>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :title="$t('admin.adminIndex.newUsers')" class="shadow-sm">
          <template #header-extra>
            <n-button text type="primary" @click="navigateTo('/admin/users')">{{ $t('admin.adminIndex.allUsers') }}</n-button>
          </template>
          <n-list hoverable clickable>
            <n-list-item v-for="user in recentUsers" :key="user.email">
              <template #prefix>
                <n-avatar round size="small" :style="{ backgroundColor: '#ff6b4a' }">
                  {{ user.name.charAt(0) }}
                </n-avatar>
              </template>
              <n-thing :title="user.name" :description="user.email">
                <template #extra>
                  <n-tag size="small" :bordered="false">{{ user.role }}</n-tag>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { t } = useI18n()
const { apiBase: API } = useApiBase()

const loading = ref(true)
const dashboardData = ref<any>(null)

async function fetchDashboard() {
  loading.value = true
  try {
    const data = await $fetch<any>(`${API}/admin/dashboard/stats`, { credentials: 'include' })
    dashboardData.value = data
  } catch (e) {
    console.error('Failed to fetch dashboard stats', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})

const stats = computed(() => [
  { 
    title: t('admin.adminIndex.statTotalOrders'), 
    value: dashboardData.value?.stats?.totalOrders || 0, 
    icon: '📦', 
    trend: dashboardData.value?.stats?.trends?.totalOrders || 0 
  },
  { 
    title: t('admin.adminIndex.statActiveTrips'), 
    value: dashboardData.value?.stats?.activeTrips || 0, 
    icon: '🚛', 
    trend: dashboardData.value?.stats?.trends?.activeTrips || 0 
  },
  { 
    title: t('admin.adminIndex.statRevenue'), 
    value: dashboardData.value?.stats?.revenue || '0', 
    icon: '💰', 
    trend: dashboardData.value?.stats?.trends?.revenue || 0 
  },
  { 
    title: t('admin.adminIndex.statNewClients'), 
    value: dashboardData.value?.stats?.newClients || 0, 
    icon: '👥', 
    trend: dashboardData.value?.stats?.trends?.newClients || 0 
  }
])

const recentOrders = computed(() => dashboardData.value?.recentOrders || [])
const recentUsers = computed(() => dashboardData.value?.recentUsers || [])

const statusLabel = (status: string) => {
  const key = `client.orders.status_${status}`
  const label = t(key)
  return label !== key ? label : status
}

const getStatusType = (status: string) => {
  switch (status.toLowerCase()) {
    case 'in_transit':
    case 'pickup':
    case 'delivering': return 'info'
    case 'completed':
    case 'delivered': return 'success'
    case 'published': return 'info'
    case 'negotiating': return 'warning'
    case 'cancelled':
    case 'expired': return 'error'
    default: return 'default'
  }
}
</script>

<style scoped>
.mt-24 {
  margin-top: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
}

.stat-card {
  border-radius: 16px;
}

.stat-icon {
  font-size: 24px;
  margin-right: 8px;
}

.stat-trend {
  font-size: 12px;
  margin-left: 8px;
}

.shadow-sm {
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}

.table-scroll {
  overflow-x: auto;
}

@media (max-width: 640px) {
  .stat-icon { font-size: 20px; }
}
</style>
