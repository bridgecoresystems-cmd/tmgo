<template>
  <NuxtLayout name="default">
    <ErrorPageLayout v-bind="pageProps" />
  </NuxtLayout>
</template>

<script setup lang="ts">
const props = defineProps({ error: Object })

const pageProps = computed(() => {
  const code = props.error?.statusCode ?? 500
  const map: Record<number, object> = {
    404: {
      code: 404,
      icon: 'M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      titleKey: 'errors.404.title',
      messageKey: 'errors.404.message',
      hintKey: 'errors.404.hint',
      btnLabelKey: 'errors.goHome',
      btnTo: '/',
    },
    403: {
      code: 403,
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      titleKey: 'errors.403.title',
      messageKey: 'errors.403.message',
      hintKey: 'errors.403.hint',
      btnLabelKey: 'errors.goHome',
      btnTo: '/',
    },
    401: {
      code: 401,
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      titleKey: 'errors.401.title',
      messageKey: 'errors.401.message',
      btnLabelKey: 'errors.goAuth',
      btnTo: '/auth',
    },
    429: {
      code: 429,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      titleKey: 'auth.rateLimited.title',
      messageKey: 'auth.rateLimited.message',
      hintKey: 'auth.rateLimited.hint',
      btnLabelKey: 'auth.rateLimited.back',
      btnTo: '/auth',
      showTimer: true,
      timerSeconds: 900,
    },
    503: {
      code: 503,
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      titleKey: 'errors.503.title',
      messageKey: 'errors.503.message',
      hintKey: 'errors.503.hint',
      btnLabelKey: 'errors.goHome',
      btnTo: '/',
    },
  }
  return map[code] ?? {
    code: 500,
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    titleKey: 'errors.500.title',
    messageKey: 'errors.500.message',
    hintKey: 'errors.500.hint',
    btnLabelKey: 'errors.goHome',
    btnTo: '/',
  }
})
</script>
