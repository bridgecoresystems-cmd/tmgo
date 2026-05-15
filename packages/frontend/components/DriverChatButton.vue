<template>
  <Teleport to="body">
    <!-- Order picker popup -->
    <Transition name="dcb-slide">
      <div v-if="showPicker" class="dcb-picker">
        <div class="dcb-picker__header">
          <span class="dcb-picker__title">{{ t('driver.chat.title') }}</span>
          <NIcon class="dcb-picker__close" @click="showPicker = false">
            <component :is="CloseIcon" />
          </NIcon>
        </div>

        <div v-if="loading" class="dcb-picker__state">
          <NSpin size="small" />
          <span>{{ t('driver.chat.loading') }}</span>
        </div>

        <div v-else-if="rooms.length === 0" class="dcb-picker__state">
          {{ t('driver.chat.noChats') }}
        </div>

        <div
          v-for="room in rooms"
          :key="room.orderId"
          class="dcb-picker__item"
          :class="{ 'dcb-picker__item--active': room.orderId === activeOrderId }"
          @click="selectRoom(room)"
        >
          <div class="dcb-picker__item-main">
            <div class="dcb-picker__item-title"><strong style="color: #333">#ORD{{ room.seqNo || room.orderId.split('-')[0] }}</strong> • {{ room.orderTitle }}</div>
            <div class="dcb-picker__item-sub">
              {{ room.fromCity }} → {{ room.toCity }} · {{ room.clientName }}
            </div>
            <div v-if="room.lastMessage" class="dcb-picker__item-last">
              {{ room.lastMessage }}
            </div>
          </div>
          <span v-if="effectiveUnread(room) > 0" class="dcb-unread">
            {{ effectiveUnread(room) > 9 ? '9+' : effectiveUnread(room) }}
          </span>
        </div>
      </div>
    </Transition>

    <!-- FAB -->
    <button
      v-show="!chatOpen"
      class="dcb-fab"
      :class="{ 'dcb-fab--active': showPicker }"
      @click="handleFabClick"
    >
      <NSpin v-if="loading && !showPicker" size="small" style="color: white;" />
      <NIcon v-else size="22"><component :is="ChatIcon" /></NIcon>
      <span v-if="totalUnread > 0" class="dcb-badge">
        {{ totalUnread > 9 ? '9+' : totalUnread }}
      </span>
    </button>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { NIcon, NSpin } from 'naive-ui'
import {
  ChatbubbleEllipsesOutline as ChatIcon,
  CloseOutline as CloseIcon,
} from '@vicons/ionicons5'

const { t } = useI18n()
const { apiBase: API, wsUrl: WS_BASE } = useApiBase()
const { chatOpen, chatOrderId, chatCarrierId, chatClosedTick, openChat } = useOrderChat()

const rooms = ref<any[]>([])
const loading = ref(false)
const showPicker = ref(false)
const activeOrderId = ref<string | null>(null)

// Single source of truth for badge math: server count, updated optimistically on client.
// - currently-active chat → 0
// - otherwise → server's unreadCount
function effectiveUnread(room: any): number {
  if (
    chatOpen.value &&
    room.orderId === chatOrderId.value &&
    room.carrierId === chatCarrierId.value
  ) return 0
  return room.unreadCount ?? 0
}

const totalUnread = computed(() => rooms.value.reduce((s, r) => s + effectiveUnread(r), 0))

async function loadRooms() {
  if (loading.value) return
  loading.value = true
  try {
    const data = await $fetch<any>(`${API}/cabinet/chat/driver-rooms`, { credentials: 'include' })
    rooms.value = data.rooms ?? []
  } catch {
    rooms.value = []
  } finally {
    loading.value = false
  }
}

function selectRoom(room: any) {
  room.unreadCount = 0 // optimistic update
  activeOrderId.value = room.orderId
  showPicker.value = false
  openChat(
    room.orderId,
    room.carrierId,
    `#ORD${room.seqNo || room.orderId.split('-')[0]} • ` + (room.clientName || t('driver.chat.client'))
  )
}

function handleFabClick() {
  if (showPicker.value) { showPicker.value = false; return }
  if (!rooms.value.length && !loading.value) loadRooms()
  showPicker.value = true
}

// Refresh after the chat closes so lastMessage previews stay fresh.
watch(chatClosedTick, () => {
  if (activeOrderId.value) {
    const room = rooms.value.find(r => r.orderId === activeOrderId.value)
    if (room) room.unreadCount = 0
  }
  activeOrderId.value = null
  loadRooms()
})

let notifyWs: WebSocket | null = null

function openNotifyWs() {
  notifyWs = new WebSocket(`${WS_BASE}/cabinet/chat/ws/notify`)
  notifyWs.onmessage = () => loadRooms()
  notifyWs.onclose = () => { notifyWs = null }
}

onMounted(() => {
  loadRooms()
  openNotifyWs()
})

onUnmounted(() => {
  notifyWs?.close()
  notifyWs = null
})

function openPicker() {
  showPicker.value = true
}

defineExpose({ openPicker })
</script>

<style scoped>
.dcb-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1050;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  outline: none;
}
.dcb-fab:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(102, 126, 234, 0.55); }
.dcb-fab:active { transform: scale(0.96); }
.dcb-fab--active { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }

.dcb-badge {
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

.dcb-picker {
  position: fixed;
  bottom: 84px;
  right: 20px;
  width: 300px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.16);
  z-index: 1050;
  overflow: hidden;
  max-height: 400px;
  overflow-y: auto;
}
.dcb-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: sticky;
  top: 0;
}
.dcb-picker__title { font-weight: 600; font-size: 14px; }
.dcb-picker__close {
  cursor: pointer;
  color: rgba(255,255,255,0.85);
  padding: 2px;
  border-radius: 4px;
  transition: background 0.15s;
}
.dcb-picker__close:hover { background: rgba(255,255,255,0.2); color: white; }

.dcb-picker__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 16px;
  font-size: 13px;
  color: #6b7280;
}

.dcb-picker__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;
}
.dcb-picker__item:last-child { border-bottom: none; }
.dcb-picker__item:hover { background: #f9fafb; }
.dcb-picker__item-main {
  flex: 1;
  min-width: 0;
}
.dcb-picker__item--active { background: #ede9fe; }

.dcb-picker__item-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dcb-picker__item-sub {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}
.dcb-picker__item-last {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dcb-unread {
  flex-shrink: 0;
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
}

.dcb-slide-enter-active {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s ease;
}
.dcb-slide-leave-active {
  transition: transform 0.18s ease, opacity 0.15s ease;
}
.dcb-slide-enter-from,
.dcb-slide-leave-to {
  transform: translateY(12px);
  opacity: 0;
}

@media (max-width: 480px) {
  .dcb-picker { width: calc(100vw - 40px); right: 20px; }
}
</style>
