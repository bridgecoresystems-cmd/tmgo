<template>
  <div>
    <div class="page-actions-row">
      <n-text depth="3" style="font-size:13px;">{{ t('legalDocs.pageSubtitle') }}</n-text>
    </div>

    <n-data-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :bordered="false"
      size="small"
      style="margin-top: 16px;"
    />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, NButton, NSpace } from 'naive-ui'

definePageMeta({ layout: 'admin',  })
const { t } = useI18n()
const { apiBase } = useApiBase()

const loading = ref(false)
const docs = ref<any[]>([])

const DOC_TYPES = ['agreement', 'privacy', 'rules'] as const
const LOCALES = ['ru', 'en', 'tk'] as const

// Build a full grid: for each docType × locale, show a row (even if doc doesn't exist yet)
const tableData = computed(() => {
  const rows: any[] = []
  for (const docType of DOC_TYPES) {
    for (const locale of LOCALES) {
      const doc = docs.value.find(d => d.docType === docType && d.locale === locale)
      rows.push({
        docType,
        locale,
        version: doc?.version ?? '—',
        isPublished: doc?.isPublished ?? false,
        updatedAt: doc?.updatedAt ?? null,
        exists: !!doc,
      })
    }
  }
  return rows
})

const localeFlag: Record<string, string> = { ru: '🇷🇺', en: '🇬🇧', tk: '🇹🇲' }

const columns = computed(() => [
  {
    title: t('legalDocs.table.docType'),
    key: 'docType',
    render(row: any) {
      return h('span', { style: 'font-weight:600' }, t(`legalDocs.docTypes.${row.docType}`))
    },
  },
  {
    title: t('legalDocs.table.locale'),
    key: 'locale',
    width: 100,
    render(row: any) {
      return h('span', {}, `${localeFlag[row.locale]} ${row.locale.toUpperCase()}`)
    },
  },
  {
    title: t('legalDocs.table.version'),
    key: 'version',
    width: 100,
  },
  {
    title: t('legalDocs.table.status'),
    key: 'isPublished',
    width: 140,
    render(row: any) {
      if (!row.exists) return h(NTag, { type: 'default', size: 'small' }, { default: () => '—' })
      return h(NTag, { type: row.isPublished ? 'success' : 'warning', size: 'small' }, {
        default: () => row.isPublished ? t('legalDocs.status.published') : t('legalDocs.status.draft'),
      })
    },
  },
  {
    title: t('legalDocs.table.updatedAt'),
    key: 'updatedAt',
    width: 180,
    render(row: any) {
      if (!row.updatedAt) return h('span', { style: 'color:#999' }, '—')
      return h('span', {}, new Date(row.updatedAt).toLocaleString('ru-RU'))
    },
  },
  {
    title: t('legalDocs.table.actions'),
    key: 'actions',
    width: 120,
    render(row: any) {
      return h(NButton, {
        size: 'small',
        type: 'primary',
        ghost: true,
        onClick: () => navigateTo(`/admin/legal/${row.docType}/${row.locale}`),
      }, { default: () => t('common.edit') })
    },
  },
])

async function loadDocs() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${apiBase}/admin/legal-docs`, { credentials: 'include' })
    docs.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadDocs)
</script>

<style scoped>
.page-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
