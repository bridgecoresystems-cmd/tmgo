# Техническое задание: Система карточки водителя
## Проект: AltynBurgut — Мультирегиональная платформа грузоперевозок
**Стек:** Elysia.js + Bun, Drizzle ORM, PostgreSQL + PostGIS, Better Auth, Nuxt 3  
**Монорепо:** пакет `apps/backend` (Elysia) + `apps/frontend` (Nuxt 3)  
**Дата:** Март 2026 | **Версия ТЗ:** 2.0

---

## КОНТЕКСТ И ПРОБЛЕМА

Текущая реализация хранит все данные водителя в одной таблице `carrier_profiles` плоскими полями.  
Это создаёт три критические проблемы:

1. **Потеря истории** — при обновлении паспорта старые данные перезаписываются. Невозможно узнать,
   с каким документом водитель ехал в конкретный рейс год назад.
2. **Нет поддержки нескольких документов** — водитель не может иметь два паспорта, несколько виз,
   несколько страховок одновременно.
3. **Смешана логика** — верификация профиля, запросы на изменение и сами данные перемешаны в одной таблице.

**Цель этого ТЗ** — переработать систему по четырём направлениям:
1. Схема БД с полным audit trail (данные никогда не удаляются)
2. Система верификации профиля
3. Система запросов на изменение данных
4. Правильная классификация полей (кто что может менять)

---

## РАЗДЕЛ 1: НОВАЯ СХЕМА БАЗЫ ДАННЫХ (DRIZZLE ORM)

### 1.1 Принципы проектирования

**Правило №1 — Append-only для важных данных:**  
Документы, гражданства, контакты НИКОГДА не удаляются физически (DELETE). Только логическое удаление через поле `status` или `valid_until`. Это обеспечивает полный audit trail для статистики.

**Правило №2 — Snapshot в рейсах:**  
При создании рейса система сохраняет `passport_id` и `vehicle_id` — какой конкретно документ и машина были активны в момент рейса. Через год можно точно восстановить картину.

**Правило №3 — Разделение ответственности:**  
- Таблица `carrier_profiles` — только неизменяемые identity-поля + статусные поля для admina
- Таблица `driver_documents` — все документы (паспорт, права, визы, медсправки и т.д.)
- Таблица `driver_citizenships` — гражданства (может быть несколько)
- Таблица `driver_contacts` — телефоны и emails (кроме primary, который в Better Auth)

### 1.2 Таблица `carrier_profiles` (рефакторинг)

```typescript
// apps/backend/src/db/schema/carrier-profiles.ts

import { pgTable, uuid, text, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'

export const verificationStatusEnum = pgEnum('verification_status', [
  'not_submitted',      // Ещё не заполнял карточку
  'draft',              // Заполняет, ещё не отправил
  'submitted',          // Отправил на верификацию, ждёт
  'verified',           // Верифицирован, может работать
  'rejected',           // Отклонён с комментарием
  'suspended',          // Временно приостановлен (нарушение)
])

export const employmentCategoryEnum = pgEnum('employment_category', [
  'full_time',          // Штатный
  'freelance',          // Внештатный
  'leased',             // Арендованный транспорт
])

export const carrierProfiles = pgTable('carrier_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(), // FK → better_auth users

  // ─── IDENTITY FIELDS (заполняются один раз, меняются только через change_request) ───
  surname: text('surname'),
  givenName: text('given_name'),
  patronymic: text('patronymic'),
  dateOfBirth: timestamp('date_of_birth'),
  gender: text('gender'), // 'male' | 'female'

  // ─── OPERATIONAL FIELDS (только admin/dispatcher) ───
  employmentCategory: employmentCategoryEnum('employment_category'),
  // Статус аккаунта — только диспетчер/HR
  // 'active' | 'inactive' | 'on_leave' | 'fired'
  accountStatus: text('account_status').default('active'),
  // Онлайн/оффлайн — сам водитель через тумблер в приложении
  isOnline: boolean('is_online').default(false),

  // ─── COMPANY INFO (admin only) ───
  companyName: text('company_name'),
  inn: text('inn'),
  companyAddress: text('company_address'),
  warehouseBranch: text('warehouse_branch'),
  responsibleLogistician: text('responsible_logistician'),

  // ─── VERIFICATION ───
  verificationStatus: verificationStatusEnum('verification_status').default('not_submitted'),
  verificationComment: text('verification_comment'), // Комментарий при rejection
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by'), // FK → admin user id
  submittedAt: timestamp('submitted_at'), // Когда водитель нажал "Отправить"

  // ─── MISC ───
  hireSource: text('hire_source'), // 'recommendation' | 'advertisement' | 'agency'
  recruitmentNotes: text('recruitment_notes'),
  rating: text('rating').default('0'),
  isOnlineAvailability: boolean('is_online_availability').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

### 1.3 Таблица `driver_documents` (НОВАЯ — центральная)

Все документы водителя хранятся здесь. Одна запись = один документ одной версии.

```typescript
// apps/backend/src/db/schema/driver-documents.ts

