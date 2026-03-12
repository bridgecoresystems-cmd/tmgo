<template>
  <div class="admin-dashboard">
    <n-grid :cols="4" :x-gap="24" :y-gap="24" responsive="screen" item-responsive>
      <n-gi v-for="stat in stats" :key="stat.title">
        <n-card class="stat-card shadow-sm">
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
      </n-gi>
    </n-grid>

    <n-grid :cols="2" :x-gap="24" :y-gap="24" class="mt-24" responsive="screen">
      <n-gi>
        <n-card title="Последние заказы" class="shadow-sm">
          <template #header-extra>
            <n-button text type="primary" @click="navigateTo('/admin/orders')">Все заказы</n-button>
          </template>
          <n-table :bordered="false" :single-line="false">
            <thead>
              <tr>
                <th>ID</th>
                <th>Маршрут</th>
                <th>Статус</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td>#{{ order.id }}</td>
                <td>{{ order.route }}</td>
                <td>
                  <n-tag :type="getStatusType(order.status)" size="small" round>
                    {{ order.status }}
                  </n-tag>
                </td>
                <td>{{ order.price }} TMT</td>
              </tr>
            </tbody>
          </n-table>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="Новые пользователи" class="shadow-sm">
          <template #header-extra>
            <n-button text type="primary" @click="navigateTo('/admin/users')">Все пользователи</n-button>
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

const stats = [
  { title: 'Всего заказов', value: 124, icon: '📦', trend: 12 },
  { title: 'Активные рейсы', value: 18, icon: '🚛', trend: 5 },
  { title: 'Выручка (мес)', value: '45,200', icon: '💰', trend: 8 },
  { title: 'Новые клиенты', value: 32, icon: '👥', trend: -2 }
]

const recentOrders = [
  { id: '1024', route: 'Ашхабад → Мары', status: 'В пути', price: '1,200' },
  { id: '1023', route: 'Балканабат → Туркменбаши', status: 'Выполнен', price: '850' },
  { id: '1022', route: 'Дашогуз → Ашхабад', status: 'Ожидание', price: '2,100' },
  { id: '1021', route: 'Мары → Туркменабат', status: 'Отменен', price: '600' }
]

const recentUsers = [
  { name: 'Аман Аманов', email: 'aman@mail.com', role: 'Перевозчик' },
  { name: 'Ораз Оразов', email: 'oraz@mail.com', role: 'Заказчик' },
  { name: 'Дженнет С.', email: 'jennet@mail.com', role: 'Заказчик' }
]

const getStatusType = (status: string) => {
  switch (status) {
    case 'В пути': return 'info'
    case 'Выполнен': return 'success'
    case 'Ожидание': return 'warning'
    case 'Отменен': return 'error'
    default: return 'default'
  }
}
</script>

<style scoped>
.mt-24 {
  margin-top: 24px;
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
</style>
