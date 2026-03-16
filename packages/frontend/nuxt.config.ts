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
  i18n: {
    locales: [
      { code: 'ru', iso: 'ru-RU', name: 'Русский' },
      { code: 'en', iso: 'en-US', name: 'English' },
      { code: 'tk', iso: 'tk-TM', name: 'Türkmençe' },
    ],
    defaultLocale: 'ru',
    fallbackLocale: 'ru',
    vueI18n: 'i18n.config.ts',
  },
  naiveui: {
    colorMode: 'light'
  },
  build: {
    transpile: ['naive-ui', 'vueuc', '@css-render/vue3-ssr', '@juggle/resize-observer']
  },
  vite: {
    optimizeDeps: {
      include: ['naive-ui', 'vueuc']
    }
  },
  css: [
    '~/assets/css/main.css'
  ],
  ssr: false,
  nitro: {
    preset: 'bun',
  },
})