export const docTypeEnum = pgEnum('doc_type', [
  'passport',                    // Внутренний/заграничный паспорт
  'drivers_license',             // Водительское удостоверение
  'international_drivers_license', // Международное ВУ
  'visa',                        // Виза
  'medical_certificate',         // Медицинская справка
  'insurance',                   // Страховка (ОСАГО, CMR и т.д.)
  'tachograph_card',             // Карта тахографа
  'technical_minimum_cert',      // Сертификат техминимума
  'entry_permit',                // Разрешение на въезд в зону/страну
  'adr_certificate',             // Допуск ADR (опасные грузы)
  'other',                       // Прочие
])

export const docStatusEnum = pgEnum('doc_status', [
  'pending_verification',  // Загружен, ждёт проверки admin
  'active',                // Верифицирован, действующий
  'expired',               // Истёк срок действия
  'revoked',               // Аннулирован (документ недействителен)
  'superseded',            // Заменён новой версией (но хранится для истории)
  'rejected',              // Отклонён при верификации
])

export const driverDocuments = pgTable('driver_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').notNull(), // FK → carrier_profiles.id

  docType: docTypeEnum('doc_type').notNull(),
  country: text('country'),           // Страна выдачи
  series: text('series'),             // Серия (для паспортов: AB)
  number: text('number'),             // Номер документа
  issuedBy: text('issued_by'),        // Кем выдан
  issuedAt: timestamp('issued_at'),   // Дата выдачи
  expiresAt: timestamp('expires_at'), // Дата окончания (null = бессрочный)

  // Для паспортов
  placeOfBirth: text('place_of_birth'),
  residentialAddress: text('residential_address'),

  // Для ВУ
  licenseCategories: text('license_categories'), // 'B,C,D,E'

  // Для разрешений
  permissionZone: text('permission_zone'), // 'РФ, Казахстан'

  // Для всех
  notes: text('notes'),
  scanUrl: text('scan_url'),           // Путь к скану

  // ─── ЖИЗНЕННЫЙ ЦИКЛ (НИКОГДА не удалять записи) ───
  status: docStatusEnum('doc_status').default('pending_verification'),
  validFrom: timestamp('valid_from').defaultNow(),  // С какого момента активен
  validUntil: timestamp('valid_until'),              // До какого (null = сейчас активен)
  supersededById: uuid('superseded_by_id'),          // Ссылка на новую версию документа
  rejectionReason: text('rejection_reason'),         // Причина отклонения

  // ─── ВЕРИФИКАЦИЯ ДОКУМЕНТА ───
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by'),   // FK → admin user id

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

**Пример сценария — водитель получил новый паспорт:**
```
// Старая запись (паспорт AB1234567):
{ id: 'old-uuid', status: 'superseded', valid_until: '2026-03-15', superseded_by_id: 'new-uuid' }

// Новая запись (паспорт AB9999999):
{ id: 'new-uuid', status: 'pending_verification', valid_from: '2026-03-15' }

// История СОХРАНЕНА. Для аналитики: "С каким паспортом он ехал в январе 2026?"
// → запрос: WHERE valid_from <= '2026-01-15' AND (valid_until IS NULL OR valid_until > '2026-01-15')
```

### 1.4 Таблица `driver_citizenships` (НОВАЯ)

```typescript
// apps/backend/src/db/schema/driver-citizenships.ts

export const citizenshipStatusEnum = pgEnum('citizenship_status', [
  'active',   // Действующее гражданство
  'revoked',  // Отказался от гражданства
])

export const driverCitizenships = pgTable('driver_citizenships', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').notNull(), // FK → carrier_profiles.id

  country: text('country').notNull(),
  acquiredAt: timestamp('acquired_at'),    // Когда получил
  revokedAt: timestamp('revoked_at'),      // Когда отказался (null = активное)
  scanUrl: text('scan_url'),               // Скан подтверждающего документа
  status: citizenshipStatusEnum('status').default('active'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by'),

  createdAt: timestamp('created_at').defaultNow(),
})
```

