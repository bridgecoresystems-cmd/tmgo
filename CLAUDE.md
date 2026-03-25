# TMGO — Claude Code Rules

## Стек

- **Monorepo:** Bun workspaces
- **Backend:** `packages/backend` — Bun + Elysia + Drizzle ORM + PostgreSQL + BullMQ (Redis)
- **Frontend:** `packages/frontend` — Nuxt 3 (SSR отключён) + Vue 3 + Naive UI + Pinia + i18n
- **Shared:** `packages/shared` — общие TypeScript типы и Zod схемы
- **Менеджер пакетов:** только `bun` (не npm/yarn/pnpm)

## Запуск

```bash
bun run dev          # backend + frontend вместе
bun run dev:backend  # только backend (порт 8000)
bun run dev:frontend # только frontend (порт 3000)
```

## ⚠️ КРИТИЧЕСКОЕ ПРАВИЛО — МИГРАЦИИ БД

**НИКОГДА не редактировать существующие `.sql` файлы в `packages/backend/drizzle/`.**

При изменении схемы БД — только так:
1. Изменить `packages/backend/src/db/schema.ts`
2. `bun run db:generate` → создаётся новый `.sql` файл
3. `bun run db:migrate` → применить локально
4. Закоммитить новый файл миграции

Редактирование существующих миграций ломает production — Drizzle не применит их повторно.

## Деплой

- **CI/CD:** push в `master` → GitHub Actions → SSH на VPS → `./scripts/deploy.sh`
- Deploy автоматически запускает миграции, собирает backend и frontend, перезапускает systemd сервисы
- `.env` файлы **никогда не коммитятся** — хранятся только на VPS и локально

## i18n

- Языки: `ru` (дефолт), `en`, `tk`
- Файлы: `packages/frontend/locales/ru.json`, `en.json`, `tk.json`
- **Весь UI текст** через `$t('ключ')` — никакого хардкода в шаблонах

## Соглашения

- Изменения карточки водителя — только через `change_request`, не напрямую
- Фоновые задачи — только через BullMQ, не через `setTimeout`
- Общие типы — импортировать из `packages/shared`, не дублировать
- `credentials: 'include'` обязательно для всех API запросов
