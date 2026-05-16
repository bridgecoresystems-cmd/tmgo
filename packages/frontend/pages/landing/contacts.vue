<template>
  <div class="contacts-page">
    <section class="section">
      <div class="container">
        <n-h1 class="section-title">{{ t('layout.contacts') }}</n-h1>
        <n-grid :cols="{ xs: 1, md: 2 }" :x-gap="48" :y-gap="24" responsive="screen">
          <n-gi>
            <n-card :title="t('contactsPage.ourContacts')" bordered>
              <n-space vertical size="large">
                <div class="contact-item">
                  <n-text strong>{{ t('contactsPage.address') }}</n-text>
                  <n-p>{{ t('contactsPage.addressValue') }}</n-p>
                </div>
                <div class="contact-item">
                  <n-text strong>{{ t('contactsPage.phone') }}</n-text>
                  <n-p>{{ t('contactsPage.phoneValue') }}</n-p>
                </div>
                <div class="contact-item">
                  <n-text strong>{{ t('contactsPage.email') }}</n-text>
                  <n-p>{{ t('contactsPage.emailValue') }}</n-p>
                </div>
              </n-space>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card :title="t('contactsPage.writeToUs')" bordered>
              <n-form>
                <n-form-item :label="t('contactsPage.nameLabel')">
                  <n-input v-model:value="form.name" :placeholder="t('contactsPage.namePlaceholder')" />
                </n-form-item>
                <n-form-item :label="t('contactsPage.emailLabel')">
                  <n-input v-model:value="form.email" :placeholder="t('contactsPage.emailPlaceholder')" />
                </n-form-item>
                <n-form-item :label="t('contactsPage.messageLabel')">
                  <n-input v-model:value="form.message" type="textarea" :placeholder="t('contactsPage.messagePlaceholder')" />
                </n-form-item>
                <n-button type="primary" block :loading="loading" @click="handleSubmit">{{ t('contactsPage.submit') }}</n-button>
              </n-form>
            </n-card>
          </n-gi>
        </n-grid>
      </div>
    </section>
    <footer class="page-footer">{{ $t('layout.footer') }}</footer>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui';

const { t } = useI18n()
const { apiBase: API } = useApiBase()
const message = useMessage()

const form = ref({
  name: '',
  email: '',
  message: ''
})

const loading = ref(false)

async function handleSubmit() {
  if (!form.value.name || !form.value.email || !form.value.message) {
    message.warning(t('common.error')) // Or add a specific key
    return
  }

  loading.value = true
  try {
    await $fetch(`${API}/public/contacts`, {
      method: 'POST',
      body: form.value
    })
    message.success(t('common.success'))
    form.value = { name: '', email: '', message: '' }
  } catch (e) {
    console.error(e)
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.contacts-page {
  background: #fff;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);
}
.page-footer {
  margin-top: auto;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  font-size: 14px;
  color: #666;
  border-top: 1px solid #e8e8e8;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
.section {
  padding: 80px 0;
}
.section-title {
  text-align: center;
  margin-bottom: 48px;
}

@media (max-width: 768px) {
  .section { padding: 40px 0; }
  .container { padding: 0 16px; }
  .section-title { font-size: 22px; margin-bottom: 28px; }
}
</style>
