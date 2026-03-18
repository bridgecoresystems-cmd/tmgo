# ТЗ: Завершение миграции на i18n

## Текущий статус

### ✅ УЖЕ СДЕЛАНО (не трогать)
- `locales/ru.json` — полностью заполнен (все кабинетные секции: common, driver, client, citizenships, visaCountries, adrClasses)
- `locales/en.json` — полностью заполнен
- `packages/shared/citizenships.ts` — уже использует snake_case ключи (`'russian'`, `'kazakhstani'`, ...)
- `packages/shared/visa-countries.ts` — уже использует ключи
- `packages/shared/adr-classes.ts` — можно оставить как есть (value + label на русском, используется через `t('adrClasses.' + value)` в компонентах)
- Все страницы `pages/cabinet/**` — уже используют `useI18n` / `const { t }`

---

## ❌ ЧТО НУЖНО СДЕЛАТЬ

### Компоненты без i18n (11 файлов)

Для каждого компонента: добавить `const { t } = useI18n()` и заменить все хардкод-строки на `t('ключ')`.

---

### 1. `components/ScrollToTopButton.vue`
**Задача:** одна строка — `aria-label="Наверх"` → `:aria-label="t('common.scrollToTop')"`

Добавить в `ru.json` и `en.json`:
```json
// ru.json → "common"
"scrollToTop": "Наверх"

// en.json → "common"
"scrollToTop": "Scroll to top"
```

---

### 2. `components/VerificationBadge.vue`
**Задача:** заменить `tooltip` строки в computed.

```ts
// Текущий код (пример):
return { line1: 'VERF', line2: '', tooltip: 'Верифицирован' }

// Должно стать:
return { line1: 'VERF', line2: '', tooltip: t('verificationBadge.verified') }
```

Добавить в оба locale файла:
```json
// ru.json (новая секция верхнего уровня)
"verificationBadge": {
  "verified": "Верифицирован",
  "waitingVerification": "Ожидает проверки",
  "changeRequest": "Запрос на изменение",
  "rejected": "Отклонён",
  "suspended": "Приостановлен",
  "draft": "Черновик",
  "notVerified": "Не верифицирован"
}

// en.json
"verificationBadge": {
  "verified": "Verified",
  "waitingVerification": "Awaiting verification",
  "changeRequest": "Change request",
  "rejected": "Rejected",
  "suspended": "Suspended",
  "draft": "Draft",
  "notVerified": "Not verified"
}
```

---

### 3. `components/admin/users/UserDriverTabs.vue`
Маленький компонент (~3 строки с русским). Перевести все видимые строки через `t()`.
Ключи добавлять в секцию `"admin"` в locale файлах.

---

### 4. `components/admin/users/UserNonDriverCard.vue`
Маленький (~4 строки с русским). Перевести через `t()`.

---

### 5. `components/admin/users/ChangeRequestsTab.vue`
~9 строк с русским. Перевести через `t()`.

---

### 6. `components/admin/users/UserDetailHeader.vue`
~19 строк с русским. Перевести через `t()`.

---

### 7. `components/admin/users/UserActionModals.vue`
~21 строка с русским. Перевести через `t()`.

---

### 8. `components/driver/DriverCardView.vue` — **КРУПНЫЙ**
~123 строки с русским. Это компонент просмотра карточки водителя.

Большинство ключей уже есть в `ru.json` → `"driver"."card"`. Использовать их.
Пример:
```vue
<!-- Было -->
<span>Основная информация</span>

<!-- Стало -->
<span>{{ t('driver.card.section1') }}</span>
```

---

### 9. `components/driver/DriverCardV2.vue` — **КРУПНЫЙ**
~170 строк с русским. Новая форма карточки водителя V2.
Ключи брать из `"driver"."card"` в locale файлах.

---

### 10. `components/driver/DriverCardForm.vue` — **САМЫЙ КРУПНЫЙ**
~243 строки с русским. Основная форма карточки водителя.
Ключи брать из `"driver"."card"` и `"driver"."documents"` в locale файлах.

---

### 11. `components/admin/users/AdminDriverCardForm.vue` — **КРУПНЫЙ**
~187 строк с русским. Форма карточки водителя для админа.
Ключи брать из `"driver"."card"` (те же поля что и у водителя).
Если нужны специфичные для admin строки — добавлять в `"admin"` секцию.

---

## Правила реализации

### Как добавлять useI18n в компонент
```vue
<script setup lang="ts">
// Добавить строку:
const { t } = useI18n()
// ... остальной код компонента без изменений
</script>
```

