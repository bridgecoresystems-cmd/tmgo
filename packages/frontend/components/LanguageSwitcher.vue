<template>
  <n-select
    :value="locale"
    :options="localeOptions"
    size="small"
    :consistent-menu-width="false"
    class="lang-select"
    @update:value="(v) => setLocale(v)"
  />
</template>

<script setup lang="ts">
const { locale, setLocale } = useI18n()

const localeOptions = [
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
  { label: 'Türkmençe', value: 'tk' },
]
</script>

<style scoped>
.lang-select { width: 130px; }

@media (max-width: 900px) {
  .lang-select { width: 90px; }
}
</style>