**Пример — двойное гражданство:**
```
{ country: 'Туркменистан', status: 'active', acquired_at: '1989-09-17' }
{ country: 'Россия', status: 'active', acquired_at: '2020-06-01' }
// Обе записи active одновременно — это нормально
```

### 1.5 Таблица `driver_contacts` (НОВАЯ)

Primary email/phone хранится в Better Auth. Здесь — дополнительные.

```typescript
// apps/backend/src/db/schema/driver-contacts.ts

export const contactTypeEnum = pgEnum('contact_type', [
  'phone',
  'email',
])

export const driverContacts = pgTable('driver_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').notNull(),

  contactType: contactTypeEnum('contact_type').notNull(),
  value: text('value').notNull(),        // Номер телефона или email
  label: text('label'),                  // 'Рабочий', 'WhatsApp', 'Экстренный'
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),    // Soft delete (никогда не удалять физически)
})
```

### 1.6 Таблица `driver_vehicles` (НОВАЯ — для snapshot в рейсах)

```typescript
// apps/backend/src/db/schema/driver-vehicles.ts

export const vehicleOwnershipEnum = pgEnum('vehicle_ownership', [
  'own',      // Личный транспорт
  'company',  // Транспорт компании
  'leased',   // Арендованный
])

export const driverVehicles = pgTable('driver_vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').notNull(),

  plateNumber: text('plate_number').notNull(),
  vehicleType: text('vehicle_type'),        // Тент, реф, изотерм...
  brand: text('brand'),
  model: text('model'),
  year: text('year'),
  ownership: vehicleOwnershipEnum('ownership'),

  // ─── ЖИЗНЕННЫЙ ЦИКЛ ───
  assignedFrom: timestamp('assigned_from').defaultNow(),
  assignedUntil: timestamp('assigned_until'), // null = сейчас активен
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
})
```

### 1.7 Таблица `profile_verification_history` (НОВАЯ — лог верификаций)

```typescript
// apps/backend/src/db/schema/profile-verification-history.ts

export const profileVerificationHistory = pgTable('profile_verification_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').notNull(),

  action: text('action').notNull(),
  // 'submitted' | 'verified' | 'rejected' | 'suspended' | 'resubmitted'

  previousStatus: text('previous_status'),
  newStatus: text('new_status'),
  comment: text('comment'),              // Комментарий admin при rejection
  performedBy: uuid('performed_by'),     // Кто выполнил (admin id или driver id)
  performedByRole: text('performed_by_role'), // 'driver' | 'admin' | 'system'

  // Snapshot данных на момент отправки (для аналитики)
  profileSnapshot: jsonb('profile_snapshot'),

  createdAt: timestamp('created_at').defaultNow(),
})
```

### 1.8 Таблица `profile_change_requests` (рефакторинг `profile_edit_requests`)

```typescript
// apps/backend/src/db/schema/profile-change-requests.ts

export const changeRequestStatusEnum = pgEnum('change_request_status', [
  'pending',   // Ждёт рассмотрения
  'approved',  // Одобрен (поле разблокировано)
  'rejected',  // Отклонён
  'applied',   // Изменение уже внесено и подтверждено
  'cancelled', // Водитель отозвал запрос
])

export const profileChangeRequests = pgTable('profile_change_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').notNull(),

  // Что хочет изменить
  fieldKey: text('field_key').notNull(),
  // Например: 'surname', 'passport:add', 'citizenship:add', 'drivers_license:renewal'

  currentValue: text('current_value'),   // Текущее значение (snapshot)
  requestedValue: text('requested_value'), // Желаемое новое значение
  reason: text('reason'),                // Причина запроса от водителя

  status: changeRequestStatusEnum('status').default('pending'),
  adminComment: text('admin_comment'),   // Комментарий admin при rejection
  resolvedBy: uuid('resolved_by'),       // Кто рассмотрел
  resolvedAt: timestamp('resolved_at'),

  // После одобрения — поле разблокировано до:
  unlockedUntil: timestamp('unlocked_until'), // Через 7 дней блокируется снова

  requestedAt: timestamp('requested_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
})
```

---

## РАЗДЕЛ 2: СИСТЕМА ВЕРИФИКАЦИИ ПРОФИЛЯ

### 2.1 Жизненный цикл верификации

```
not_submitted → draft → submitted → verified
                              ↓          ↓
                           rejected   suspended
                              ↓
                          resubmitted → submitted → ...
```

**Переходы и кто их инициирует:**

