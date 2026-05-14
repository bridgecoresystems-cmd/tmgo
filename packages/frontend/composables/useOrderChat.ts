import { ref } from 'vue'

const chatOpen = ref(false)
const chatOrderId = ref<string | null>(null)
const chatCarrierId = ref<string | null>(null)
const chatTitle = ref('')

// Client-authoritative read tracking (WhatsApp-style).
// Key = `${orderId}:${carrierId}` → timestamp (ms) when client last marked this chat read.
// Overrides server's unread count for any room whose lastMessageAt is older than this.
// This makes badges robust even if server's read cursor is stale or laggy.
const clientReadAt = ref<Record<string, number>>({})

const chatClosedTick = ref(0)

function roomKey(orderId: string | null, carrierId: string | null) {
  return `${orderId ?? ''}:${carrierId ?? ''}`
}

function markRoomRead(orderId: string | null, carrierId: string | null) {
  if (!orderId || !carrierId) return
  clientReadAt.value[roomKey(orderId, carrierId)] = Date.now()
}

// True if client believes this room is fully read.
// A room is "read" if our local read timestamp is at or after the room's last message.
function isRoomRead(
  orderId: string | null,
  carrierId: string | null,
  lastMessageAt: string | Date | null | undefined,
): boolean {
  if (!orderId || !carrierId) return false
  const readAt = clientReadAt.value[roomKey(orderId, carrierId)]
  if (!readAt) return false
  if (!lastMessageAt) return true
  const lastMs = new Date(lastMessageAt).getTime()
  // 1s slack — covers DB/JS clock skew without letting truly new messages slip through.
  return readAt + 1000 >= lastMs
}

export function useOrderChat() {
  const { apiBase: API } = useApiBase()

  function openChat(orderId: string | null, carrierId: string | null, title: string) {
    chatOrderId.value = orderId
    chatCarrierId.value = carrierId
    chatTitle.value = title || 'Чат'
    chatOpen.value = true
    // Mark read on client immediately — badge derives from this.
    markRoomRead(orderId, carrierId)
    // Sync to server (best effort; doesn't gate the UI).
    if (orderId && carrierId) {
      $fetch(`${API}/cabinet/chat/mark-read/${orderId}/${carrierId}`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {})
    }
  }

  async function closeChat() {
    const orderId = chatOrderId.value
    const carrierId = chatCarrierId.value
    if (orderId && carrierId) {
      // Re-mark on close in case new messages arrived during the session.
      markRoomRead(orderId, carrierId)
      try {
        await $fetch(`${API}/cabinet/chat/mark-read/${orderId}/${carrierId}`, {
          method: 'POST',
          credentials: 'include',
        })
      } catch {}
    }
    chatOpen.value = false
    chatClosedTick.value++
  }

  return {
    chatOpen,
    chatOrderId,
    chatCarrierId,
    chatTitle,
    chatClosedTick,
    openChat,
    closeChat,
    markRoomRead,
    isRoomRead,
  }
}
