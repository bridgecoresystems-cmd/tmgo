ТЗ для Claude Code
Задача
Создать единую систему кастомных error-страниц в стиле существующей rate-limited.vue. Все страницы используют одинаковый компонент-обёртку ErrorPageLayout.

1. Общий компонент components/ErrorPageLayout.vue
vue<script setup>
defineProps({
  code: Number,       // 404, 403, 500...
  icon: String,       // SVG path d="..."  (только path, без обёртки)
  iconViewBox: { type: String, default: '0 0 24 24' },
  titleKey: String,   // i18n ключ
  messageKey: String, // i18n ключ
  hintKey: { type: String, default: null },
  btnLabelKey: String,
  btnTo: { type: String, default: '/' },
  showTimer: { type: Boolean, default: false },
  timerSeconds: { type: Number, default: 900 },
})
</script>
Счётчик (только когда showTimer: true):

useIntervalFn из @vueuse/core (уже есть в проекте) или нативный setInterval в onMounted
Формат MM:SS
Прогресс-бар (убывает от 100% до 0%)
Кнопка задизейблена пока таймер идёт
Когда таймер = 0: кнопка активируется, hint меняется на errors.timerDone

Анимация карточки: cardIn — такая же как в rate-limited (уже есть).
Цвета по коду — через вычисляемое свойство:
jsconst accent = computed(() => ({
  404: '#6366f1',  // indigo
  403: '#f59e0b',  // amber
  401: '#3b82f6',  // blue
  500: '#ef4444',  // red
  502: '#ef4444',
  503: '#f59e0b',
  429: '#ff6b4a',  // оригинальный coral (уже есть)
}[props.code] ?? '#6366f1'))
Цвет применяется через CSS custom property --accent на .error-card — все .error-code, .error-icon, .error-btn, .timer-value, .progress-fill используют var(--accent).

2. Файлы страниц
Создать следующие файлы (каждый — ~15 строк, просто передаёт пропсы в ErrorPageLayout):
pages/404.vue — или error.vue в корне если нет отдельных страниц
vue<template>
  <ErrorPageLayout
    :code="404"
    icon="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    title-key="errors.404.title"
    message-key="errors.404.message"
    btn-label-key="errors.goHome"
    btn-to="/"
  />
</template>
<script setup>
definePageMeta({ layout: 'default' })
</script>
```

**`pages/403.vue`**
```
icon: замок — "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
btnTo: "/"
```

**`pages/401.vue`**
```
icon: человек с крестом — "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
btnTo: "/auth"  (страница входа)
```

**`pages/500.vue`**
```
icon: молния — "M13 10V3L4 14h7v7l9-11h-7z"
btnTo: "/"
```

**`pages/503.vue`**
```
icon: инструменты/гаечный ключ — "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
Обновить pages/rate-limited.vue — рефакторинг: заменить весь код на использование ErrorPageLayout с showTimer и timerSeconds. Убрать дублирующий CSS.

3. error.vue в корне проекта (глобальный хендлер Nuxt)
vue<script setup>
const props = defineProps({ error: Object })
const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout name="default">
    <component
      :is="errorComponent"
      v-bind="errorProps"
    />
  </NuxtLayout>
</template>
Маппинг error.statusCode → нужная страница-компонент.

4. i18n ключи
Добавить во все 3 локали (ru.json, en.json, tk.json):
json"errors": {
  "goHome": "На главную",
  "goAuth": "Войти",
  "timerDone": "Теперь можно попробовать снова",

  "404": {
    "title": "Страница не найдена",
    "message": "Такой страницы не существует или она была удалена.",
    "hint": "Проверьте адрес или вернитесь на главную"
  },
  "403": {
    "title": "Доступ запрещён",
    "message": "У вас нет прав для просмотра этой страницы.",
    "hint": "Если вы считаете это ошибкой — обратитесь в поддержку"
  },
  "401": {
    "title": "Необходима авторизация",
    "message": "Войдите в аккаунт чтобы продолжить.",
    "hint": null
  },
  "500": {
    "title": "Ошибка сервера",
    "message": "Что-то пошло не так на нашей стороне. Мы уже разбираемся.",
    "hint": "Попробуйте обновить страницу через несколько минут"
  },
  "503": {
    "title": "Сервис на обслуживании",
    "message": "Проводятся технические работы. Скоро всё заработает.",
    "hint": "Обычно это занимает не больше 15 минут"
  }
}
EN и TK — переведи соответственно.

Главное правило
Никакого дублирования CSS. Весь стиль — в ErrorPageLayout.vue. Страницы 404/403/500 и т.д. — просто декларативные вызовы компонента с пропсами.