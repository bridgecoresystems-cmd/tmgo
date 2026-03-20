# ТЗ: Система управления юридическими документами (Legal Docs CMS)

## Контекст проекта

**Стек:**
- Backend: Bun + Elysia.js, Drizzle ORM, PostgreSQL, Better Auth
- Frontend: Nuxt 3 (SSR off), Naive UI, @nuxtjs/i18n, Pinia
- Монорепо: `packages/backend` и `packages/frontend`
- Локали: `ru`, `en`, `tk`
- Роли пользователей: `client | driver | dispatcher | admin`
- Существующая структура роутов:
  - `src/routes/admin/` — только для роли `admin`
  - `pages/admin/` — фронт для админ-панели
  - Локали: `packages/frontend/locales/{ru,en,tk}.json`

---

## Цель

Реализовать управление юридическими документами (Пользовательское соглашение, Политика конфиденциальности и др.) через существующую админ-панель. Администратор редактирует тексты документов на 3 языках прямо в интерфейсе — без деплоя. На публичной странице документ показывается на языке текущей локали пользователя.

---

## 1. База данных

### 1.1 Новая таблица `legal_documents`

Добавить в `packages/backend/src/db/schema.ts`:

```typescript
export const legalDocTypeEnum = pgEnum('legal_doc_type', [
  'agreement',       // Пользовательское соглашение
  'privacy',         // Политика конфиденциальности
  'rules',           // Правила платформы (на будущее)
])

export const legalDocLocaleEnum = pgEnum('legal_doc_locale', [
  'ru',
  'en',
  'tk',
])

export const legalDocuments = pgTable('legal_documents', {
  id:            uuid('id').primaryKey().defaultRandom(),
  docType:       legalDocTypeEnum('doc_type').notNull(),
  locale:        legalDocLocaleEnum('locale').notNull(),
  version:       varchar('version', { length: 20 }).notNull().default('1.0'),
  title:         text('title').notNull(),
  content:       text('content').notNull(),          // Markdown
  isPublished:   boolean('is_published').default(false).notNull(),
  publishedAt:   timestamp('published_at'),
  effectiveDate: timestamp('effective_date'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
  updatedBy:     text('updated_by').references(() => users.id),
})
```

**Уникальный индекс:** один активный документ на тип + локаль.

После добавления схемы выполнить:
```bash
bun run db:generate
bun run db:migrate
```

---

## 2. Backend

### 2.1 Новый файл роутов: `packages/backend/src/routes/admin/legal-docs.ts`

Реализовать следующие эндпоинты (все требуют роль `admin`):

```
GET    /admin/legal-docs
  → Возвращает все документы (все типы, все локали)
  → Ответ: LegalDocument[]

GET    /admin/legal-docs/:docType/:locale
  → Один документ по типу и локали
  → Ответ: LegalDocument | null

PUT    /admin/legal-docs/:docType/:locale
  → Создать или обновить (upsert) документ
  → Body: { title, content, version?, effectiveDate? }
  → Автоматически писать updatedAt = now(), updatedBy = currentUser.id
  → Ответ: LegalDocument

POST   /admin/legal-docs/:docType/:locale/publish
  → Установить isPublished = true, publishedAt = now()
  → Ответ: { success: true }

POST   /admin/legal-docs/:docType/:locale/unpublish
  → Установить isPublished = false
  → Ответ: { success: true }
```

**Публичный эндпоинт** (без авторизации) — добавить в `src/index.ts`:

```
GET    /legal/:docType/:locale
  → Возвращает только isPublished = true документ
  → Если нет — 404
  → Ответ: { title, content, version, effectiveDate, publishedAt }
```

### 2.2 Подключить роут в `packages/backend/src/index.ts`

```typescript
import { adminLegalDocsRoutes } from './routes/admin/legal-docs'
// ...
.use(adminLegalDocsRoutes)
```

### 2.3 Seed начальных данных (опционально)

