<template>
  <div>
    <UiBackBtn to="/admin/legal" />

    <div class="editor-header">
      <div>
        <n-h3 style="margin:0;">{{ t(`legalDocs.docTypes.${docType}`) }} — {{ localeFlag[locale as string] }} {{ (locale as string).toUpperCase() }}</n-h3>
        <n-text depth="3" style="font-size:13px;">{{ t('legalDocs.editor.markdownHint') }}</n-text>
      </div>
      <n-space>
        <n-tag :type="form.isPublished ? 'success' : 'warning'" size="medium">
          {{ form.isPublished ? t('legalDocs.status.published') : t('legalDocs.status.draft') }}
        </n-tag>
      </n-space>
    </div>

    <n-spin :show="loading">
      <div class="editor-body">
        <n-grid :cols="2" :x-gap="16" responsive="screen" item-responsive>
          <!-- Left: fields -->
          <n-gi span="2 m:1">
            <n-card :bordered="false" class="field-card">
              <n-form label-placement="top" :show-feedback="false">
                <n-grid :cols="2" :x-gap="12">
                  <n-gi>
                    <n-form-item :label="t('legalDocs.editor.fieldVersion')">
                      <n-input v-model:value="form.version" placeholder="1.0" />
                    </n-form-item>
                  </n-gi>
                  <n-gi>
                    <n-form-item :label="t('legalDocs.editor.fieldEffectiveDate')">
                      <n-date-picker
                        v-model:value="effectiveDateTs"
                        type="date"
                        clearable
                        style="width:100%"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>

                <n-form-item :label="t('legalDocs.editor.fieldTitle')" style="margin-top:12px">
                  <n-input v-model:value="form.title" :placeholder="t('legalDocs.editor.fieldTitle')" />
                </n-form-item>

                <n-form-item :label="t('legalDocs.editor.fieldContent')" style="margin-top:12px">
                  <n-input
                    v-model:value="form.content"
                    type="textarea"
                    :placeholder="t('legalDocs.editor.contentPlaceholder')"
                    :autosize="{ minRows: 20, maxRows: 40 }"
                    style="font-family: monospace; font-size: 13px;"
                  />
                </n-form-item>
              </n-form>

              <div class="action-row">
                <n-space>
                  <n-button type="primary" :loading="saving" @click="saveDraft">
                    {{ t('legalDocs.editor.saveDraft') }}
                  </n-button>
                  <n-button
                    type="success"
                    :loading="publishing"
                    :disabled="!docExists"
                    @click="publish"
                  >
                    {{ t('legalDocs.editor.publish') }}
                  </n-button>
                  <UiDeleteBtn
                    v-if="form.isPublished"
                    :danger="false"
                    :confirm-text="t('legalDocs.editor.unpublishConfirm')"
                    :label="t('legalDocs.editor.unpublish')"
                    :loading="unpublishing"
                    @confirm="unpublish"
                  />
                </n-space>
                <n-text depth="3" style="font-size:12px" v-if="form.updatedAt">
                  {{ t('legalDocs.editor.lastUpdated') }}: {{ new Date(form.updatedAt).toLocaleString('ru-RU') }}
                </n-text>
              </div>
            </n-card>
          </n-gi>

          <!-- Right: preview -->
          <n-gi span="2 m:1">
            <n-card :bordered="false" class="preview-card">
              <template #header>
                <n-text strong>{{ t('legalDocs.editor.preview') }}</n-text>
              </template>
              <div class="markdown-preview" v-html="renderedContent" />
            </n-card>
          </n-gi>
        </n-grid>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'admin',  })
const { t } = useI18n()
const { apiBase } = useApiBase()
const message = useMessage()
const route = useRoute()

const docType = computed(() => route.params.docType as string)
const locale = computed(() => route.params.locale as string)

const localeFlag: Record<string, string> = { ru: '🇷🇺', en: '🇬🇧', tk: '🇹🇲' }

const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const unpublishing = ref(false)
const docExists = ref(false)

const form = reactive({
  title: '',
  content: '',
  version: '1.0',
  isPublished: false,
  updatedAt: null as string | null,
})

const effectiveDateTs = ref<number | null>(null)

const renderedContent = computed(() => {
  if (!form.content) return ''
  return marked.parse(form.content) as string
})

async function loadDoc() {
  loading.value = true
  try {
    const data = await $fetch<any>(`${apiBase}/admin/legal-docs/${docType.value}/${locale.value}`, {
      credentials: 'include',
    })
    form.title = data.title
    form.content = data.content
    form.version = data.version
    form.isPublished = data.isPublished
    form.updatedAt = data.updatedAt
    effectiveDateTs.value = data.effectiveDate ? new Date(data.effectiveDate).getTime() : null
    docExists.value = true
  } catch (e: any) {
    if (e?.statusCode === 404 || e?.status === 404) {
      docExists.value = false
    }
  } finally {
    loading.value = false
  }
}

async function saveDraft() {
  if (!form.title || !form.content) {
    message.warning(t('legalDocs.editor.fillRequired'))
    return
  }
  saving.value = true
  try {
    const data = await $fetch<any>(`${apiBase}/admin/legal-docs/${docType.value}/${locale.value}`, {
      method: 'PUT',
      credentials: 'include',
      body: {
        title: form.title,
        content: form.content,
        version: form.version,
        effectiveDate: effectiveDateTs.value ? new Date(effectiveDateTs.value).toISOString() : null,
      },
    })
    form.updatedAt = data.updatedAt
    form.isPublished = data.isPublished
    docExists.value = true
    message.success(t('legalDocs.editor.savedSuccess'))
  } catch (e: any) {
    message.error(t('legalDocs.editor.saveError'))
  } finally {
    saving.value = false
  }
}

async function publish() {
  saving.value = true
  publishing.value = true
  try {
    // Save first
    await $fetch(`${apiBase}/admin/legal-docs/${docType.value}/${locale.value}`, {
      method: 'PUT',
      credentials: 'include',
      body: {
        title: form.title,
        content: form.content,
        version: form.version,
        effectiveDate: effectiveDateTs.value ? new Date(effectiveDateTs.value).toISOString() : null,
      },
    })
    // Then publish
    await $fetch(`${apiBase}/admin/legal-docs/${docType.value}/${locale.value}/publish`, {
      method: 'POST',
      credentials: 'include',
    })
    form.isPublished = true
    message.success(t('legalDocs.editor.publishedSuccess'))
  } catch (e: any) {
    message.error(t('legalDocs.editor.saveError'))
  } finally {
    saving.value = false
    publishing.value = false
  }
}

async function unpublish() {
  unpublishing.value = true
  try {
    await $fetch(`${apiBase}/admin/legal-docs/${docType.value}/${locale.value}/unpublish`, {
      method: 'POST',
      credentials: 'include',
    })
    form.isPublished = false
    message.success(t('legalDocs.editor.unpublishedSuccess'))
  } catch (e: any) {
    message.error(t('legalDocs.editor.saveError'))
  } finally {
    unpublishing.value = false
  }
}

onMounted(loadDoc)
</script>

<style scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: 16px 0 20px;
  gap: 16px;
}
.editor-body {
  margin-top: 4px;
}
.field-card, .preview-card {
  height: 100%;
}
.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 12px;
}
.markdown-preview {
  font-size: 14px;
  line-height: 1.7;
  color: #333;
}
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  margin-top: 1em;
  margin-bottom: 0.5em;
}
.markdown-preview :deep(p) {
  margin-bottom: 0.8em;
}
.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 1.5em;
  margin-bottom: 0.8em;
}
</style>
