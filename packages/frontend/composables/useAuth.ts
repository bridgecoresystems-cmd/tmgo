interface AuthUser {
  id: string
  name: string
  email: string
  image?: string
  phone?: string
  role: 'client' | 'driver' | 'dispatcher' | 'admin'
  emailVerified: boolean
  createdAt: string
}

interface SessionState {
  user: AuthUser | null
  loading: boolean
  isImpersonating: boolean
}

// Глобальный реактивный стейт сессии
const state = reactive<SessionState>({ user: null, loading: true, isImpersonating: false })
let initialized = false

export const useAuth = () => {
  const { apiBase: API } = useApiBase()
  const session = computed(() => state.user ? { user: state.user } : null)

  async function fetchSession() {
    try {
      const data = await $fetch<{ user: AuthUser | null; isImpersonating?: boolean }>(`${API}/api/auth/get-session`, {
        credentials: 'include',
      })
      if (import.meta.dev) console.log('[useAuth] get-session response:', data?.user ? { ...data.user, image: data.user.image } : null)
      state.user = data?.user ?? null
      state.isImpersonating = data?.isImpersonating ?? false
    } catch (e) {
      if (import.meta.dev) console.log('[useAuth] get-session error:', e)
      state.user = null
    } finally {
      state.loading = false
    }
  }

  // Инициализируем один раз
  if (!initialized) {
    initialized = true
    fetchSession()
  }

  async function signIn(email: string, password: string) {
    try {
      const data = await $fetch<{ user: AuthUser; error?: { message: string } }>(
        `${API}/api/auth/sign-in/email`,
        { method: 'POST', body: { email, password }, credentials: 'include' }
      )
      if ((data as any).error) throw new Error((data as any).error.message)
      state.user = data.user
      return data.user
    } catch (e: any) {
      const is429 = e?.statusCode === 429 || e?.status === 429 || e?.response?.status === 429
      if (is429) {
        const msg = e?.data?.error?.message ?? e?.data?.message ?? 'Слишком много попыток входа. Попробуйте через 15 минут.'
        const err = new Error(msg) as Error & { isRateLimited?: boolean }
        err.isRateLimited = true
        throw err
      }
      // 401 и др.: показываем сообщение из ответа бэкенда (русский текст)
      const bodyMsg = e?.data?.error?.message ?? e?.data?.message
      if (bodyMsg) throw new Error(bodyMsg)
      throw e
    }
  }

  async function signUp(email: string, password: string, name?: string, role?: string) {
    try {
      const data = await $fetch<{ user: AuthUser; error?: { message: string } }>(
        `${API}/api/auth/sign-up/email`,
        { method: 'POST', body: { email, password, name, role }, credentials: 'include' }
      )
      if ((data as any).error) throw new Error((data as any).error.message)
      state.user = data.user
      return data.user
    } catch (e: any) {
      const bodyMsg = e?.data?.error?.message ?? e?.data?.message
      if (bodyMsg) throw new Error(bodyMsg)
      throw e
    }
  }

  async function signOut() {
    await $fetch(`${API}/api/auth/sign-out`, { method: 'POST', credentials: 'include' })
    state.user = null
  }

  return {
    session,
    loading: computed(() => state.loading),
    isImpersonating: computed(() => state.isImpersonating),
    signIn,
    signUp,
    signOut,
    fetchSession,
  }
}
