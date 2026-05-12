const BASE = import.meta.env.VITE_API_URL ?? '/api'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'client' | 'driver' | 'admin'
  emailVerified: boolean
  image?: string | null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? 'Ошибка запроса')
  return data as T
}

export async function apiSignIn(email: string, password: string): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>('/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return data.user
}

export async function apiSignUp(email: string, password: string, role: 'client' | 'driver'): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>('/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: email.split('@')[0], role }),
  })
  return data.user
}

export async function apiGetSession(): Promise<AuthUser | null> {
  try {
    const data = await request<{ user: AuthUser | null }>('/auth/get-session')
    return data.user
  } catch {
    return null
  }
}

export async function apiSignOut(): Promise<void> {
  await request('/auth/sign-out', { method: 'POST' })
}
