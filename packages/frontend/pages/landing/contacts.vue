<template>
  <div class="contacts-page">
    <section class="section">
      <div class="container">
        <n-h1 class="section-title">{{ t('layout.contacts') }}</n-h1>
        <div class="contacts-layout">
          <!-- Form — left -->
          <n-card :title="t('contactsPage.writeToUs')" bordered>
            <n-form>
              <n-form-item :label="t('contactsPage.nameLabel')">
                <n-input v-model:value="form.name" :placeholder="t('contactsPage.namePlaceholder')" />
              </n-form-item>
              <n-form-item :label="t('contactsPage.emailLabel')">
                <n-input v-model:value="form.email" :placeholder="t('contactsPage.emailPlaceholder')" />
              </n-form-item>
              <n-form-item :label="t('contactsPage.messageLabel')">
                <n-input v-model:value="form.message" type="textarea" :placeholder="t('contactsPage.messagePlaceholder')" :rows="5" />
              </n-form-item>
              <n-button type="primary" block :loading="loading" @click="handleSubmit">{{ t('contactsPage.submit') }}</n-button>
            </n-form>
          </n-card>

          <!-- Contacts — right -->
          <n-card :title="t('contactsPage.ourContacts')" bordered>
            <div class="contact-list">
              <div class="contact-item">
                <span class="contact-icon">📍</span>
                <div>
                  <n-text strong class="contact-label">{{ t('contactsPage.address') }}</n-text>
                  <n-p class="contact-value">{{ t('contactsPage.addressValue') }}</n-p>
                </div>
              </div>
              <div class="contact-item">
                <span class="contact-icon">📞</span>
                <div>
                  <n-text strong class="contact-label">{{ t('contactsPage.phone') }}</n-text>
                  <n-p class="contact-value">{{ t('contactsPage.phoneValue') }}</n-p>
                </div>
              </div>
              <div class="contact-item">
                <span class="contact-icon">✉️</span>
                <div>
                  <n-text strong class="contact-label">{{ t('contactsPage.email') }}</n-text>
                  <n-p class="contact-value">{{ t('contactsPage.emailValue') }}</n-p>
                </div>
              </div>
            </div>
          </n-card>
        </div>
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
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

.contacts-layout {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 32px;
  align-items: start;
}
.section {
  padding: 80px 0;
}
.section-title {
  text-align: center;
  margin-bottom: 48px;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.contact-icon {
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.contact-label {
  font-size: 13px;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  display: block;
  margin-bottom: 2px;
}

.contact-value {
  font-size: 15px;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .section { padding: 40px 0; }
  .container { padding: 0 16px; }
  .section-title { font-size: 22px; margin-bottom: 28px; }
  .contacts-layout { grid-template-columns: 1fr; gap: 20px; }
}

@media (max-width: 480px) {
  .section { padding: 28px 0; }
  .contact-icon { font-size: 20px; }
}
</style>
