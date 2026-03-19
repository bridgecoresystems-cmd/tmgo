// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:8000',
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