| Переход | Кто | Условие |
|---------|-----|---------|
| `not_submitted` → `draft` | Система | При первом сохранении любого поля |
| `draft` → `submitted` | Водитель | Кнопка "Отправить на верификацию" |
| `submitted` → `verified` | Admin | Все обязательные документы проверены |
| `submitted` → `rejected` | Admin | С обязательным комментарием |
| `rejected` → `submitted` | Водитель | После исправления, кнопка "Отправить повторно" |
| `verified` → `suspended` | Admin | Нарушение, жалоба |
| `suspended` → `verified` | Admin | После разбора ситуации |

### 2.2 Что проверяет admin при верификации

Обязательные поля для успешной верификации:
```typescript
const REQUIRED_FOR_VERIFICATION = {
  profile: ['surname', 'givenName', 'dateOfBirth', 'gender'],
  documents: [
    { docType: 'passport', minCount: 1 },
    { docType: 'drivers_license', minCount: 1 },
  ],
  citizenships: { minCount: 1 },
}
```

Admin видит список "Что не заполнено" и может нажать "Верифицировать" только когда всё есть.  
При нажатии "Отклонить" — обязательное текстовое поле с причиной.

### 2.3 API эндпоинты верификации

**Для водителя (prefix: `/cabinet/driver`):**

```typescript
// Отправить на верификацию (draft → submitted)
POST /cabinet/driver/profile/submit-for-verification
// Body: {} (пустой — просто смена статуса)
// Response: { verification_status: 'submitted', submitted_at: '...' }

// Получить текущий статус верификации
GET /cabinet/driver/profile/verification-status
// Response: {
//   status: 'submitted',
//   submitted_at: '2026-03-15',
//   comment: null,          // null если не rejected
//   can_edit: false,         // false если submitted/verified
//   missing_fields: [],      // Что ещё нужно заполнить
// }

// Повторно отправить после rejection
POST /cabinet/driver/profile/resubmit
```

**Для admin (prefix: `/admin/drivers/:driverId`):**

```typescript
// Верифицировать водителя
POST /admin/drivers/:driverId/verify
// Body: { comment?: string }

// Отклонить
POST /admin/drivers/:driverId/reject
// Body: { comment: string }  // ОБЯЗАТЕЛЬНО

// Приостановить
POST /admin/drivers/:driverId/suspend
// Body: { comment: string, reason: string }

// Восстановить
POST /admin/drivers/:driverId/restore
// Body: { comment?: string }

// История верификаций водителя
GET /admin/drivers/:driverId/verification-history
```

### 2.4 Блокировка полей после верификации

После того как водитель нажал "Отправить на верификацию" (статус `submitted` и выше),
поля карточки блокируются. Это реализуется НА УРОВНЕ BACKEND, не только фронтенда.

```typescript
// Классификация полей (использовать в PATCH /cabinet/driver/profile)

// Никогда не редактируются водителем после верификации (только через change_request)
const IDENTITY_FIELDS = ['surname', 'givenName', 'patronymic', 'dateOfBirth', 'gender']

// Только admin/dispatcher (водитель видит как read-only всегда)
const ADMIN_ONLY_FIELDS = ['accountStatus', 'employmentCategory', 'companyName',
  'inn', 'companyAddress', 'warehouseBranch', 'responsibleLogistician']

// Водитель управляет сам (тумблер онлайн/оффлайн)
const DRIVER_OPERATIONAL = ['isOnline']

// Дополнительные контакты — водитель добавляет/удаляет свободно
// через отдельные эндпоинты /cabinet/driver/contacts
const DRIVER_CONTACTS = ['phones[]', 'emails[]']
```

**Backend логика в PATCH `/cabinet/driver/profile`:**
```typescript
// Псевдокод
const status = profile.verificationStatus
const isLocked = ['submitted', 'verified', 'suspended'].includes(status)

if (isLocked) {
  // Разрешить только: isOnline, hireSource, recruitmentNotes
  // Всё остальное — 403 с объяснением
  const allowedFields = ['isOnline']
  const attemptedFields = Object.keys(body)
  const forbidden = attemptedFields.filter(f => !allowedFields.includes(f))
  if (forbidden.length > 0) {
    return { error: `Поля заблокированы после верификации: ${forbidden.join(', ')}. Используйте запрос на изменение.` }
  }
}
```

---

## РАЗДЕЛ 3: СИСТЕМА ЗАПРОСОВ НА ИЗМЕНЕНИЕ

### 3.1 Принцип работы (как у Uber/Bolt)

После верификации водитель **не может** напрямую менять identity-поля.  
Вместо этого — трёхшаговый процесс:

