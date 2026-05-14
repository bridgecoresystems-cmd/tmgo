<template>
  <Teleport to="body">
    <!-- Two-level picker popup -->
    <Transition name="ccb-slide">
      <div v-if="showPicker" class="ccb-picker">
        <!-- Header -->
        <div class="ccb-picker__header">
          <div class="ccb-picker__header-left">
            <NIcon
              v-if="level === 'drivers'"
              class="ccb-back"
              @click="backToOrders"
            >
              <component :is="BackIcon" />
            </NIcon>
            <span class="ccb-picker__title">
              {{ level === 'orders' ? t('client.chat.title') : selectedOrder?.title }}
            </span>
          </div>
          <NIcon class="ccb-picker__close" @click="showPicker = false">
            <component :is="CloseIcon" />
          </NIcon>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="ccb-picker__state">
          <NSpin size="small" />
          <span>{{ t('client.chat.loading') }}</span>
        </div>

        <!-- Level 1: orders -->
        <template v-else-if="level === 'orders'">
          <div v-if="chatOrders.length === 0" class="ccb-picker__state">
            {{ t('client.chat.noChats') }}
          </div>
          <div
            v-for="order in chatOrders"
            :key="order.id"
            class="ccb-picker__item"
            :class="{ 'ccb-picker__item--active': order.id === selectedOrder?.id }"
            @click="selectOrder(order)"
          >
            <div class="ccb-picker__item-main">
              <div class="ccb-picker__item-title">{{ order.title }}</div>
              <div class="ccb-picker__item-sub">
                {{ order.fromCity }} → {{ order.toCity }}
                <NTag size="tiny" :bordered="false" class="ccb-status-tag">{{ order.status }}</NTag>
              </div>
              <div class="ccb-picker__item-meta">
                {{ t('client.chat.driverCount', { n: order.drivers.length }) }}
              </div>
            </div>
            <span v-if="orderUnread(order) > 0" class="ccb-unread">
              {{ orderUnread(order) > 9 ? '9+' : orderUnread(order) }}
            </span>
            <NIcon size="16" class="ccb-chevron"><component :is="ChevronIcon" /></NIcon>
          </div>
        </template>

        <!-- Level 2: drivers for selected order -->
        <template v-else>
          <div v-if="selectedOrder?.drivers.length === 0" class="ccb-picker__state">
            {{ t('client.chat.noDrivers') }}
          </div>
          <div
            v-for="driver in selectedOrder?.drivers"
            :key="driver.carrierId"
            class="ccb-picker__item"
            :class="{ 'ccb-picker__item--active': driver.carrierId === activeCarrierId }"
            @click="selectDriver(driver)"
          >
            <div class="ccb-picker__item-main">
              <div class="ccb-picker__item-title">{{ driver.carrierName }}</div>
              <div v-if="driver.lastMessage" class="ccb-picker__item-last">
                {{ driver.lastMessage }}
              </div>
            </div>
            <span v-if="driver.unreadCount > 0" class="ccb-unread">
              {{ driver.unreadCount > 9 ? '9+' : driver.unreadCount }}
            </span>
          </div>
        </template>
      </div>
    </Transition>

    <!-- FAB -->
    <button
      v-show="!chatOpen"
      class="ccb-fab"
      :class="{ 'ccb-fab--active': showPicker }"
      @click="handleFabClick"
    >
      <NSpin v-if="loading && !showPicker" size="small" style="color: white;" />
      <NIcon v-else size="22"><component :is="ChatIcon" /></NIcon>
      <span v-if="totalUnread > 0" class="ccb-badge">
        {{ totalUnread > 9 ? '9+' : totalUnread }}
      </span>
    </button>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NIcon, NSpin, NTag } from 'naive-ui'
import {
  ChatbubbleEllipsesOutline as ChatIcon,
  CloseOutline as CloseIcon,
  ArrowBackOutline as BackIcon,
  ChevronForwardOutline as ChevronIcon,
} from '@vicons/ionicons5'

const { t } = useI18n()
const { apiBase: API } = useApiBase()
const { chatOpen, openChat } = useOrderChat()

