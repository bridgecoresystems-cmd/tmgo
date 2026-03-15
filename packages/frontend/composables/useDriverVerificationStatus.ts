export type VerificationStatus = 'not_verified' | 'not_submitted' | 'draft' | 'waiting_verification' | 'submitted' | 'verified' | 'request' | 'rejected' | 'suspended'

export interface VerificationStatusData {
  status: VerificationStatus
  submitted_at: string | null
  comment: string | null
  can_edit: boolean
  missing_fields: string[]
  unlocked_fields: string[]
}

export function useDriverVerificationStatus() {
  const { apiBase } = useApiBase()
  const { session } = useAuth()
  const status = useState<VerificationStatus | null>('driver-verification-status', () => null)
  const data = useState<VerificationStatusData | null>('driver-verification-data', () => null)

  async function fetchStatus() {
    if (session.value?.user?.role !== 'driver') {
      status.value = null
      data.value = null
      return
    }
    try {
      const res = await $fetch<{ status?: string; can_edit?: boolean; missing_fields?: string[] }>(
        `${apiBase}/cabinet/driver/profile/verification-status`,
        { credentials: 'include' }
      )
      const s = (res?.status ?? 'not_verified') as VerificationStatus
      status.value = s
      data.value = {
        status: s,
        submitted_at: (res as any)?.submitted_at ?? null,
        comment: (res as any)?.comment ?? null,
        can_edit: res?.can_edit ?? true,
        missing_fields: Array.isArray(res?.missing_fields) ? res.missing_fields : [],
        unlocked_fields: Array.isArray((res as any)?.unlocked_fields) ? (res as any).unlocked_fields : [],
      }
    } catch {
      status.value = 'not_verified'
      data.value = null
    }
  }

  onMounted(fetchStatus)
  watch(() => session.value?.user?.id, fetchStatus)

  return { status, data, fetchStatus }
}