```
1. Водитель: "Хочу изменить фамилию" → создаёт change_request
2. Admin видит в очереди → может одобрить или отклонить
3. После одобрения: поле разблокировано на 7 дней
4. Водитель вносит изменение → изменение сохраняется
5. Через 7 дней поле снова блокируется
```

**Важно:** Одобрение = разрешение изменить. Само изменение водитель вносит руками.  
Admin не вносит данные за водителя (кроме admin-only полей).

### 3.2 Типы change_request

```typescript
// Варианты fieldKey
const CHANGE_REQUEST_TYPES = {
  // Identity поля
  'surname': 'Смена фамилии (свадьба/развод)',
  'given_name': 'Смена имени',
  'date_of_birth': 'Исправление даты рождения',

  // Документы
  'passport:add': 'Добавить второй паспорт',
  'passport:renew': 'Обновить паспорт (получил новый)',
  'drivers_license:renew': 'Обновить водительское удостоверение',
  'medical_certificate:renew': 'Обновить медицинскую справку',
  'visa:add': 'Добавить визу',
  'insurance:add': 'Добавить страховку',
  'entry_permit:add': 'Добавить разрешение на въезд',

  // Гражданства
  'citizenship:add': 'Добавить второе гражданство',
  'citizenship:revoke': 'Отказался от гражданства',

  // Особый случай
  'identity_correction': 'Исправление ошибки в ФИО/дате рождения',
}
```

### 3.3 API эндпоинты change_request

**Для водителя:**

```typescript
// Создать запрос на изменение
POST /cabinet/driver/change-requests
Body: {
  fieldKey: string,          // Тип изменения
  reason: string,            // ОБЯЗАТЕЛЬНО — почему хочет изменить
  requestedValue?: string,   // Желаемое значение (если применимо)
  attachmentUrl?: string,    // Скан подтверждающего документа
}
// Response: { id, status: 'pending', created_at }

// Список своих запросов
GET /cabinet/driver/change-requests
// Response: [{ id, fieldKey, status, reason, admin_comment, created_at, resolved_at }]

// Отозвать запрос (только pending)
DELETE /cabinet/driver/change-requests/:requestId
// Response: { status: 'cancelled' }

// Проверить разблокирован ли конкретный ключ
GET /cabinet/driver/change-requests/unlocked
// Response: { unlocked_keys: ['surname', 'passport:add'], expires_at: { 'surname': '2026-03-22' } }
```

**Для admin:**

```typescript
// Очередь всех pending запросов
GET /admin/change-requests?status=pending&page=1
// Response: [{ id, carrier_id, driver_name, fieldKey, reason, current_value, requested_value, created_at }]

// Одобрить запрос
POST /admin/change-requests/:requestId/approve
Body: {
  comment?: string,          // Опционально
  unlock_days?: number,      // По умолчанию 7 дней
}

// Отклонить запрос
POST /admin/change-requests/:requestId/reject
Body: {
  comment: string,           // ОБЯЗАТЕЛЬНО
}
```

### 3.4 Проверка разблокировки в PATCH профиля

```typescript
// При каждом PATCH /cabinet/driver/profile или PATCH /cabinet/driver/documents/:id

async function checkFieldAccess(carrierId: string, fieldKey: string): Promise<boolean> {
  // 1. Проверить есть ли approved запрос с unlocked_until > now()
  const unlockedRequest = await db
    .select()
    .from(profileChangeRequests)
    .where(
      and(
        eq(profileChangeRequests.carrierId, carrierId),
        eq(profileChangeRequests.fieldKey, fieldKey),
        eq(profileChangeRequests.status, 'approved'),
        gt(profileChangeRequests.unlockedUntil, new Date())
      )
    )
    .limit(1)

  return unlockedRequest.length > 0
}
```

### 3.5 Уведомления

При изменении статуса change_request → push-уведомление водителю:
- `approved`: "Ваш запрос на изменение [поля] одобрен. У вас 7 дней для внесения изменений."
- `rejected`: "Ваш запрос отклонён. Причина: [comment]"

При создании запроса → уведомление admin (через BullMQ queue `admin-notifications`).

---

## РАЗДЕЛ 4: КЛАССИФИКАЦИЯ ПОЛЕЙ И UX

### 4.1 Полная таблица полей карточки водителя

