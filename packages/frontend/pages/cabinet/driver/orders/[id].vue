<template>
  <div>
    <UiBackBtn to="/cabinet/driver/orders" />

    <div v-if="loading" style="padding: 60px; text-align: center;">
      <n-spin size="large" />
    </div>

    <n-empty v-else-if="!order" :description="t('driver.orders.orderNotFound')" style="padding: 60px;" />

    <template v-else>
      <n-grid :cols="1" :x-gap="16" :y-gap="16">

        <!-- Route + Status -->
        <n-grid-item>
          <n-card>
            <div class="route-block">
              <div class="route-stop">
                <span class="dot from-dot" />
                <div>
                  <div class="stop-city">{{ order.fromCity }}</div>
                  <div class="stop-country">{{ order.fromCountry }}</div>
                </div>
              </div>
              <div class="route-connector">→</div>
              <div class="route-stop">
                <span class="dot to-dot" />
                <div>
                  <div class="stop-city">{{ order.toCity }}</div>
                  <div class="stop-country">{{ order.toCountry }}</div>
                </div>
              </div>
              <n-tag
                :type="STATUS_TYPE[order.status] ?? 'default'"
                :bordered="false"
                size="medium"
                style="margin-left: auto; flex-shrink: 0;"
              >
                {{ statusLabel(order.status) }}
              </n-tag>
            </div>
            <div v-if="order.title" style="margin-top: 12px; color: #666; font-size: 14px;">{{ order.title }}</div>
          </n-card>
        </n-grid-item>

        <!-- Dates + Price row -->
        <n-grid-item>
          <n-grid :cols="2" :x-gap="16">
            <n-grid-item>
              <n-card size="small">
                <n-descriptions :column="1" size="small">
                  <n-descriptions-item :label="t('driver.orders.readyDate')">
                    {{ formatDate(order.readyDate) }}
                  </n-descriptions-item>
                  <n-descriptions-item v-if="order.deadlineDate" :label="t('driver.orders.deadline')">
                    {{ formatDate(order.deadlineDate) }}
                  </n-descriptions-item>
                </n-descriptions>
              </n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card size="small">
                <div v-if="order.price" class="price-display">
                  <span class="price-label">{{ t('common.price') }}</span>
                  <span class="price-val">{{ order.price }} {{ order.currency }}</span>
                </div>
                <div v-else style="color: #999; font-size: 13px;">{{ t('client.orders.negotiable') }}</div>
              </n-card>
            </n-grid-item>
          </n-grid>
        </n-grid-item>

        <!-- Cargo -->
        <n-grid-item v-if="cargo">
          <n-card :title="t('driver.orders.cargo')" size="small">
            <n-descriptions :column="2" size="small">
              <n-descriptions-item v-if="cargo.cargoType" :label="t('driver.orders.cargoType')">
                {{ cargo.cargoType }}
              </n-descriptions-item>
              <n-descriptions-item v-if="cargo.weightKg" :label="t('driver.orders.weight')">
                {{ formatWeight(cargo.weightKg) }}
              </n-descriptions-item>
              <n-descriptions-item v-if="cargo.volumeM3" :label="t('driver.orders.volume')">
                {{ cargo.volumeM3 }} м³
              </n-descriptions-item>
              <n-descriptions-item v-if="cargo.packaging" :label="t('driver.orders.packaging')">
                {{ cargo.packaging }}
              </n-descriptions-item>
              <n-descriptions-item v-if="cargo.tempControlled" :label="t('driver.orders.tempControlled')">
                <n-tag type="info" size="small" :bordered="false">Да</n-tag>
              </n-descriptions-item>
            </n-descriptions>
            <div v-if="cargo.notes" style="margin-top: 10px; font-size: 13px; color: #555;">
              <strong>{{ t('driver.orders.notes') }}:</strong> {{ cargo.notes }}
            </div>
          </n-card>
        </n-grid-item>

        <!-- My bid status -->
        <n-grid-item v-if="myBid">
          <n-alert :type="BID_ALERT_TYPE[myBid.status] ?? 'default'" :title="t('driver.orders.bidMy')">
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <span style="font-size: 18px; font-weight: 700;">{{ myBid.amount }} {{ myBid.currency }}</span>
              <n-tag :type="BID_TAG_TYPE[myBid.status] ?? 'default'" :bordered="false">
                {{ bidStatusLabel(myBid.status) }}
              </n-tag>
            </div>
            <div v-if="myBid.comment" style="margin-top: 6px; font-size: 13px; color: #666;">
              {{ myBid.comment }}
            </div>
          </n-alert>
        </n-grid-item>

        <!-- Bid success banner -->
        <n-grid-item v-if="bidSent">
          <n-alert type="success" :title="t('driver.orders.bidSent')" />
        </n-grid-item>

        <!-- Bid form -->
        <n-grid-item v-if="canBid">
          <n-card :title="t('driver.orders.bidFormTitle')">
            <n-form ref="bidFormRef" :model="bidForm" label-placement="left" label-width="120">
              <n-form-item :label="t('driver.orders.bidAmount')" path="amount" required>
                <n-input-number
                  v-model:value="bidForm.amount"
                  :placeholder="t('driver.orders.bidAmountPlaceholder')"
                  :min="1"
                  style="width: 180px;"
                />
                <n-select
                  v-model:value="bidForm.currency"
                  :options="currencyOptions"
                  style="width: 100px; margin-left: 8px;"
                />
              </n-form-item>
              <n-form-item :label="t('driver.orders.bidComment')" path="comment">
                <n-input
                  v-model:value="bidForm.comment"
                  type="textarea"
                  :placeholder="t('driver.orders.bidCommentPlaceholder')"
                  :rows="2"
                />
              </n-form-item>
            </n-form>
            <div v-if="bidError" style="color: #e53935; margin-bottom: 12px; font-size: 13px;">{{ bidError }}</div>
            <n-button
              type="primary"
              :loading="bidSubmitting"
              @click="submitBid"
            >
              {{ t('driver.orders.bidSend') }}
            </n-button>
          </n-card>
        </n-grid-item>

        <!-- Chat -->
        <n-grid-item v-if="myBid?.status === 'accepted'">
          <n-button type="info" block @click="handleOpenChat">
            💬 {{ t('driver.orders.chatWithClient') }}
          </n-button>
        </n-grid-item>

      </n-grid>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t } = useI18n()
