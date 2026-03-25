# ТЗ: Модель заказчика, Email верификация, Заказы
**Проект:** AltynBurgut  
**Стек:** Elysia.js + Bun, Drizzle ORM, PostgreSQL, Nuxt 3, Better Auth  
**Дата:** март 2026

---

## 0. Контекст и соглашения

- Монорепо: `packages/backend` (Elysia) и `packages/frontend` (Nuxt 3)
- ORM: Drizzle с PostgreSQL. Все миграции через `drizzle-kit`
- Auth: Better Auth, сессии в cookie `better-auth.session_token`
- Файлы: локальное хранилище `packages/backend/storage/` (R2 позже)
- API клиент на фронте: Eden Treaty (end-to-end типы)
- Существующие таблицы: `users`, `sessions`, `accounts`, `verification_tokens` (частично)
- Существующие роли: `client`, `driver`, `dispatcher`, `admin`

---

## 1. Drizzle схема — новые таблицы

### 1.1 Дополнения к таблице `users`

```typescript
// Добавить поля в существующую таблицу users
phone: varchar('phone', { length: 20 }),
phoneVerified: boolean('phone_verified').default(false),
```

### 1.2 Таблица `verification_tokens`

Если уже существует — проверить и дополнить полем `type`.

```typescript
export const verificationTokens = pgTable('verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: uuid('token').notNull().unique().defaultRandom(),
  type: varchar('type', { length: 20 }).notNull().default('email'),
  // type: 'email' | 'password_reset' — расширяемо
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
})
```

### 1.3 Таблица `client_profiles`

Один user может иметь несколько профилей (например, физлицо + директор компании, или заказчик + перевозчик в будущем).

```typescript
export const clientProfiles = pgTable('client_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  clientType: varchar('client_type', { length: 20 }).notNull(),
  // Значения: 'individual' | 'company'

  countryCode: varchar('country_code', { length: 2 }).notNull(),
  // Значения: 'TM' | 'UZ' | 'KZ' | 'KG' | 'TJ' | 'IR' | 'TR' | 'AE' | 'RU' | 'BY'

  displayName: varchar('display_name', { length: 200 }),
  // Для individual: "Иван Иванов", для company: "ООО Рога и Копыта"

  verificationStatus: varchar('verification_status', { length: 20 })
    .notNull()
    .default('unverified'),
  // Значения: 'unverified' | 'pending' | 'verified' | 'rejected'

  verifiedAt: timestamp('verified_at'),
  rejectionReason: text('rejection_reason'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### 1.4 Таблица `client_individual`

```typescript
export const clientIndividual = pgTable('client_individual', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .unique() // один-к-одному с client_profiles
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),

  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  middleName: varchar('middle_name', { length: 100 }),

  // Тип документа зависит от страны:
  // TM → 'passport_tm'
  // UZ → 'pinfl' (14 цифр)
  // KZ → 'iin' (12 цифр)
  // KG → 'inn_kg'
  // TJ → 'passport_tj'
  // IR → 'melli_code' (10 цифр)
  // TR → 'tc_kimlik' (11 цифр)
  // AE → 'emirates_id' (15 цифр)
  // RU → 'inn_ru' (12 цифр)
  // BY → 'passport_by'
  docType: varchar('doc_type', { length: 30 }),
  docNumber: varchar('doc_number', { length: 50 }),
  docFileUrl: varchar('doc_file_url', { length: 500 }), // необязательно
  docVerifiedAt: timestamp('doc_verified_at'),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### 1.5 Таблица `client_company`