| Поле | Таблица | Кто видит | Кто редактирует | После верификации |
|------|---------|-----------|-----------------|-------------------|
| Driver ID | carrier_profiles | все | никто | — |
| Фамилия | carrier_profiles | все | водитель | только через change_request |
| Имя | carrier_profiles | все | водитель | только через change_request |
| Отчество | carrier_profiles | все | водитель | только через change_request |
| Дата рождения | carrier_profiles | все | водитель | только через change_request |
| Пол | carrier_profiles | все | водитель | только через change_request |
| Гражданство | driver_citizenships | все | водитель | добавление через change_request |
| Телефон (primary) | better_auth | все | водитель | через подтверждение кода |
| Телефон (доп.) | driver_contacts | все | водитель | свободно (добавить/удалить) |
| Email (primary) | better_auth | все | водитель | через подтверждение кода |
| Email (доп.) | driver_contacts | все | водитель | свободно (добавить/удалить) |
| Статус аккаунта | carrier_profiles | все (read-only у водителя) | только admin | только admin |
| Онлайн/Оффлайн | carrier_profiles | все | сам водитель | свободно всегда |
| Категория занятости | carrier_profiles | все (read-only у водителя) | только admin | только admin |
| Компания/ИНН/Адрес | carrier_profiles | все (read-only у водителя) | только admin | только admin |
| Паспорт | driver_documents | все | водитель | обновление через change_request |
| Водительское УД | driver_documents | все | водитель | обновление через change_request |
| Медсправка | driver_documents | все | водитель | обновление свободно (истекает) |
| Страховка | driver_documents | все | водитель | обновление свободно (истекает) |
| Визы | driver_documents | все | водитель | добавление свободно |
| Тахограф-карта | driver_documents | все | водитель | обновление свободно |
| Разрешения на въезд | driver_documents | все | водитель | добавление свободно |
| Транспортное средство | driver_vehicles | все | только admin | только admin |
| Источник найма | carrier_profiles | admin | водитель (до верификации) | read-only |
| Примечания | carrier_profiles | admin | admin | только admin |

### 4.2 Правило для документов с истечением срока

Документы типа `medical_certificate`, `insurance`, `visa`, `entry_permit`, `tachograph_card`
водитель может **добавлять новые версии свободно** (не требует change_request), потому что:
- Они регулярно обновляются (медсправка — ежегодно)
- Задержка из-за ожидания одобрения навредит работе
- Каждая новая версия проходит верификацию документа отдельно

Документы типа `passport` и `drivers_license` — требуют change_request перед загрузкой новой версии,
потому что это identity-документы, изменение которых важно проверить вручную.

### 4.3 Уведомления об истечении документов

BullMQ cron-задача, запускается ежедневно в 09:00:

```typescript
// apps/backend/src/jobs/document-expiry-check.ts

// Проверить документы, истекающие через 30, 14, 7, 1 день
const EXPIRY_WARNINGS = [30, 14, 7, 1] // дней

async function checkExpiringDocuments() {
  for (const daysLeft of EXPIRY_WARNINGS) {
    const targetDate = addDays(new Date(), daysLeft)

    const expiring = await db
      .select({ carrierId, docType, expiresAt, number })
      .from(driverDocuments)
      .where(
        and(
          eq(driverDocuments.status, 'active'),
          between(driverDocuments.expiresAt, new Date(), targetDate)
        )
      )

    for (const doc of expiring) {
      await sendPushNotification(doc.carrierId, {
        title: 'Документ истекает',
        body: `${docTypeLabel(doc.docType)} №${doc.number} истекает через ${daysLeft} дней`,
        data: { type: 'document_expiry', docId: doc.id }
      })
    }
  }
}
```

---

## РАЗДЕЛ 5: SNAPSHOT ДЛЯ СТАТИСТИКИ РЕЙСОВ

### 5.1 Цель

При каждом рейсе сохранять ссылки на конкретные версии документов и ТС, которые были активны
в момент начала рейса. Это позволяет:
- Реконструировать: "С каким паспортом, на какой машине, по какой страховке ехал водитель"
- Выявлять рейсы, которые были совершены с просроченными документами
- Юридическая защита платформы

### 5.2 При создании рейса