### Как заменять строки в template
```vue
<!-- Текст -->
{{ t('driver.card.section1') }}

<!-- Атрибут placeholder -->
:placeholder="t('driver.card.passportSeriesNumber')"

<!-- Атрибут label -->
:label="t('driver.card.gender')"

<!-- Атрибут title / tooltip -->
:title="t('verificationBadge.verified')"

<!-- aria-label -->
:aria-label="t('common.scrollToTop')"
```

### Как заменять строки в script (message.success и т.д.)
```ts
// Было:
message.success('Фото обновлено')
message.error('Ошибка загрузки')

// Стало:
message.success(t('driver.profile.photoUpdated'))
message.error(t('driver.profile.uploadError'))
```

### Если ключ уже есть в locale файлах — использовать его
Перед добавлением нового ключа — проверить, нет ли его уже в `ru.json`. Файл содержит ~914 строк с исчерпывающим набором ключей для driver, client, common и т.д.

### Если нужного ключа нет — добавить в оба файла
Добавлять синхронно в `ru.json` И `en.json`. `tk.json` — не трогать (заполнит владелец).

### Не трогать
- `locales/tk.json` — оставить как есть
- Все файлы в `pages/cabinet/**` — уже мигрированы
- `packages/shared/citizenships.ts`, `visa-countries.ts` — уже используют ключи
- Лендинг-ключи в locale файлах (hero, form, advantages, steps, services...)

---

## Порядок выполнения (рекомендация)

1. `ScrollToTopButton.vue` — быстро, 1 строка
2. `VerificationBadge.vue` — добавить новую секцию в locale
3. Мелкие admin компоненты (UserDriverTabs, UserNonDriverCard, ChangeRequestsTab, UserDetailHeader, UserActionModals)
4. `DriverCardView.vue`
5. `DriverCardV2.vue`
6. `DriverCardForm.vue`
7. `AdminDriverCardForm.vue`

---

## Проверка после завершения

```bash
# Должно вернуть 0 файлов (все компоненты используют i18n):
grep -rL "useI18n\|const { t }" packages/frontend/components/ 2>/dev/null

# Не должно быть кириллицы в шаблонах (кроме комментариев):
grep -rn "[а-яёА-ЯЁ]" packages/frontend/components/ --include="*.vue" | grep -v "^\s*//"
```



Что ещё осталось
1. Страницы admin/users (высокий приоритет)
pages/admin/users/index.vue — «Пользователи», «Добавить пользователя», «Удалённые», плейсхолдеры, опции ролей/верификации, валидация, сообщения
pages/admin/users/[id].vue — «← К списку пользователей», «Повторить»
2. Компоненты (средний приоритет)
DriverCardV2.vue — плейсхолдеры, опции (статус, занятость, источник найма), сообщения message.success/error
DocumentsList.vue — плейсхолдеры («Название учебного центра», «Организация, выдавшая допуск», «г. Ашхабад» и т.п.)
TruckOrderForm.vue — города (Ашхабад, Мары, Туркменабат, Дашогуз, Балканабат, Туркменбаши)
VerificationBadge.vue — сокращения ЗАПР, ОТКЛ, ПРИОСТ, ЧЕРН
DriverCardView.vue — fallback Класс ${v} для ADR-классов
ChatWidget.vue — текст [Фото] в сообщениях
3. Composables (средний приоритет)
useAdminChangeRequests.ts — маппинг типов запросов, статусы, сообщения
useAdminUser.ts — сообщение об ошибке загрузки
useDriverAlerts.ts — названия документов («Паспорт (1)», «Водительское удостоверение», «Медосмотр» и т.д.)
useAuth.ts — сообщение при rate limit
4. Мелкие правки (низкий приоритет)
LanguageSwitcher.vue — label: 'Русский' в options (можно оставить в коде)
pages/auth.vue — проверка msg.includes('попыток') для rate limit ✅ (заменено на проверку status 429)
admin.vue — HTML-комментарий «Боковая панель» ✅ (заменено на "Sidebar")
5. Комментарии (необязательно) ✅
HTML-комментарии в DriverCardForm, DriverCardView, DriverCardV2, ChatWidget, auth.vue — заменены на английские
JSDoc и CSS-комментарии — заменены на английские (в т.ч. VerificationBadge, main.css, index.vue)
Приоритет по объёму
admin/users — страницы управления пользователями
DriverCardV2.vue
admin composables — useAdminChangeRequests, useAdminUser
DocumentsList.vue, TruckOrderForm.vue
useDriverAlerts.ts
VerificationBadge, DriverCardView, ChatWidget — мелкие правки