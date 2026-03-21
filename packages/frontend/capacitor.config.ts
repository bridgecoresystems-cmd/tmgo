import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tmgo.app',
  appName: 'TMGO',
  webDir: '.output/public',
  server: {
    androidScheme: 'https',
    cleartext: true, // разрешаем http для dev-бэкенда
  },
  android: {
    allowMixedContent: true,
  },
}

export default config
