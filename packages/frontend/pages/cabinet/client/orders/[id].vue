<template>
  <div>
    <UiBackBtn to="/cabinet/client/orders" />

    <div v-if="loading" style="padding: 40px; text-align: center">
      <n-spin size="large" />
    </div>

    <template v-else-if="order">
      <!-- Order header -->
      <n-card :title="order.title" style="margin-top: 12px;">
        <template #header-extra>
          <n-tag :type="statusType(order.status)" size="medium">{{ statusLabel(order.status) }}</n-tag>
        </template>

        <n-descriptions bordered :column="2" size="small">
          <n-descriptions-item :label="t('client.orders.route')">
            {{ order.fromCity }} ({{ order.fromCountry }}) → {{ order.toCity }} ({{ order.toCountry }})
          </n-descriptions-item>
          <n-descriptions-item :label="t('client.orders.readyDate')">
            {{ order.readyDate ?? '—' }}
          </n-descriptions-item>
          <n-descriptions-item v-if="order.deadlineDate" :label="t('client.orders.deadlineDate')">
            {{ order.deadlineDate }}
          </n-descriptions-item>
          <n-descriptions-item :label="t('common.price')">
            {{ order.price ? `${order.price} ${order.currency}` : t('client.orders.negotiable') }}
          </n-descriptions-item>
          <n-descriptions-item v-if="order.publishedAt" :label="t('client.orders.publishedAt')">
            {{ new Date(order.publishedAt).toLocaleString('ru-RU') }}
          </n-descriptions-item>
          <n-descriptions-item v-if="order.expiresAt" :label="t('client.orders.expiresAt')">
            {{ new Date(order.expiresAt).toLocaleDateString('ru-RU') }}
          </n-descriptions-item>
        </n-descriptions>

        <!-- Action buttons -->
        <n-space style="margin-top: 16px;">
          <n-button
            v-if="order.status === 'draft'"
            type="primary"
            :loading="actionLoading === 'publish'"
            @click="publish"
          >
            {{ t('client.orders.publish') }}
          </n-button>
          <n-button
            v-if="order.status === 'delivered'"
            type="success"
            :loading="actionLoading === 'complete'"
            @click="complete"
          >
            {{ t('client.orders.complete') }}
          </n-button>
          <n-button
            v-if="['draft','published','negotiating'].includes(order.status)"
            type="error"
            ghost
            :loading="actionLoading === 'cancel'"
            @click="cancel"
          >
            {{ t('client.orders.cancel') }}
          </n-button>
        </n-space>
      </n-card>

      <!-- Cargo -->
      <n-card v-if="cargo" :title="t('client.orders.cargoInfo')" style="margin-top: 16px;">
        <n-descriptions bordered :column="3" size="small">
          <n-descriptions-item :label="t('client.orders.cargoType')">{{ cargo.cargoType }}</n-descriptions-item>
          <n-descriptions-item v-if="cargo.weightKg" :label="t('client.orders.weightKg')">{{ cargo.weightKg }} кг</n-descriptions-item>
          <n-descriptions-item v-if="cargo.volumeM3" :label="t('client.orders.volumeM3')">{{ cargo.volumeM3 }} м³</n-descriptions-item>
          <n-descriptions-item v-if="cargo.packaging" :label="t('client.orders.packaging')">{{ cargo.packaging }}</n-descriptions-item>
          <n-descriptions-item v-if="cargo.tempControlled" :label="t('client.orders.temperature')">
            {{ cargo.tempMin }}°C ... {{ cargo.tempMax }}°C
          </n-descriptions-item>
          <n-descriptions-item v-if="cargo.notes" :label="t('client.orders.cargoNotes')">{{ cargo.notes }}</n-descriptions-item>
        </n-descriptions>
      </n-card>

      <!-- Bids -->
      <n-card
        v-if="bids.length > 0"
        :title="`${t('client.orders.bids')} (${bids.length})`"
        style="margin-top: 16px;"
      >
        <n-space vertical :size="12">
          <div
            v-for="bid in bids"
            :key="bid.id"
            class="bid-card"
            :class="{ accepted: bid.status === 'accepted' }"
          >
            <div class="bid-inner">
              <div>
                <div class="bid-amount">{{ bid.amount }} {{ bid.currency }}</div>
                <div v-if="bid.comment" class="bid-comment">{{ bid.comment }}</div>
                <div class="bid-date">{{ new Date(bid.createdAt).toLocaleString('ru-RU') }}</div>
              </div>
              <div>
                <n-tag v-if="bid.status === 'accepted'" type="success" size="small">✓ {{ t('client.orders.accepted') }}</n-tag>
                <n-button
                  v-else-if="order.status === 'negotiating' && bid.status === 'pending'"
                  type="primary"
                  size="small"
                  :loading="actionLoading === `accept-bid-${bid.id}`"
                  @click="acceptBid(bid.id)"
                >
                  {{ t('client.orders.accept') }}
                </n-button>
              </div>
            </div>
          </div>
        </n-space>
      </n-card>

      <n-empty
        v-else-if="order.status === 'published'"
        :description="t('client.orders.noBidsYet')"
        style="margin-top: 20px"
      />

      <!-- Status log -->
      <n-card
        v-if="statusLogs.length > 0"
        :title="t('client.orders.statusHistory')"
        style="margin-top: 16px;"
      >
        <n-timeline>
          <n-timeline-item
            v-for="log in statusLogs"
            :key="log.id"
            :type="log.newStatus === 'completed' ? 'success' : log.newStatus === 'cancelled' ? 'error' : 'default'"
            :title="`${statusLabel(log.oldStatus)} → ${statusLabel(log.newStatus)}`"
            :time="new Date(log.createdAt).toLocaleString('ru-RU')"
            :content="log.comment ?? undefined"
          />
        </n-timeline>
      </n-card>
    </template>

    <n-empty v-else :description="t('client.orders.orderNotFound')" />
  </div>
