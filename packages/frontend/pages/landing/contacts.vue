<template>
  <div class="contacts-page">
    <section class="section">
      <div class="container">
        <n-h1 class="section-title">{{ t('layout.contacts') }}</n-h1>
        <n-grid :cols="2" :x-gap="48" responsive="screen">
          <n-gi>
            <n-card title="Наши контакты" bordered>
              <n-space vertical size="large">
                <div class="contact-item">
                  <n-text strong>Адрес:</n-text>
                  <n-p>Туркменистан, г. Ашхабад, ул. Махтумкули, 10</n-p>
                </div>
                <div class="contact-item">
                  <n-text strong>Телефон:</n-text>
                  <n-p>+993 (12) 12-34-56</n-p>
                </div>
                <div class="contact-item">
                  <n-text strong>Email:</n-text>
                  <n-p>support@tmgo.com</n-p>
                </div>
              </n-space>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card title="Напишите нам" bordered>
              <n-form>
                <n-form-item label="Ваше имя">
                  <n-input placeholder="Иван Иванов" />
                </n-form-item>
                <n-form-item label="Ваш Email">
                  <n-input placeholder="example@mail.com" />
                </n-form-item>
                <n-form-item label="Сообщение">
                  <n-input type="textarea" placeholder="Введите ваше сообщение..." />
                </n-form-item>
                <n-button type="primary" block>Отправить</n-button>
              </n-form>
            </n-card>
          </n-gi>
        </n-grid>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>

<style scoped>
.contacts-page {
  background: #fff;
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
</style>