Создать `packages/backend/src/db/seeds/legal-docs-seed.ts` — вставить по одному черновику документа типа `agreement` на каждую локаль (ru/en/tk) с `isPublished = false`. Текст можно использовать из файла `AltynBurgut_Agreement_RU.docx` (уже написан на RU) — для EN и TK вставить заглушку `[Translation pending]`.

---

## 3. Frontend — Админ-панель

### 3.1 Новые страницы

```
pages/admin/legal/
  index.vue          ← список всех документов (таблица)
  [docType]/
    [locale].vue     ← редактор конкретного документа
```

### 3.2 `pages/admin/legal/index.vue` — Список документов

**Компонент:** таблица Naive UI (`NDataTable`).

**Колонки:**
| Тип документа | Локаль | Версия | Статус | Последнее изменение | Действия |
|---|---|---|---|---|---|

- **Тип документа:** читаемое название (Пользовательское соглашение / Terms of Service / Ulanyjy ylalaşygy) — из i18n ключей
- **Локаль:** флаг + код (`🇷🇺 RU`, `🇬🇧 EN`, `🇹🇲 TK`)
- **Статус:** `NTag` — `Опубликован` (success) / `Черновик` (warning)
- **Действия:** кнопка «Редактировать» → переход на `[docType]/[locale]`

**Группировка:** строки сгруппированы по `docType` (сначала все 3 локали `agreement`, потом 3 локали `privacy` и т.д.)

### 3.3 `pages/admin/legal/[docType]/[locale].vue` — Редактор

**Лейаут:** использовать существующий `admin` layout.

**Структура страницы:**

```
┌─────────────────────────────────────────────────────┐
│  ← Назад к списку                                   │
│  Пользовательское соглашение — RU                   │
│  Версия: [input]   Дата вступления: [datepicker]    │
├─────────────────────────────────────────────────────┤
│  Заголовок документа                                │
│  [NInput — title]                                   │
├─────────────────────────────────────────────────────┤
│  Содержимое (Markdown)                              │
│  [NInput type=textarea, autosize, моноширинный]     │
│                                                     │
│  [Предпросмотр — рендер markdown в правой колонке   │
│   или кнопка "Показать предпросмотр"]               │
├─────────────────────────────────────────────────────┤
│  [Сохранить черновик]  [Опубликовать]  [Снять с     │
│                                        публикации]  │
│  Последнее изменение: ... пользователем ...         │
└─────────────────────────────────────────────────────┘
```

**Поведение:**
- При заходе — загружает данные через `GET /admin/legal-docs/:docType/:locale`
- Если документа нет — форма пустая, кнопка «Опубликовать» задизейблена до сохранения
- «Сохранить черновик» → `PUT /admin/legal-docs/:docType/:locale`, `isPublished` не меняется
- «Опубликовать» → сначала `PUT` (сохраняет), потом `POST .../publish`
- «Снять с публикации» → `POST .../unpublish`
- После каждого действия — `NMessage` с результатом (success/error)

**Markdown preview:** использовать `markdown-it` или встроенный `v-html` с `marked`. Установить нужный пакет:
```bash
cd packages/frontend && bun add marked
```

### 3.4 Добавить пункт в меню админ-панели

В `packages/frontend/locales/ru.json`, `en.json`, `tk.json` добавить ключи:

```json
// ru.json
"layout": {
  "admin": {
    "legalDocs": "Юр. документы"
  }
}

// en.json
"layout": {
  "admin": {
    "legalDocs": "Legal Docs"
  }
}

// tk.json
"layout": {
  "admin": {
    "legalDocs": "Hukuk resminamalary"
  }
}
```

В layout `layouts/admin.vue` — добавить пункт меню со ссылкой на `/admin/legal`.

---

## 4. Frontend — Публичные страницы

### 4.1 Новая страница: `pages/legal/[docType].vue`

**URL:** `/legal/agreement`, `/legal/privacy`

**Поведение:**
- Читает текущую локаль через `useI18n().locale`
- Запрашивает `GET /legal/:docType/:locale`
- Рендерит `title` как `<h1>` и `content` как Markdown
- Если 404 — показывает `NResult` с сообщением «Документ временно недоступен»