</template>

<script setup lang="ts">
import { useMessage, useDialog } from 'naive-ui'

definePageMeta({ layout: 'cabinet-client' })

const { t } = useI18n()
const { apiBase: API } = useApiBase()
const message = useMessage()
const dialog = useDialog()
const route = useRoute()

const loading = ref(true)
const order = ref<any>(null)
const cargo = ref<any>(null)
const bids = ref<any[]>([])
const statusLogs = ref<any[]>([])
const actionLoading = ref<string | null>(null)

const STATUS_TYPE: Record<string, string> = {
  draft: 'default', published: 'info', negotiating: 'warning',
  confirmed: 'info', pickup: 'info', in_transit: 'info', delivering: 'info',
  delivered: 'success', completed: 'success', cancelled: 'error', expired: 'error', disputed: 'error',
}

function statusType(s: string) { return (STATUS_TYPE[s] ?? 'default') as any }
function statusLabel(s: string) {
  const key = `client.orders.status_${s}`
  const label = t(key)
  return label !== key ? label : s
}

async function loadOrder() {
  loading.value = true
  try {
    const data = await $fetch<any>(`${API}/cabinet/orders/${route.params.id}`, { credentials: 'include' })
    order.value = data.order
    cargo.value = data.cargo
    bids.value = data.bids ?? []
    statusLogs.value = data.statusLogs ?? []
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

async function publish() {
  actionLoading.value = 'publish'
  try {
    await $fetch(`${API}/cabinet/orders/${order.value.id}/publish`, { method: 'PATCH', credentials: 'include' })
    message.success(t('client.orders.published'))
    await loadOrder()
  } catch (e: any) {
    message.error(e?.data?.error ?? t('common.error'))
  } finally {
    actionLoading.value = null
  }
}

async function acceptBid(bidId: string) {
  actionLoading.value = `accept-bid-${bidId}`
  try {
    await $fetch(`${API}/cabinet/orders/${order.value.id}/bids/${bidId}/accept`, { method: 'PATCH', credentials: 'include' })
    message.success(t('client.orders.bidAccepted'))
    await loadOrder()
  } catch (e: any) {
    message.error(e?.data?.error ?? t('common.error'))
  } finally {
    actionLoading.value = null
  }
}

async function complete() {
  actionLoading.value = 'complete'
  try {
    await $fetch(`${API}/cabinet/orders/${order.value.id}/complete`, { method: 'PATCH', credentials: 'include' })
    message.success(t('client.orders.orderCompleted'))
    await loadOrder()
  } catch (e: any) {
    message.error(e?.data?.error ?? t('common.error'))
  } finally {
    actionLoading.value = null
  }
}

async function cancel() {
  dialog.warning({
    title: t('client.orders.cancelConfirmTitle'),
    content: t('client.orders.cancelConfirmText'),
    positiveText: t('client.orders.cancelBtn'),
    negativeText: t('common.back'),
    onPositiveClick: async () => {
      actionLoading.value = 'cancel'
      try {
        await $fetch(`${API}/cabinet/orders/${order.value.id}/cancel`, { method: 'PATCH', credentials: 'include' })
        message.success(t('client.orders.orderCancelled'))
        await loadOrder()
      } catch (e: any) {
        message.error(e?.data?.error ?? t('common.error'))
      } finally {
        actionLoading.value = null
      }
    },
  })
}

onMounted(loadOrder)
</script>

<style scoped>
.bid-card {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: background 0.2s;
}
.bid-card.accepted {
  border-color: #18a058;
  background: rgba(24,160,88,0.04);
}
.bid-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.bid-amount {
  font-size: 18px;
  font-weight: 700;
  color: #ff6b4a;
}
.bid-comment {
  font-size: 13px;
  color: #555;
  margin-top: 2px;
}
.bid-date {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
}
</style>
