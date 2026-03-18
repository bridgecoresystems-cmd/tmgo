# Security Fixes

Дата: 2026-03-18

---

## 1. Privilege Escalation — повышение привилегий при регистрации

**Файл:** `packages/backend/src/routes/auth.ts`
**Эндпоинт:** `POST /api/auth/sign-up/email`
**Severity:** Критично

### Что было

Поле `role` принималось напрямую из тела запроса без проверки:

```ts
// ДО
role: (body.role?.toLowerCase() as any) || 'client',
```

Любой мог отправить `role: "admin"` через curl и получить аккаунт администратора,
минуя форму регистрации на фронтенде.

### Что стало

```ts
// ПОСЛЕ
role: (['client', 'driver'].includes(body.role ?? '') ? body.role : 'client') as 'client' | 'driver',
```

Разрешены только роли `client` и `driver`. Всё остальное (`admin`, `dispatcher`, etc.) —
автоматически заменяется на `client`. Назначить роль `admin` или `dispatcher` может
только администратор через `/admin` эндпоинты.

---

## 2. Path Traversal — чтение произвольных файлов сервера

**Файлы:**
- `packages/backend/src/routes/auth.ts` — эндпоинт `GET /api/auth/avatars/:filename`
- `packages/backend/src/index.ts` — эндпоинт `GET /cabinet/driver/document-files/:carrierId/:filename`

**Severity:** Критично

### Что было

Параметры из URL передавались прямо в `join()` без очистки:

```ts
// ДО
const filepath = join(process.cwd(), 'storage', 'avatars', params.filename);
```

Атакующий мог запросить:
```
GET /api/auth/avatars/../../db/schema.ts
GET /cabinet/driver/document-files/../../.env
```

И сервер вернул бы любой файл на диске — исходный код, переменные окружения,
пароли от базы данных и т.д.

### Что стало

Применяется `basename()` — она отрезает все `../` и возвращает только имя файла:

```ts
// ПОСЛЕ
import { join, basename } from 'path';

// avatars
const filepath = join(process.cwd(), 'storage', 'avatars', basename(params.filename));

// driver-docs
const filepath = join(process.cwd(), 'storage', 'driver-docs', basename(params.carrierId), basename(params.filename));
```

`basename('../../.env')` → вернёт `'.env'`, путь останется внутри папки `storage`.

---

---

## 3. Rate limiting на sign-in — защита от брутфорса

**Файлы:**
- `packages/backend/src/routes/auth.ts`
- `packages/frontend/composables/useAuth.ts`
**Severity:** Серьёзно

### Что было

Можно было брутфорсить пароли без ограничений — неограниченное количество попыток входа с одного IP.

### Что стало

- **elysia-rate-limit** на эндпоинт `POST /api/auth/sign-in/email`
- **10 попыток** входа за **15 минут** на один IP
- IP определяется по `X-Forwarded-For` (за прокси) или `unknown`
- При превышении лимита: **429** с сообщением «Слишком много попыток входа. Попробуйте через 15 минут.»
- Защита действует для всех источников: браузер, curl, скрипты, мобильные приложения

### Параметры

| Параметр | Значение |
|----------|----------|
| max | 10 попыток |
| duration | 15 минут |
| Ключ | IP |

---

## 4. Инвалидация сессий при смене пароля

**Файл:** `packages/backend/src/routes/auth.ts`
**Эндпоинт:** `POST /api/auth/change-password`
**Severity:** Серьёзно

### Что было

После смены пароля все старые сессии оставались активными 30 дней. Если злоумышленник имел украденную сессию (украденный cookie, забытый вход на чужом устройстве), он мог продолжать доступ даже после смены пароля пользователем.

### Что стало

При смене пароля:
1. **Удаляются все сессии** пользователя из БД (все устройства разлогиниваются)
2. **Создаётся новая сессия** для текущего запроса
3. **Устанавливается новый cookie** — пользователь, сменивший пароль, остаётся залогинен

Таким образом: текущая сессия (тот, кто сменил пароль) остаётся валидной, все остальные — инвалидируются. Соответствует OWASP ASVS, NIST SP 800-63B.

---

---

## 5. Хардкод секретов в коде

**Файлы:**
- `packages/backend/src/db/index.ts`
- `packages/backend/src/lib/chat-attachments.ts`
**Severity:** Серьёзно

### Что было

- `DATABASE_URL` — fallback на `postgresql://tmgo_user:tmgo_pass123@...` даже в production
- `CHAT_ATTACHMENT_SECRET` — fallback на `tmgo-chat-attachment-secret-change-in-prod` даже в production

### Что стало

В **production** (`NODE_ENV=production`) переменные **обязательны** — приложение падает при старте, если не заданы:
- `DATABASE_URL`
- `CHAT_ATTACHMENT_SECRET`

В **development** fallback остаётся для удобства локальной разработки.

Добавлено в `.env.example`: `CHAT_ATTACHMENT_SECRET`.

---

---

## 6. CORS origin: true + валидация email

**Файлы:** `packages/backend/src/index.ts`, `packages/backend/src/routes/auth.ts`
**Severity:** Менее критично

### CORS

**Было:** `origin: true` — запросы с любого домена.

**Стало:** В production — только разрешённые домены из `CORS_ORIGIN` или `FRONTEND_URL` (через запятую). В development — `true` для LAN/мобильной разработки.

### Email

**Было:** `t.String()` — любая строка.

**Стало:** `t.String({ format: 'email' })` для sign-in и sign-up — проверка формата email на бэкенде.

---

---

## 7. Secure флаг на cookie

**Файлы:** `packages/backend/src/routes/auth.ts`, `packages/backend/src/routes/admin/impersonate.ts`

**Было:** impersonate cookie без Secure в production.

**Стало:** Все cookies (session, impersonate) получают `; Secure` в production — передаются только по HTTPS. В development без Secure для работы по localhost (HTTP).

---

## 8. Защита от доступа к папкам и файлам

**Файлы:** `packages/backend/src/index.ts`, `docs/SECURITY_STORAGE.md`

### Security headers

Добавлены заголовки на все ответы:
- `X-Content-Type-Options: nosniff` — запрет MIME-sniffing
- `X-Frame-Options: DENY` — защита от clickjacking
- `X-XSS-Protection: 1; mode=block` — базовая защита XSS

### Защита storage

- Папка `storage/` не раздаётся статически — доступ только через API
- Path traversal закрыт через `basename()`
- Рекомендации по правам, nginx, firewall — в `docs/SECURITY_STORAGE.md`

---

### elysia-rate-limit

Используется **elysia-rate-limit** — те же параметры (10 попыток / 15 мин, generator по IP, skip для не-sign-in).

---

## Итог

| # | Уязвимость | Файл | Статус |
|---|---|---|---|
| 1 | Privilege Escalation | `routes/auth.ts` | Исправлено |
| 2 | Path Traversal (аватары) | `routes/auth.ts` | Исправлено |
| 2 | Path Traversal (документы) | `index.ts` | Исправлено |
| 3 | Rate limiting на sign-in | `routes/auth.ts` | Исправлено |
| 4 | Инвалидация сессий при смене пароля | `routes/auth.ts` | Исправлено |
| 5 | Хардкод секретов | `db/index.ts`, `lib/chat-attachments.ts` | Исправлено |
| 6 | CORS + валидация email | `index.ts`, `routes/auth.ts` | Исправлено |
| 7 | Secure флаг на cookie | `routes/auth.ts`, `routes/admin/impersonate.ts` | Исправлено |
| 8 | Security headers + защита storage | `index.ts`, `docs/SECURITY_STORAGE.md` | Исправлено |
