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
}

// Глобальный реактивный стейт сессии
const state = reactive<SessionState>({ user: null, loading: true })
let initialized = false

export const useAuth = () => {
  const { apiBase: API } = useApiBase()
  const session = computed(() => state.user ? { user: state.user } : null)

  async function fetchSession() {
    try {
      const data = await $fetch<{ user: AuthUser | null }>(`${API}/api/auth/get-session`, {
        credentials: 'include',
      })
      if (import.meta.dev) console.log('[useAuth] get-session response:', data?.user ? { ...data.user, image: data.user.image } : null)
      state.user = data?.user ?? null
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
    const data = await $fetch<{ user: AuthUser; error?: { message: string } }>(
      `${API}/api/auth/sign-in/email`,
      { method: 'POST', body: { email, password }, credentials: 'include' }
    )
    if ((data as any).error) throw new Error((data as any).error.message)
    state.user = data.user
    return data.user
  }

  async function signUp(email: string, password: string, name?: string, role?: string) {
    const data = await $fetch<{ user: AuthUser; error?: { message: string } }>(
      `${API}/api/auth/sign-up/email`,
      { method: 'POST', body: { email, password, name, role }, credentials: 'include' }
    )
    if ((data as any).error) throw new Error((data as any).error.message)
    state.user = data.user
    return data.user
  }

  async function signOut() {
    await $fetch(`${API}/api/auth/sign-out`, { method: 'POST', credentials: 'include' })
    state.user = null
  }

  return { session, loading: computed(() => state.loading), signIn, signUp, signOut, fetchSession }
}
