export type VerificationStatus = 'not_verified' | 'waiting_verification' | 'verified'

export function useDriverVerificationStatus() {
  const { apiBase } = useApiBase()
  const { session } = useAuth()
  const status = useState<VerificationStatus | null>('driver-verification-status', () => null)

  async function fetchStatus() {
    if (session.value?.user?.role !== 'driver') {
      status.value = null
      return
    }
    try {
      const data = await $fetch<{ verification_status: VerificationStatus }>(
        `${apiBase}/cabinet/driver/profile/verification-status`,
        { credentials: 'include' }
      )
      status.value = data?.verification_status ?? 'not_verified'
    } catch {
      status.value = 'not_verified'
    }
  }

  onMounted(fetchStatus)
  watch(() => session.value?.user?.id, fetchStatus)

  return { status, fetchStatus }
}
