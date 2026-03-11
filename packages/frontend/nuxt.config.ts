// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    port: 3000
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