```typescript
export const clientCompany = pgTable('client_company', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .unique()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),

  companyName: varchar('company_name', { length: 300 }).notNull(),

  // Локальная форма бизнеса (строка, не enum — легко расширять):
  // TM: 'hususy_telekeci' | 'ooo' | 'zao'
  // UZ: 'yakka_tartibdagi' | 'mchj'
  // KZ: 'ip' | 'too' | 'ao'
  // и т.д.
  legalForm: varchar('legal_form', { length: 50 }),

  taxId: varchar('tax_id', { length: 50 }),      // ИНН / Tax ID
  regNumber: varchar('reg_number', { length: 50 }), // Рег. номер компании

  // Банковские реквизиты — необязательны при регистрации
  bankName: varchar('bank_name', { length: 200 }),
  bankAccount: varchar('bank_account', { length: 50 }),
  bankSwift: varchar('bank_swift', { length: 20 }),

  docFileUrl: varchar('doc_file_url', { length: 500 }), // необязательно
  docVerifiedAt: timestamp('doc_verified_at'),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### 1.6 Таблица `orders`

```typescript
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientProfileId: uuid('client_profile_id')
    .notNull()
    .references(() => clientProfiles.id),

  orderType: varchar('order_type', { length: 20 }).notNull().default('open'),
  // Значения: 'open' | 'direct' (direct — для будущего перевозчика)

  status: varchar('status', { length: 20 }).notNull().default('draft'),
  // Значения:
  // 'draft'       — заказчик заполняет
  // 'published'   — видна всем перевозчикам
  // 'negotiating' — есть хотя бы одна ставка
  // 'confirmed'   — заказчик выбрал перевозчика
  // 'pickup'      — перевозчик едет к загрузке
  // 'in_transit'  — груз в пути
  // 'delivering'  — на месте выгрузки
  // 'delivered'   — выгружен, ждём подтверждения заказчика
  // 'completed'   — заказчик подтвердил, отзывы открыты
  // 'cancelled'   — отменён (до confirmed)
  // 'expired'     — автоматически истёк (BullMQ job)
  // 'disputed'    — открыт спор

  title: varchar('title', { length: 300 }).notNull(),
  // Краткое описание груза: "Стройматериалы Ашхабад → Стамбул"

  price: decimal('price', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  // На MVP только USD. Поле готово для мультивалютности.

  priceType: varchar('price_type', { length: 20 }).notNull().default('negotiable'),
  // Значения: 'fixed' | 'negotiable'
  // На MVP всегда 'negotiable' — заказчик ставит стартовую цену, перевозчики торгуются

  // Откуда
  fromCountry: varchar('from_country', { length: 2 }).notNull(),
  fromRegion: varchar('from_region', { length: 100 }),
  fromCity: varchar('from_city', { length: 100 }).notNull(),

  // Куда
  toCountry: varchar('to_country', { length: 2 }).notNull(),
  toRegion: varchar('to_region', { length: 100 }),
  toCity: varchar('to_city', { length: 100 }).notNull(),

  readyDate: date('ready_date').notNull(),
  // Дата когда груз готов к загрузке
  deadlineDate: date('deadline_date'),
  // Желаемая дата доставки (необязательно)

  acceptedBidId: uuid('accepted_bid_id'),
  // FK на order_bids.id — заполняется когда заказчик выбирает перевозчика
  // Намеренно без FK constraint во избежание circular reference — проверяем в коде

  publishedAt: timestamp('published_at'),
  confirmedAt: timestamp('confirmed_at'),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
  // = readyDate + 7 дней, вычисляется при публикации

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### 1.7 Таблица `order_cargo`

```typescript
export const orderCargo = pgTable('order_cargo', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .unique() // пока 1-к-1, в будущем убрать unique для сборных грузов
    .references(() => orders.id, { onDelete: 'cascade' }),

  cargoType: varchar('cargo_type', { length: 100 }).notNull(),
  // Строка, не enum. Примеры: 'стройматериалы', 'продукты питания',
  // 'автомобили', 'химия', 'одежда', 'электроника', 'наливной груз'

  weightKg: decimal('weight_kg', { precision: 10, scale: 2 }),
  volumeM3: decimal('volume_m3', { precision: 10, scale: 3 }),

  packaging: varchar('packaging', { length: 50 }),
  // Значения: 'bulk' | 'boxes' | 'pallets' | 'container' | 'other'

  tempControlled: boolean('temp_controlled').default(false),
  tempMin: decimal('temp_min', { precision: 5, scale: 1 }),
  // Заполняется только если temp_controlled = true
  tempMax: decimal('temp_max', { precision: 5, scale: 1 }),

  notes: text('notes'),
  // Дополнительные требования к перевозке

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### 1.8 Таблица `order_bids`

```typescript
export const orderBids = pgTable('order_bids', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  carrierProfileId: uuid('carrier_profile_id').notNull(),
  // FK на будущую таблицу carrier_profiles — пока без constraint

  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),

  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // Значения: 'pending' | 'accepted' | 'rejected' | 'withdrawn'

  comment: text('comment'),
  // Перевозчик может написать комментарий к ставке

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Уникальный индекс: один перевозчик = одна активная ставка на заказ
// Перевозчик может обновить ставку (updatedAt меняется), но не создать вторую
export const orderBidsUniqueIdx = uniqueIndex('order_bids_unique_carrier')
  .on(orderBids.orderId, orderBids.carrierProfileId)
```

### 1.9 Таблица `order_status_log`

```typescript
export const orderStatusLog = pgTable('order_status_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  changedBy: uuid('changed_by')
    .notNull()
    .references(() => users.id),

  oldStatus: varchar('old_status', { length: 20 }).notNull(),
  newStatus: varchar('new_status', { length: 20 }).notNull(),
  comment: text('comment'),
  photoUrl: varchar('photo_url', { length: 500 }),
  // Фото прикрепляется при delivering → delivered

  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

---

## 2. Email верификация через Resend

### 2.1 Установка

```bash
cd packages/backend
bun add resend
```

### 2.2 Переменные окружения

```bash
# packages/backend/.env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
```

### 2.3 Файл `packages/backend/src/lib/email.ts`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

  await resend.emails.send({
    from: 'AltynBurgut <noreply@altynburgut.com>',
    to,
    subject: 'Подтвердите ваш email — AltynBurgut',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a1a;">Добро пожаловать в AltynBurgut</h2>
        <p style="color: #555;">Нажмите кнопку ниже чтобы подтвердить ваш email адрес:</p>
        <a href="${verifyUrl}"
           style="display: inline-block; padding: 12px 28px; background: #2563eb;
                  color: #fff; border-radius: 8px; text-decoration: none;
                  font-weight: 600; margin: 16px 0;">
          Подтвердить email
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          Ссылка действует 24 часа. Если вы не регистрировались — проигнорируйте письмо.
        </p>
      </div>
    `,
  })
}
```

### 2.4 Эндпоинты в `packages/backend/src/routes/auth.ts`

Добавить два эндпоинта к существующему auth router:

**POST `/api/auth/send-verification`** — отправить письмо верификации.

Логика:
1. Получить `userId` из сессии
2. Если `user.emailVerified` уже установлен — вернуть `{ message: 'already_verified' }`
3. Удалить старый неиспользованный токен если есть
4. Создать новый токен в `verification_tokens` с `type = 'email'`, `expiresAt = now + 24h`
5. Вызвать `sendVerificationEmail(user.email, token.token)`
6. Вернуть `{ success: true }`

**GET `/api/auth/verify-email`** — обработать клик по ссылке из письма.

Query параметр: `token: string`

Логика:
1. Найти запись в `verification_tokens` по `token`
2. Если не найдена — 400 `{ error: 'token_not_found' }`
3. Если `expiresAt < now` — 400 `{ error: 'token_expired' }`
4. Если `usedAt` уже установлен — 400 `{ error: 'token_used' }`
5. Обновить запись: `usedAt = now`
6. Обновить `users`: `emailVerified = now`
7. Redirect на `${FRONTEND_URL}/cabinet?verified=true`

### 2.5 Фронтенд (Nuxt 3)

**После успешной регистрации** в `useAuth.ts` composable:
```typescript
// Сразу после sign-up вызывать:
await $fetch('/api/auth/send-verification', { method: 'POST' })
```

**Страница `pages/verify-email.vue`:**
```vue
<script setup>
const route = useRoute()
// При mounted — редиректим на бэкенд который сам сделает redirect в /cabinet
await navigateTo(
  `/api/auth/verify-email?token=${route.query.token}`,
  { external: true }
)
</script>
```

**В кабинете** — показывать баннер если email не подтверждён:
- Проверять `user.emailVerified === null`
- Кнопка "Отправить письмо повторно" → `POST /api/auth/send-verification`
- При `?verified=true` в URL — показать toast "Email подтверждён!"

---

## 3. API эндпоинты заказов

Все эндпоинты в `packages/backend/src/routes/orders.ts`. Требуют авторизации.

### 3.1 Создать заявку (draft)

**POST `/api/orders`**

Body:
```typescript
{
  title: string            // обязательно
  fromCountry: string      // обязательно, 2 буквы
  fromRegion?: string
  fromCity: string         // обязательно
  toCountry: string        // обязательно
  toRegion?: string
  toCity: string           // обязательно
  readyDate: string        // обязательно, ISO date
  deadlineDate?: string
  price?: number
  currency?: string        // default 'USD'

  // Груз — создаётся вместе с заказом
  cargo: {
    cargoType: string      // обязательно
    weightKg?: number
    volumeM3?: number
    packaging?: string
    tempControlled?: boolean
    tempMin?: number
    tempMax?: number
    notes?: string
  }
}
```

Логика:
1. Получить `userId` из сессии
2. Найти активный `client_profile` для этого `userId` (первый по `created_at`)
3. Создать запись в `orders` со статусом `'draft'`
4. Создать запись в `order_cargo`
5. Вернуть созданный заказ с cargo

### 3.2 Опубликовать заявку

**PATCH `/api/orders/:id/publish`**

Логика:
1. Проверить что заказ принадлежит текущему пользователю
2. Проверить что статус `'draft'`
3. Установить `status = 'published'`, `publishedAt = now`
4. Вычислить `expiresAt = readyDate + 7 дней`
5. Записать в `order_status_log`
6. Вернуть обновлённый заказ

### 3.3 Получить доску заявок (для перевозчиков)

**GET `/api/orders`**

Query параметры (все необязательны):
```
status?: string        // default 'published,negotiating'
fromCountry?: string
toCountry?: string
fromCity?: string
toCity?: string
cargoType?: string
page?: number          // default 1
limit?: number         // default 20
```

Возвращает: `{ orders: Order[], total: number, page: number }`

Каждый заказ включает: основные поля + `order_cargo` + количество ставок (`bids_count`).

### 3.4 Получить один заказ

**GET `/api/orders/:id`**

Возвращает: заказ + `order_cargo` + все `order_bids` (если запрашивает владелец заказа) + `order_status_log`

### 3.5 Мои заказы (для заказчика)

**GET `/api/orders/my`**

Query: `status?: string`, `page?`, `limit?`

Возвращает заказы текущего пользователя.

### 3.6 Сделать ставку (для перевозчика)

**POST `/api/orders/:id/bids`**

Body:
```typescript
{
  amount: number
  currency?: string  // default 'USD'
  comment?: string
}
```

Логика:
1. Проверить что заказ в статусе `'published'` или `'negotiating'`
2. Проверить что перевозчик не является владельцем заказа
3. Если уже есть ставка от этого перевозчика — обновить (`amount`, `comment`, `updatedAt`)
4. Если нет — создать новую ставку
5. Если статус заказа `'published'` — изменить на `'negotiating'`
6. Вернуть ставку

### 3.7 Принять ставку (для заказчика)

**PATCH `/api/orders/:id/bids/:bidId/accept`**

Логика:
1. Проверить что заказ принадлежит текущему пользователю
2. Проверить что заказ в статусе `'negotiating'`
3. Установить выбранной ставке `status = 'accepted'`
4. Всем остальным ставкам этого заказа → `status = 'rejected'`
5. Обновить заказ: `status = 'confirmed'`, `acceptedBidId = bidId`, `confirmedAt = now`
6. Записать в `order_status_log`

### 3.8 Обновить статус заказа (для перевозчика)

**PATCH `/api/orders/:id/status`**

Body: `{ status: string, comment?: string, photoUrl?: string }`

Разрешённые переходы для перевозчика:
- `confirmed → pickup`
- `pickup → in_transit`
- `in_transit → delivering`
- `delivering → delivered` (photoUrl рекомендуется)

Логика:
1. Проверить что перевозчик является исполнителем заказа (через `acceptedBidId`)
2. Проверить что переход разрешён
3. Обновить статус
4. Записать в `order_status_log` с `photoUrl` если передан
5. Вернуть обновлённый заказ

### 3.9 Завершить заказ (для заказчика)

**PATCH `/api/orders/:id/complete`**

Логика:
1. Проверить что заказ принадлежит текущему пользователю
2. Проверить что статус `'delivered'`
3. Установить `status = 'completed'`, `completedAt = now`
4. Записать в `order_status_log`

### 3.10 Отменить заказ

**PATCH `/api/orders/:id/cancel`**

Body: `{ reason?: string }`

Разрешено только если статус: `'draft'` | `'published'` | `'negotiating'`
После `'confirmed'` — только через `'disputed'`.

---

## 4. BullMQ job — автоматическое истечение заявок

Файл: `packages/backend/src/jobs/expireOrders.ts`

```typescript
// Запускать раз в сутки (cron: '0 2 * * *' — в 2 ночи)
// Логика:
// 1. Найти все orders где:
//    status IN ('published', 'negotiating')
//    AND expiresAt < now
// 2. Для каждого:
//    - Установить status = 'expired'
//    - Записать в order_status_log (changedBy = system user id или null)
// 3. Логировать количество истёкших заказов
```

---

## 5. Middleware — проверка верификации заказчика при создании заявки

При `POST /api/orders` — проверять `client_profile.verificationStatus`:
- Если `'verified'` — создавать заявку как обычно
- Если `'unverified'` или `'pending'` — создавать заявку, но добавлять поле `clientVerified: false` в ответ (фронтенд покажет предупреждение)
- Если профиля нет вообще — 400 `{ error: 'profile_required' }`

---

## 6. Чеклист реализации

### Backend
- [ ] Drizzle миграция: добавить `phone`, `phone_verified` в `users`
- [ ] Drizzle миграция: таблица `verification_tokens` (с полем `type`)
- [ ] Drizzle миграция: таблица `client_profiles`
- [ ] Drizzle миграция: таблица `client_individual`
- [ ] Drizzle миграция: таблица `client_company`
- [ ] Drizzle миграция: таблица `orders`
- [ ] Drizzle миграция: таблица `order_cargo`
- [ ] Drizzle миграция: таблица `order_bids` с unique index
- [ ] Drizzle миграция: таблица `order_status_log`
- [ ] `bun add resend`
- [ ] Файл `src/lib/email.ts`
- [ ] Эндпоинт `POST /api/auth/send-verification`
- [ ] Эндпоинт `GET /api/auth/verify-email`
- [ ] Все эндпоинты заказов (3.1 — 3.10)
- [ ] BullMQ job для expire заказов
- [ ] Eden Treaty типы обновить

### Frontend (Nuxt 3)
- [ ] Вызов `send-verification` после регистрации в `useAuth.ts`
- [ ] Страница `pages/verify-email.vue`
- [ ] Баннер "подтвердите email" в кабинете если `emailVerified = null`
- [ ] Toast "Email подтверждён!" при `?verified=true`
- [ ] Форма создания заявки (Шаг 1: маршрут + даты + цена)
- [ ] Форма создания заявки (Шаг 2: характеристики груза)
- [ ] Доска заявок с фильтрами
- [ ] Карточка заявки с историей статусов
- [ ] Форма профиля заказчика (Шаг 3: individual / company, динамические поля по стране)

---

## 7. Справочные данные

### Страны и коды документов

| Страна | Код | individual doc_type | company tax_id name |
|--------|-----|---------------------|---------------------|
| Туркменистан | TM | passport_tm | ИНН |
| Узбекистан | UZ | pinfl (14 цифр) | ИНН (9 цифр) |
| Казахстан | KZ | iin (12 цифр) | БИН (12 цифр) |
| Кыргызстан | KG | inn_kg (14 цифр) | ИНН юрлица |
| Таджикистан | TJ | passport_tj | ИНН |
| Иран | IR | melli_code (10 цифр) | شناسه ملی (11 цифр) |
| Турция | TR | tc_kimlik (11 цифр) | Vergi No (10 цифр) |
| ОАЭ | AE | emirates_id (15 цифр) | Trade License No |
| Россия | RU | inn_ru (12 цифр) | ИНН (10 цифр) |
| Беларусь | BY | passport_by | УНП (9 цифр) |

### Статусы заказа и кто управляет

| Переход | Кто | Условие |
|---------|-----|---------|
| draft → published | Заказчик | — |
| published → negotiating | Система | При первой ставке |
| negotiating → confirmed | Заказчик | Выбор ставки |
| confirmed → pickup | Перевозчик | — |
| pickup → in_transit | Перевозчик | — |
| in_transit → delivering | Перевозчик | — |
| delivering → delivered | Перевозчик | Фото рекомендуется |
| delivered → completed | Заказчик | — |
| any → cancelled | Заказчик | До confirmed |
| delivered → disputed | Любая сторона | — |
| any → expired | Система (BullMQ) | expiresAt < now |