```typescript
// При POST /orders/:orderId/accept (водитель принимает заказ)

async function createTripSnapshot(carrierId: string): Promise<TripSnapshot> {
  const now = new Date()

  // Активный паспорт на момент рейса
  const activePassport = await db.select()
    .from(driverDocuments)
    .where(and(
      eq(driverDocuments.carrierId, carrierId),
      eq(driverDocuments.docType, 'passport'),
      eq(driverDocuments.status, 'active'),
      lte(driverDocuments.validFrom, now),
      or(isNull(driverDocuments.validUntil), gte(driverDocuments.validUntil, now))
    ))
    .limit(1)

  // Активное ВУ
  const activeLicense = await db.select()
    .from(driverDocuments)
    .where(and(
      eq(driverDocuments.carrierId, carrierId),
      eq(driverDocuments.docType, 'drivers_license'),
      eq(driverDocuments.status, 'active')
    ))
    .limit(1)

  // Активное ТС
  const activeVehicle = await db.select()
    .from(driverVehicles)
    .where(and(
      eq(driverVehicles.carrierId, carrierId),
      eq(driverVehicles.isActive, true)
    ))
    .limit(1)

  return {
    passportId: activePassport[0]?.id ?? null,
    driversLicenseId: activeLicense[0]?.id ?? null,
    vehicleId: activeVehicle[0]?.id ?? null,
    snapshotAt: now,
  }
}
```

### 5.3 Схема trips (добавить поля)

```typescript
// К существующей таблице trips добавить:
{
  // Snapshot на момент начала рейса
  snapshotPassportId: uuid('snapshot_passport_id'),    // FK → driver_documents
  snapshotLicenseId: uuid('snapshot_license_id'),      // FK → driver_documents
  snapshotVehicleId: uuid('snapshot_vehicle_id'),      // FK → driver_vehicles
  snapshotCreatedAt: timestamp('snapshot_created_at'), // Когда снят snapshot
}
```

---

## РАЗДЕЛ 6: МИГРАЦИЯ (КАК ПЕРЕЙТИ ОТ ТЕКУЩЕЙ СХЕМЫ)

### 6.1 Порядок действий

**Шаг 1 — Создать новые таблицы** (не трогая существующие):
```
drizzle migrate: создать driver_documents, driver_citizenships, driver_contacts, driver_vehicles, profile_verification_history, profile_change_requests
```

**Шаг 2 — Мигрировать существующие данные:**
```typescript
// Скрипт миграции: apps/backend/scripts/migrate-profiles.ts

// Для каждого carrier_profile:
// 1. Если есть passport_series/passport_number → создать запись в driver_documents(type='passport')
// 2. Если есть citizenship → создать запись в driver_citizenships
// 3. Если есть license_number → создать запись в driver_documents(type='drivers_license')
// 4. Если есть medical_certificate → создать запись в driver_documents(type='medical_certificate')
// 5. Если есть phone → создать запись в driver_contacts(type='phone') для каждого через запятую
// 6. Если есть additional_emails → аналогично для emails
// 7. Сохранить старые поля в carrier_profiles как is (не удалять до проверки)
```

**Шаг 3 — Переключить API** на чтение из новых таблиц (параллельно).

**Шаг 4 — После тестирования** — добавить Drizzle миграцию для удаления старых колонок из carrier_profiles.

### 6.2 Что удалить из carrier_profiles (после успешной миграции)

```
Удалить поля: passport_series, passport_number, passport_issue_date, passport_expiry_date,
passport_issued_by, place_of_birth, residential_address, passport_scan_url, passport_is_active,
extra_passports (jsonb), license_number, license_expiry, license_categories, license_issue_date,
license_issued_by, license_scan_url, has_international_license, international_license_number,
international_license_validity, citizenship, phone, additional_emails, permission_entry_zone,
permission_issue_date, permission_validity_date, medical_certificate, medical_certificate_scan_url,
technical_minimum_certificate, tachograph_card_number, other_permits
```

---

## РАЗДЕЛ 7: FRONTEND ИЗМЕНЕНИЯ (NUXT 3)

### 7.1 Компонент DriverProfileForm.vue (рефакторинг)

Текущий монолитный компонент разбить на:
```
components/driver/
  ProfileIdentitySection.vue     # ФИО, дата рождения, пол (read-only после верификации)
  ProfileContactsSection.vue     # Телефоны и emails (свободное редактирование)
  ProfileVerificationStatus.vue  # Баннер с текущим статусом верификации
  DocumentCard.vue               # Карточка одного документа (универсальная)
  DocumentsList.vue              # Список документов по типу
  CitizenshipsList.vue           # Список гражданств
  ChangeRequestForm.vue          # Форма создания запроса на изменение
  ChangeRequestsList.vue         # Список запросов водителя
```

### 7.2 UX для заблокированных полей

- Заблокированное поле: `disabled` input + иконка замка + tooltip "Для изменения отправьте запрос"
- Кнопка "Запросить изменение" появляется рядом с каждым заблокированным полем
- Разблокированное поле (есть approved change_request): зелёная рамка + badge "Разблокировано до DD.MM"

### 7.3 UX для документов

