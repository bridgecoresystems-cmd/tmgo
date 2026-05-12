import { reactive, readonly } from 'vue'
import type { AuthUser } from '@/api/auth'
import { apiGetSession, apiSignOut } from '@/api/auth'

const STORAGE_KEY = 'tmgo_user'

function loadStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const state = reactive<{ user: AuthUser | null; ready: boolean }>({
  user: loadStored(),
  ready: false,
})

export function useAuth() {
  async function init() {
    if (state.ready) return
    const user = await apiGetSession()
    state.user = user
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
    state.ready = true
  }

  function setUser(user: AuthUser) {
    state.user = user
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  }

  async function signOut() {
    await apiSignOut()
    state.user = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    user: readonly(state),
    init,
    setUser,
    signOut,
  }
}
