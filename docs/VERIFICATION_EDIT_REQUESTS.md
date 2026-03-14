# Верификация и запросы на изменение полей

Документация фичи «запрос на изменение» для профилей с верификацией. Используется в карточке водителя; при создании других типов пользователей с верифицируемыми профилями — применять по аналогии.

---

## 1. Обзор

**Проблема:** После отправки карточки на верификацию поля блокируются. Водитель не может менять данные без участия админа.

**Решение:**
1. Водитель нажимает «Запрос на изменение» у нужного поля (или «+ Добавить» для мультиполей).
2. Админ видит запросы во вкладке «5. Запросы» и текущее значение поля.
3. Админ нажимает «Разрешить» → поле разблокируется.
4. Водитель редактирует и сохраняет.

**Статусы верификации:**
- `not_verified` — черновик, всё редактируется
- `waiting_verification` — отправлено, поля заблокированы
- `verified` — проверено, поля заблокированы
- `request` — есть pending-запросы на изменение

---

## 2. Схема БД

### carrier_profiles (или аналог для другого типа)

```sql
verification_status  varchar  -- not_verified | waiting_verification | verified | request
unlocked_fields     jsonb    -- ['phone_0', 'surname', 'citizenship_add'] — разблокированные поля
```

### profile_edit_requests (или {entity}_edit_requests)

```sql
id           uuid PRIMARY KEY
carrier_id   uuid REFERENCES carrier_profiles(id)  -- или profile_id для другого типа
field_key    varchar(80)   -- surname, phone_0, citizenship_add
status       varchar(20)   -- pending | approved | rejected
driver_comment text        -- комментарий водителя
field_value  text          -- значение на момент запроса (что меняют/удаляют/добавляют)
requested_at timestamp
resolved_at  timestamp
resolved_by_id text        -- кто одобрил (admin)
```

**Ключи полей для мультиполей:**
- `phone_0`, `phone_1` — конкретная строка
- `phone_add` — добавление новой строки
- Аналогично: `citizenship_0`, `citizenship_add`, `additional_emails_0`, `additional_emails_add`

**Комбинированные поля (один запрос → разблокировка нескольких):**
- `passport_series_number` — серия и номер паспорта (разблокирует оба)

---

## 3. API

### Кабинет пользователя (driver)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/cabinet/driver/profile/submit-for-verification` | Отправить на верификацию, `verification_status` → `waiting_verification` |
| POST | `/cabinet/driver/profile/change-request` | Создать запрос. Body: `{ field_key, comment?, requested_value? }` |
| PATCH | `/cabinet/driver/profile` | Сохранение. При locked — только поля из `unlocked_fields` |
| GET | `/cabinet/driver/profile/edit-requests` | Список запросов с `field_value` |

### Админка

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/admin/users/:id/edit-requests` | Список запросов с `field_value` |
| POST | `/admin/users/:id/edit-requests/:requestId/approve` | Одобрить → добавить `field_key` в `unlocked_fields` |

### Логика PATCH при locked

Для мультиполей (`phone`, `citizenship`, `additional_emails`):
- Слияние по индексам: `phone_0` в unlocked → можно менять первый элемент
- `phone_add` в unlocked → можно добавлять новые элементы
- Новые строки (после одобрения add) редактируются без отдельного запроса

---

## 4. Frontend

### Компонент формы (DriverCardForm.vue)

**Props:**
- `isDriverContext` — true в кабинете водителя, false в админке
- `loadUrl`, `saveUrl`, `apiBase`

**Ключевые функции:**
- `isFieldEditable(fieldKey, index?)` — проверка `unlocked_fields` и `*_add`
- `isAddEditable(fieldKey)` — проверка `{field}_add` или `{field}`
- `showRequestBtn(fieldKey, index?)` — показать «Запрос» (driver, locked, не unlocked)
- `showApproveBtn(fieldKey, index?)` — показать «Разрешить» (admin, pending)
- Для новых строк (index >= originalCount) при `*_add` unlocked — редактируемы без запроса

**Модалка для add:**
- При запросе на `*_add` — диалог «Что хотите добавить?»
- `requested_value` уходит в API и сохраняется в `field_value`

### Вкладка «Запросы» (только для админа)

- Список `editRequests` с `field_value`
- Кнопка «Разрешить» для pending

---

## 5. Как применить к другому типу пользователя

### Шаги

1. **Профиль**
   - Добавить в таблицу профиля: `verification_status`, `unlocked_fields`.

2. **Таблица запросов**
   - Создать `{entity}_edit_requests` (или переиспользовать `profile_edit_requests` с `profile_type`).
   - Поля: `field_key`, `status`, `field_value`, `resolved_by_id`.

3. **Backend**
   - Список `EDITABLE_FIELD_KEYS` для нового профиля.
   - Для мультиполей: `MULTI_FIELD_BASES`, `mergeMultiValue`, `isValidFieldKey`.
   - Роуты: `change-request`, `edit-requests`, `approve`.

4. **Frontend**
   - Форма с `isDriverContext` (или `isOwnerContext`).
   - Кнопки «Запрос» / «Разрешить» у полей.
   - Вкладка «Запросы» в админке.
   - Модалка для `*_add` с `requested_value`.

5. **Миграции**
   - Добавить колонки и таблицу через Drizzle.

**Паспортная вкладка (все поля с запросом):**
- `passport_series_number` — серия и номер (один запрос)
- `passport_issue_date`, `passport_expiry_date`, `passport_issued_by`
- `place_of_birth`, `residential_address`, `passport_scan_url`

### Чеклист для нового типа

- [ ] `verification_status`, `unlocked_fields` в профиле
- [ ] Таблица edit_requests
- [ ] POST change-request с сохранением `field_value`
- [ ] PATCH с merge для мультиполей
- [ ] GET edit-requests, POST approve
- [ ] Форма с per-field/per-row request/approve
- [ ] Вкладка «Запросы» для админа
- [ ] Модалка «Что добавить?» для `*_add`

---

## 6. Файлы в проекте

| Компонент | Путь |
|-----------|------|
| Схема | `packages/backend/src/db/schema.ts` — carrierProfiles, profileEditRequests |
| Cabinet API | `packages/backend/src/routes/cabinet/driver-profile.ts` |
| Admin API | `packages/backend/src/routes/admin/users.ts` |
| Форма | `packages/frontend/components/driver/DriverCardForm.vue` |
| Миграции | `packages/backend/drizzle/0013_*.sql`, `0014_*.sql` |
