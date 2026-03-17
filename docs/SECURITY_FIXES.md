# Security Fixes

Дата: 2026-03-17

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

- In-memory rate limiter на эндпоинт `POST /api/auth/sign-in/email` (без внешних зависимостей)
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

### TODO: elysia-rate-limit

При желании можно установить **elysia-rate-limit** на работе (если сеть не даёт `bun add` дома):

```bash
cd packages/backend && bun add elysia-rate-limit
```

Пакет даёт те же параметры (max, duration, generator по IP). Сейчас используется встроенный in-memory реализация.

---

## Итог

| # | Уязвимость | Файл | Статус |
|---|---|---|---|
| 1 | Privilege Escalation | `routes/auth.ts` | Исправлено |
| 2 | Path Traversal (аватары) | `routes/auth.ts` | Исправлено |
| 2 | Path Traversal (документы) | `index.ts` | Исправлено |
| 3 | Rate limiting на sign-in | `routes/auth.ts` | Исправлено |
| 4 | Инвалидация сессий при смене пароля | `routes/auth.ts` | Исправлено |
