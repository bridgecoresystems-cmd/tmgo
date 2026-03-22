// https://nuxt.com/docs/api/configuration/nuxt-config
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const _dirname = dirname(fileURLToPath(import.meta.url))

/** Парсинг .env без зависимости от vite — чтобы generate всегда подхватывал NUXT_PUBLIC_* из .env.production */
function loadEnvFile(filePath: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!existsSync(filePath)) return out
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

const isProdBuild =
  process.env.NODE_ENV === 'production' ||
  process.env.npm_lifecycle_event === 'generate' ||
  process.argv.some((a) => a === 'generate')
const dotEnv = isProdBuild ? loadEnvFile(resolve(_dirname, '.env.production')) : {}
const apiBase =
  process.env.NUXT_PUBLIC_API_BASE || dotEnv.NUXT_PUBLIC_API_BASE || 'http://localhost:8000'
const wsUrl =
  process.env.NUXT_PUBLIC_WS_URL || dotEnv.NUXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase,
      wsUrl,
    },
  },
  devServer: {
    port: 3000,
    host: '0.0.0.0',
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: [
    'nuxtjs-naive-ui',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
  ],
  plugins: [
    { src: '~/plugins/i18n-locale.client.ts', order: -10 },
  ],
  i18n: {
    locales: [
      { code: 'ru', iso: 'ru-RU', name: 'Русский' },
      { code: 'en', iso: 'en-US', name: 'English' },
      { code: 'tk', iso: 'tk-TM', name: 'Türkmençe' },
    ],
    defaultLocale: 'ru',
    fallbackLocale: 'ru',
    vueI18n: 'i18n.config.ts',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      fallbackLocale: 'ru',
    },
  },
  naiveui: {
    colorMode: 'light'
  },
  // SSR=false — transpile нужен только для SSR, без него Vite пре-бандлит пакеты
  build: {
    transpile: process.env.NODE_ENV === 'production' ? [] : []
  },
  vite: {
    optimizeDeps: {
      // Все тяжёлые пакеты пре-бандлятся один раз при старте → F5 мгновенный
      include: [
        'naive-ui',
        'vueuc',
        '@css-render/vue3-ssr',
        '@juggle/resize-observer',
        '@vicons/ionicons5',
        'vue-i18n',
        'pinia',
        '@vueuse/core',
        'date-fns',
        'lodash-es',
      ],
      // Не ждать полного обхода файлов — стартует сразу
      holdUntilCrawlEnd: false,
    },
    server: {
      warmup: {
        // Прогрев ключевых файлов сразу после старта dev-сервера
        clientFiles: [
          './app.vue',
          './layouts/*.vue',
          './pages/cabinet/driver/vehicles/index.vue',
          './pages/cabinet/driver/orders/index.vue',
          './pages/admin/users/index.vue',
        ],
      },
    },
  },
  css: [
    '~/assets/css/main.css'
  ],
  ssr: false,
  nitro: {
    preset: 'bun',
  },
})
