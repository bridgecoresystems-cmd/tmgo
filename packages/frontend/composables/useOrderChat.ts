import { ref } from 'vue'

const chatOpen = ref(false)
const chatOrderId = ref<string | null>(null)
const chatCarrierId = ref<string | null>(null)
const chatTitle = ref('')

const chatClosedTick = ref(0)

export function useOrderChat() {
  const { apiBase: API } = useApiBase()

  function openChat(orderId: string | null, carrierId: string | null, title: string) {
    chatOrderId.value = orderId
    chatCarrierId.value = carrierId
    chatTitle.value = title || 'Чат'
    chatOpen.value = true
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
      try {
        await $fetch(`${API}/cabinet/chat/mark-read/${orderId}/${carrierId}`, {
          method: 'POST',
          credentials: 'include',
        })
      } catch {}
    }
    chatOpen.value = false
    chatOrderId.value = null
    chatCarrierId.value = null
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
  }
}
