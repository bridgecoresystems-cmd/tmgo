const chatOpen = ref(false)
const chatOrderId = ref<string | null>(null)
const chatTitle = ref('')

export function useOrderChat() {
  function openChat(orderId: string | null, title: string) {
    chatOrderId.value = orderId
    chatTitle.value = title || 'Чат'
    chatOpen.value = true
  }

  return {
    chatOpen,
    chatOrderId,
    chatTitle,
    openChat,
  }
}