definePageMeta({ layout: 'cabinet-driver' })

const { apiBase: API } = useApiBase()
const route = useRoute()
const message = useMessage()
const { openChat } = useOrderChat()

const loading      = ref(true)
const order        = ref<any>(null)
const cargo        = ref<any>(null)
const myBid        = ref<any>(null)
const bidSent      = ref(false)
const bidSubmitting = ref(false)
const bidError     = ref('')

const bidForm = reactive({ amount: null as number | null, currency: 'USD', comment: '' })

const currencyOptions = ['USD', 'EUR', 'TMT', 'RUB'].map(c => ({ label: c, value: c }))

const STATUS_TYPE: Record<string, string> = {
  draft: 'default', published: 'info', negotiating: 'warning',
  confirmed: 'success', pickup: 'warning', in_transit: 'info',
  delivering: 'info', completed: 'success', cancelled: 'error',
}

const BID_ALERT_TYPE: Record<string, string> = {
  pending: 'warning', accepted: 'success', rejected: 'error', withdrawn: 'default',
}
const BID_TAG_TYPE: Record<string, string> = {
  pending: 'warning', accepted: 'success', rejected: 'error', withdrawn: 'default',
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    draft: t('client.orders.statusDraft'),
    published: t('client.orders.statusPublished'),
    negotiating: t('client.orders.statusNegotiating'),
    confirmed: t('client.orders.statusConfirmed'),
    in_transit: t('client.orders.statusInTransit'),
    completed: t('client.orders.statusCompleted'),
    cancelled: t('client.orders.statusCancelled'),
  }
  return map[status] ?? status
}

function bidStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending:   t('driver.orders.bidStatusPending'),
    accepted:  t('driver.orders.bidStatusAccepted'),
    rejected:  t('driver.orders.bidStatusRejected'),
    withdrawn: t('driver.orders.bidStatusWithdrawn'),
  }
  return map[status] ?? status
}

const canBid = computed(() =>
  order.value &&
  !myBid.value &&
  !bidSent.value &&
  ['published', 'negotiating'].includes(order.value.status)
)

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatWeight(w: string | null) {
  if (!w) return '—'
  const n = parseFloat(w)
  return n >= 1000 ? `${(n / 1000).toFixed(1)} т` : `${n} кг`
}

function handleOpenChat() {
  openChat(order.value?.id ?? null, t('driver.orders.chatWithClient'))
}

async function submitBid() {
  bidError.value = ''
  if (!bidForm.amount || bidForm.amount <= 0) {
    bidError.value = t('driver.orders.bidAmountPlaceholder')
    return
  }
  bidSubmitting.value = true
  try {
    await $fetch(`${API}/cabinet/orders/${route.params.id}/bids`, {
      method: 'POST',
      credentials: 'include',
      body: {
        amount: bidForm.amount,
        currency: bidForm.currency,
        comment: bidForm.comment || undefined,
      },
    })
    bidSent.value = true
    message.success(t('driver.orders.bidSent'))
    await loadOrder()
  } catch (e: any) {
    bidError.value = e?.data?.error?.message ?? e?.data?.error ?? e?.message ?? t('common.error')
  } finally {
    bidSubmitting.value = false
  }
}

async function loadOrder() {
  try {
    const data = await $fetch<any>(`${API}/cabinet/driver/orders/${route.params.id}`, { credentials: 'include' })
    order.value = data.order ?? data
    cargo.value = data.cargo ?? null
    myBid.value = data.myBid ?? null
  } catch {
    order.value = null
  }
}

onMounted(async () => {
  loading.value = true
  await loadOrder()
  loading.value = false
})
</script>

<style scoped>
.route-block {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.route-stop {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.from-dot { background: #1a5bc4; }
.to-dot   { background: #d0021b; }
.stop-city    { font-size: 18px; font-weight: 700; color: #1a1a1a; }
.stop-country { font-size: 11px; color: #bbb; text-transform: uppercase; }
.route-connector { font-size: 20px; color: #ccc; }

.price-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.price-label { font-size: 11px; color: #999; text-transform: uppercase; }
.price-val   { font-size: 20px; font-weight: 800; color: #1a1a1a; }
</style>
