<template>
  <div>
    <UiBackBtn to="/cabinet/client/orders" />

    <div v-if="loading" style="padding: 40px; text-align: center">
      <n-spin size="large" />
    </div>

    <template v-else-if="order">
      <n-card :title="t('client.orders.order')">
        <n-descriptions :column="1" bordered>
          <n-descriptions-item :label="t('client.orders.route')">{{ order.from_city }} → {{ order.to_city }}</n-descriptions-item>
          <n-descriptions-item :label="t('client.orders.addresses')">{{ order.from_address || order.from_city }} → {{ order.to_address || order.to_city }}</n-descriptions-item>
          <n-descriptions-item :label="t('client.orders.cargo')">{{ order.cargo_name || '—' }}</n-descriptions-item>
          <n-descriptions-item :label="t('client.orders.cargoDescription')">{{ order.cargo_description || '—' }}</n-descriptions-item>
          <n-descriptions-item :label="t('common.price')">{{ order.price }} {{ order.currency }}</n-descriptions-item>
          <n-descriptions-item :label="t('common.status')">
            <n-tag :type="statusType">{{ statusLabel }}</n-tag>
          </n-descriptions-item>
        </n-descriptions>
        <n-button v-if="order.status === 'PENDING'" type="primary" style="margin-top: 16px" @click="navigateTo(`/cabinet/client/orders/${order.id}/edit`)">
          {{ t('common.edit') }}
        </n-button>
      </n-card>

      <!-- Pending responses -->
      <n-card v-if="order.pending_responses?.length" :title="t('client.orders.whoWantsToTake')" style="margin-top: 20px">
        <n-space vertical :size="16">
          <div
            v-for="r in order.pending_responses"
            :key="r.id"
            class="driver-card"
            @mouseenter="hoveredResponse = r.id"
            @mouseleave="hoveredResponse = null"
          >
            <div class="driver-card-inner">
              <div class="driver-info">
                <n-avatar round size="medium" :style="{ backgroundColor: '#ff6b4a' }">
                  {{ (r.driver_name || r.company_name || '?').charAt(0) }}
                </n-avatar>
                <div>
                  <div class="driver-name">{{ r.driver_name || r.company_name || t('common.transport') }}</div>
                  <div class="driver-details">{{ r.company_name || '' }} · {{ r.vehicle_plate }} ({{ r.vehicle_type || '—' }})</div>
                </div>
              </div>
              <n-space v-if="hoveredResponse === r.id" class="driver-actions">
                <n-button size="small" type="primary" :loading="actionLoading === `accept-${r.id}`" @click.stop="acceptResponse(r.id)">
                  {{ t('client.orders.accept') }}
                </n-button>
                <n-button size="small" type="error" :loading="actionLoading === `reject-${r.id}`" @click.stop="rejectResponse(r.id)">
                  {{ t('client.orders.reject') }}
                </n-button>
              </n-space>
            </div>
          </div>
        </n-space>
      </n-card>

      <!-- Accepted responses -->
      <n-card v-if="order.accepted_responses?.length" :title="t('client.orders.acceptedDrivers')" style="margin-top: 20px">
        <n-space vertical :size="16">
          <div v-for="r in order.accepted_responses" :key="r.id" class="driver-card accepted">
            <div class="driver-card-inner">
              <div class="driver-info">
                <n-avatar round size="medium" :style="{ backgroundColor: '#18a058' }">
                  {{ (r.driver_name || r.company_name || '?').charAt(0) }}
                </n-avatar>
                <div>
                  <div class="driver-name">{{ r.driver_name || r.company_name || t('common.transport') }}</div>
                  <div class="driver-details">{{ r.company_name || '' }} · {{ r.vehicle_plate }} ({{ r.vehicle_type || '—' }})</div>
                </div>
              </div>
              <n-button size="small" type="info" @click="handleOpenChat(r)">
                💬 {{ t('client.orders.chat') }}
              </n-button>
            </div>
          </div>
        </n-space>
      </n-card>

      <n-empty
        v-else-if="!order.pending_responses?.length && !order.accepted_responses?.length && order.status === 'PENDING'"
        :description="t('client.orders.noResponsesYet')"
        style="margin-top: 20px"
      />
    </template>

    <n-empty v-else :description="t('client.orders.orderNotFound')" />
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t } = useI18n()
definePageMeta({ layout: 'cabinet-client',  })

const { apiBase: API } = useApiBase()
const message = useMessage()
const route = useRoute()
const { openChat } = useOrderChat()
const loading = ref(true)
const order = ref<any>(null)
const hoveredResponse = ref<string | null>(null)
const actionLoading = ref<string | null>(null)

const statusLabels = computed<Record<string, string>>(() => ({
  PENDING: t('client.orders.statusPending'),
  ACCEPTED: t('client.orders.statusAccepted'),
  IN_TRANSIT: t('client.orders.statusInTransit'),
  DELIVERED: t('client.orders.statusDelivered'),
  CANCELLED: t('client.orders.statusCancelled'),
}))

const statusTypes: Record<string, any> = {
  PENDING: 'warning',
  ACCEPTED: 'info',
  IN_TRANSIT: 'info',
  DELIVERED: 'success',
  CANCELLED: 'error',
}

const statusLabel = computed(() => statusLabels.value[order.value?.status] || order.value?.status)
const statusType = computed(() => statusTypes[order.value?.status] || 'default')

async function loadOrder() {
  loading.value = true
  try {
    order.value = await $fetch<any>(`${API}/cabinet/orders/${route.params.id}`, { credentials: 'include' })
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

async function acceptResponse(responseId: string) {
  actionLoading.value = `accept-${responseId}`
  try {
    await $fetch(`${API}/cabinet/orders/${route.params.id}/responses/${responseId}/accept`, {
      method: 'POST',
      credentials: 'include',
    })
    message.success(t('client.orders.accepted'))
    await loadOrder()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.error'))
  } finally {
    actionLoading.value = null
  }
}

async function rejectResponse(responseId: string) {
  actionLoading.value = `reject-${responseId}`
  try {
    await $fetch(`${API}/cabinet/orders/${route.params.id}/responses/${responseId}/reject`, {
      method: 'POST',
      credentials: 'include',
    })
    message.success(t('client.orders.responseRejected'))
    await loadOrder()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.error'))
  } finally {
    actionLoading.value = null
  }
}

function handleOpenChat(r: any) {
  openChat(order.value?.id || null, r.driver_name || r.company_name || t('common.transport'))
}

onMounted(loadOrder)
</script>

<style scoped>
.driver-card {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: background-color 0.2s, box-shadow 0.2s;
}
.driver-card:hover {
  background-color: rgba(255, 107, 74, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.driver-card.accepted {
  border-color: #18a058;
  background-color: rgba(24, 160, 88, 0.04);
}
.driver-card-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.driver-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.driver-name {
  font-weight: 600;
  font-size: 15px;
}
.driver-details {
  font-size: 13px;
  color: #666;
  margin-top: 2px;
}
.driver-actions {
  flex-shrink: 0;
}
</style>
