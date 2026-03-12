// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    apiUrl: process.env.NUXT_API_URL || process.env.API_URL || 'http://127.0.0.1:8000',
    public: {
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
    '@pinia/nuxt'
  ],
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
    preset: 'bun'
  }
})