**SEO:**
```typescript
useSeoMeta({
  title: doc.value?.title,
  description: `${doc.value?.title} — AltynBurgut`,
})
```

### 4.2 Ссылки на документы при регистрации

В компоненте регистрации (найди форму регистрации в `pages/auth.vue` или аналоге) — обновить ссылки на соглашение:

```vue
<NuxtLink :to="localePath('/legal/agreement')" target="_blank">
  {{ $t('auth.agreement') }}
</NuxtLink>
```

Добавить i18n ключ `auth.agreement`:
- `ru`: "Пользовательское соглашение"
- `en`: "Terms of Service"
- `tk`: "Ulanyjy ylalaşygy"

---

## 5. i18n ключи для новых страниц

Добавить в `locales/ru.json`, `en.json`, `tk.json`:

```json
// ru.json
"legalDocs": {
  "pageTitle": "Юридические документы",
  "docTypes": {
    "agreement": "Пользовательское соглашение",
    "privacy": "Политика конфиденциальности",
    "rules": "Правила платформы"
  },
  "locales": {
    "ru": "Русский",
    "en": "English",
    "tk": "Türkmen"
  },
  "status": {
    "published": "Опубликован",
    "draft": "Черновик"
  },
  "editor": {
    "fieldTitle": "Заголовок",
    "fieldContent": "Содержимое (Markdown)",
    "fieldVersion": "Версия",
    "fieldEffectiveDate": "Дата вступления в силу",
    "saveDraft": "Сохранить черновик",
    "publish": "Опубликовать",
    "unpublish": "Снять с публикации",
    "preview": "Предпросмотр",
    "lastUpdated": "Последнее изменение",
    "savedSuccess": "Сохранено",
    "publishedSuccess": "Опубликовано",
    "unpublishedSuccess": "Снято с публикации",
    "saveError": "Ошибка сохранения",
    "notFound": "Документ не найден. Создайте новый."
  },
  "public": {
    "notAvailable": "Документ временно недоступен",
    "notAvailableDesc": "Пожалуйста, попробуйте позже или свяжитесь с поддержкой."
  }
}
```

Аналогично для `en.json` и `tk.json` (перевести соответствующие значения).

---

## 6. Checklist для Claude Code

- [ ] Добавить enum'ы и таблицу `legal_documents` в `schema.ts`
- [ ] Запустить `bun run db:generate && bun run db:migrate`
- [ ] Создать `packages/backend/src/routes/admin/legal-docs.ts`
- [ ] Добавить публичный роут `/legal/:docType/:locale` в `src/index.ts`
- [ ] Подключить `adminLegalDocsRoutes` в `src/index.ts`
- [ ] Создать `pages/admin/legal/index.vue`
- [ ] Создать `pages/admin/legal/[docType]/[locale].vue`
- [ ] Добавить `marked` в зависимости frontend: `bun add marked`
- [ ] Добавить пункт меню в `layouts/admin.vue`
- [ ] Создать `pages/legal/[docType].vue`
- [ ] Обновить ссылку на соглашение в форме регистрации
- [ ] Добавить i18n ключи во все 3 локали (ru/en/tk)
- [ ] Проверить: публичная страница `/legal/agreement` при смене языка — подтягивает нужную локаль

---

## 7. Важные правила (архитектура проекта)

- Пакетный менеджер: **Bun** (не npm)
- ORM: **Drizzle** — всегда использовать `db.select()`, `db.insert()`, `db.update()` через схему
- Авторизация: `getUserFromRequest(request)` из `src/lib/auth.ts`, проверять `user.role === 'admin'`
- Frontend стейт: **Pinia** для глобального, `useState` / `useAsyncData` для локального
- UI компоненты: **Naive UI** (`NDataTable`, `NInput`, `NButton`, `NTag`, `NDatePicker`, `NMessage`, `NResult`)
- Локализация: `useI18n()`, `$t()`, `localePath()`
- Все тексты в компонентах — только через i18n ключи, не хардкодить строки
