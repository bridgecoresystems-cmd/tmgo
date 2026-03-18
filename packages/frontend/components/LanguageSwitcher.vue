<template>
  <n-select
    :value="locale"
    :options="localeOptions"
    size="small"
    :consistent-menu-width="false"
    style="width: 130px"
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
