/**
 * Migrate locale from localStorage (old) to cookie (nuxt i18n).
 * Runs before app mount so cookie is set before i18n initializes.
 */
const STORAGE_KEY = 'tmgo_i18n_locale'
const VALID_LOCALES = ['ru', 'en', 'tk']
const COOKIE_KEY = 'i18n_redirected'

export default defineNuxtPlugin(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && VALID_LOCALES.includes(stored)) {
    const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:'
    document.cookie = `${COOKIE_KEY}=${stored};path=/;max-age=31536000;SameSite=Lax${secure ? ';Secure' : ''}`
    localStorage.removeItem(STORAGE_KEY)
  }
})
