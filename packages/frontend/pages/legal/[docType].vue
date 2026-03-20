<template>
  <div class="legal-page">
    <div class="legal-container">
      <n-spin v-if="loading" style="display:block;text-align:center;padding:60px 0" />

      <n-result
        v-else-if="notFound"
        status="404"
        :title="t('legalDocs.public.notAvailable')"
        :description="t('legalDocs.public.notAvailableDesc')"
      >
        <template #footer>
          <n-button @click="navigateTo('/')">{{ t('common.backToHome') }}</n-button>
        </template>
      </n-result>

      <article v-else class="legal-article">
        <header class="legal-header">
          <h1 class="legal-title">{{ doc.title }}</h1>
          <div class="legal-meta">
            <n-tag size="small" type="success">v{{ doc.version }}</n-tag>
            <n-text depth="3" style="font-size:13px;" v-if="doc.effectiveDate">
              {{ t('legalDocs.public.effectiveFrom') }}: {{ new Date(doc.effectiveDate).toLocaleDateString('ru-RU') }}
            </n-text>
          </div>
        </header>
        <div class="legal-content" v-html="renderedContent" />
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

definePageMeta({ layout: 'default' })
const { t, locale } = useI18n()
const { apiBase } = useApiBase()
const route = useRoute()

const docType = computed(() => route.params.docType as string)
const loading = ref(true)
const notFound = ref(false)
const doc = ref<any>(null)

const renderedContent = computed(() => {
  if (!doc.value?.content) return ''
  return marked.parse(doc.value.content) as string
})

async function loadDoc() {
  loading.value = true
  notFound.value = false
  try {
    const data = await $fetch<any>(`${apiBase}/legal/${docType.value}/${locale.value}`)
    doc.value = data
  } catch (e: any) {
    // fallback to 'ru' if not found
    if (locale.value !== 'ru') {
      try {
        const data = await $fetch<any>(`${apiBase}/legal/${docType.value}/ru`)
        doc.value = data
      } catch {
        notFound.value = true
      }
    } else {
      notFound.value = true
    }
  } finally {
    loading.value = false
  }
}

watch(locale, loadDoc)
onMounted(loadDoc)

useSeoMeta({
  title: computed(() => doc.value?.title ?? t('legalDocs.public.notAvailable')),
})
</script>

<style scoped>
.legal-page {
  background: #fff;
  min-height: calc(100vh - 80px);
}
.legal-container {
  max-width: 860px;
  margin: 0 auto;
  padding: 48px 24px;
}
.legal-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f0f0f0;
}
.legal-title {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 12px;
}
.legal-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}
.legal-content {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
}
.legal-content :deep(h1),
.legal-content :deep(h2),
.legal-content :deep(h3) {
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #1a1a1a;
}
.legal-content :deep(p) {
  margin-bottom: 1em;
}
.legal-content :deep(ul),
.legal-content :deep(ol) {
  padding-left: 1.8em;
  margin-bottom: 1em;
}
.legal-content :deep(li) {
  margin-bottom: 0.3em;
}
.legal-content :deep(strong) {
  font-weight: 600;
}
.legal-content :deep(em) {
  color: #555;
}
</style>