const chatOrders = ref<any[]>([])
const loading = ref(false)
const showPicker = ref(false)
const level = ref<'orders' | 'drivers'>('orders')
const selectedOrder = ref<any>(null)
const activeCarrierId = ref<string | null>(null)
const totalUnread = computed(() =>
  chatOrders.value.reduce((s, o) => s + orderUnread(o), 0)
)

function orderUnread(order: any): number {
  return (order.drivers ?? []).reduce((s: number, d: any) => s + (d.unreadCount ?? 0), 0)
}

async function loadRooms() {
  if (loading.value) return
  loading.value = true
  try {
    const data = await $fetch<any>(`${API}/cabinet/chat/client-rooms`, { credentials: 'include' })
    chatOrders.value = data.orders ?? []
  } catch {
    chatOrders.value = []
  } finally {
    loading.value = false
  }
}

function selectOrder(order: any) {
  selectedOrder.value = order
  level.value = 'drivers'
}

function selectDriver(driver: any) {
  if (!selectedOrder.value) return
  activeCarrierId.value = driver.carrierId
  showPicker.value = false
  openChat(
    selectedOrder.value.id,
    driver.carrierId,
    t('client.chat.chatWith', { name: driver.carrierName }),
  )
}

function backToOrders() {
  level.value = 'orders'
  selectedOrder.value = null
}

function handleFabClick() {
  if (showPicker.value) { showPicker.value = false; return }
  if (!chatOrders.value.length && !loading.value) loadRooms()
  level.value = 'orders'
  showPicker.value = true
}

watch(chatOpen, open => {
  if (!open) {
    activeCarrierId.value = null
    loadRooms()
  }
})

onMounted(loadRooms)
</script>

<style scoped>
.ccb-fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 1050;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b4a 0%, #e84393 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(255, 107, 74, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  outline: none;
}
.ccb-fab:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(255, 107, 74, 0.55); }
.ccb-fab:active { transform: scale(0.96); }
.ccb-fab--active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

.ccb-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid white;
  pointer-events: none;
}

.ccb-picker {
  position: fixed;
  bottom: 144px; /* above FAB at bottom:80 */
  right: 20px;
  width: 300px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.16);
  z-index: 1050;
  overflow: hidden;
  max-height: 420px;
  overflow-y: auto;
}

.ccb-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ff6b4a 0%, #e84393 100%);
  color: white;
  position: sticky;
  top: 0;
  z-index: 1;
}
.ccb-picker__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.ccb-picker__title {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ccb-picker__close, .ccb-back {
  cursor: pointer;
  color: rgba(255,255,255,0.85);
  padding: 2px;
  border-radius: 4px;
  transition: background 0.15s;
  flex-shrink: 0;
}
.ccb-picker__close:hover, .ccb-back:hover {
  background: rgba(255,255,255,0.2);
  color: white;
}

.ccb-picker__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 16px;
  font-size: 13px;
  color: #6b7280;
}

.ccb-picker__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;
}
.ccb-picker__item:last-child { border-bottom: none; }
.ccb-picker__item:hover { background: #f9fafb; }
.ccb-picker__item--active { background: #fff0ec; }

.ccb-picker__item-main {
  flex: 1;
  min-width: 0;
}
.ccb-picker__item-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ccb-picker__item-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}
.ccb-picker__item-meta {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}
.ccb-picker__item-last {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ccb-chevron { color: #d1d5db; flex-shrink: 0; }

.ccb-unread {
  flex-shrink: 0;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: #ff6b4a;
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}
.ccb-status-tag { font-size: 10px !important; }

.ccb-slide-enter-active {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s ease;
}
.ccb-slide-leave-active {
  transition: transform 0.18s ease, opacity 0.15s ease;
}
.ccb-slide-enter-from,
.ccb-slide-leave-to {
  transform: translateY(12px);
  opacity: 0;
}

@media (max-width: 480px) {
  .ccb-picker { width: calc(100vw - 40px); right: 20px; }
}
</style>