- Список документов группируется по типу (`passport`, `drivers_license`, ...)
- Каждый документ показывает статус: `active` (зелёный), `pending_verification` (жёлтый),
  `expired` (красный), `superseded` (серый — скрыт по умолчанию, "Показать историю")
- Кнопка "Добавить новый" для каждой группы
- Для паспорта и ВУ — кнопка "Обновить" создаёт change_request типа `passport:renew`
- Для медсправок, страховок, виз — кнопка "Загрузить новую версию" без change_request

### 7.4 Тумблер Онлайн/Оффлайн

```vue
<!-- Постоянно виден в хедере приложения водителя -->
<OnlineStatusToggle v-model="isOnline" @change="updateOnlineStatus" />
```

```typescript
// PATCH /cabinet/driver/profile/online-status
// Body: { is_online: boolean }
// Это единственное поле, которое водитель может менять в любой момент
```

---

## РАЗДЕЛ 8: СТРУКТУРА ФАЙЛОВ В МОНОРЕПО

```
apps/backend/src/
  db/
    schema/
      carrier-profiles.ts          # Рефакторинг
      driver-documents.ts          # НОВАЯ
      driver-citizenships.ts       # НОВАЯ
      driver-contacts.ts           # НОВАЯ
      driver-vehicles.ts           # НОВАЯ
      profile-verification-history.ts  # НОВАЯ
      profile-change-requests.ts   # Рефакторинг (было profile-edit-requests)
      index.ts                     # Экспорт всех схем
    migrations/
      0010_driver_documents.sql    # Новые таблицы
      0011_carrier_profiles_cleanup.sql  # Удаление старых полей (после миграции)

  routes/
    cabinet/
      driver/
        profile.ts                 # Рефакторинг
        documents.ts               # НОВАЯ
        citizenships.ts            # НОВАЯ
        contacts.ts                # НОВАЯ
        change-requests.ts         # Рефакторинг
        online-status.ts           # НОВАЯ (тумблер)
      verification.ts              # Общая логика верификации
    admin/
      drivers/
        [driverId]/
          index.ts                 # Просмотр карточки
          verify.ts                # Верификация
          documents.ts             # Верификация документов
          change-requests.ts       # Очередь запросов

  jobs/
    document-expiry-check.ts       # НОВАЯ (cron каждый день)
    admin-notifications.ts         # НОВАЯ (очередь уведомлений admin)

  lib/
    field-access.ts                # Логика проверки доступа к полям
    trip-snapshot.ts               # НОВАЯ (snapshot при создании рейса)

  scripts/
    migrate-profiles.ts            # НОВАЯ (одноразовая миграция данных)
```

---

## РАЗДЕЛ 9: ТЕСТЫ

Написать тесты (Bun test) для:

```typescript
// 1. Верификация
test('driver cannot submit for verification without required documents')
test('admin can verify driver with all required documents')
test('admin must provide comment when rejecting')
test('rejected driver can resubmit after fixing issues')

// 2. Блокировка полей
test('cannot update identity fields after submitting for verification')
test('can update identity fields with approved change_request')
test('change_request unlock expires after 7 days')

// 3. Документы
test('adding new passport creates new record, marks old as superseded')
test('expired documents are not returned as active')
test('document history is preserved after update')

// 4. Snapshot
test('trip snapshot captures correct passport at time of trip creation')
test('trip snapshot shows old passport for historical trips after renewal')

// 5. Контакты
test('driver can add extra phone without verification')
test('driver cannot delete primary email')
```

---

## КОНТРОЛЬНЫЙ СПИСОК ДЛЯ CLAUDE CODE

При выполнении этого ТЗ проверить:

- [ ] Все новые таблицы созданы через Drizzle schema (не raw SQL)
- [ ] Запущена Drizzle миграция (`bun drizzle-kit migrate`)
- [ ] Скрипт `scripts/migrate-profiles.ts` перенёс данные без потерь
- [ ] PATCH `/cabinet/driver/profile` возвращает 403 для заблокированных полей (проверить в тесте)
- [ ] Удаление документа — только soft delete (status → 'revoked', не физическое удаление)
- [ ] При обновлении документа старый получает `status: 'superseded'` и `superseded_by_id`
- [ ] Тумблер онлайн/оффлайн работает независимо от статуса верификации
- [ ] BullMQ job `document-expiry-check` зарегистрирован в worker
- [ ] Все эндпоинты admin защищены middleware проверки роли `admin`
- [ ] Eden Treaty типы обновлены после изменения API

---

*ТЗ подготовлено для AltynBurgut Driver Card System v2.0 | Март 2026*
