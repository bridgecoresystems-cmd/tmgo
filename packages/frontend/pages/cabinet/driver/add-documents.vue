<template>
  <div>
    <div class="page-header mb-24">
      <n-h2 style="margin: 0;">Добавить документы</n-h2>
      <n-text depth="3">
        Добавляйте гражданства, контакты и документы. После одобрения администратором они появятся в вашей карточке.
      </n-text>
    </div>

    <n-tabs type="line" animated class="add-docs-tabs">
      <n-tab-pane name="citizenships" tab="Гражданства">
        <n-card embedded>
          <DriverCitizenshipsList ref="citizenshipsRef" />
        </n-card>
      </n-tab-pane>
      <n-tab-pane name="contacts" tab="Телефоны и Email">
        <n-card embedded>
          <DriverContactsList ref="contactsRef" />
        </n-card>
      </n-tab-pane>
      <n-tab-pane name="documents" tab="Документы">
        <n-card embedded>
          <DriverDocumentsList ref="documentsRef" />
        </n-card>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })

useSeoMeta({ title: 'Добавить документы — BridgeCore Systems' })

const citizenshipsRef = ref<{ fetch: () => void } | null>(null)
const contactsRef = ref<{ fetch: () => void } | null>(null)
const documentsRef = ref<{ fetch: (showHistory?: boolean) => void } | null>(null)

onMounted(() => {
  citizenshipsRef.value?.fetch()
  contactsRef.value?.fetch()
  documentsRef.value?.fetch()
})
</script>

<style scoped>
.mb-24 { margin-bottom: 24px; }
.page-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}
.add-docs-tabs {
  margin-top: 16px;
}
</style>
