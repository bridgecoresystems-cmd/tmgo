const chatOpen = ref(false)
const chatOrderId = ref<string | null>(null)
const chatCarrierId = ref<string | null>(null)
const chatTitle = ref('')

export function useOrderChat() {
  function openChat(orderId: string | null, carrierId: string | null, title: string) {
    chatOrderId.value = orderId
    chatCarrierId.value = carrierId
    chatTitle.value = title || 'Чат'
    chatOpen.value = true
  }

  return {
    chatOpen,
    chatOrderId,
    chatCarrierId,
    chatTitle,
    openChat,
  }
}
