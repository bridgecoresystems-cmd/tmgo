# ТЗ: Регистрация тягача в кабинете водителя

**Проект:** AltynBurgut  
**Модуль:** Кабинет водителя → Транспорт → Добавить тягач  
**Стек:** Elysia.js · Drizzle ORM · PostgreSQL · Nuxt 3 · Naive UI · i18n (ru/en/tk)

---

## 1. Контекст и состояние проекта

### 1.1 Что уже существует

- Таблица `driver_vehicles` в БД (миграция `0017_driver_card_v2_tables.sql`) с полями:
  `id`, `carrier_id`, `plate_number`, `vehicle_type`, `brand`, `model`, `year`, `ownership`, `assigned_from`, `assigned_until`, `is_active`, `created_at`
- Роуты `packages/backend/src/routes/cabinet/driver-vehicles.ts` — `GET /cabinet/driver/vehicles` и `POST /cabinet/driver/vehicles` (устаревшие, нужно расширить)
- Страница-список `packages/frontend/pages/cabinet/driver/vehicles/index.vue` — отображает список
- Страница-заглушка `packages/frontend/pages/cabinet/driver/vehicles/[id].vue` — показывает `<n-empty />`
- Страница создания **отсутствует**: `packages/frontend/pages/cabinet/driver/vehicles/create.vue` — нужно создать
- Shared-пакет `packages/shared/` — экспортирует типы из `index.ts`

### 1.2 Новые файлы в `packages/shared/`

В папке `packages/shared/` уже лежат (добавлены вручную):

```
packages/shared/vehicle-types.ts        — VEHICLE_TYPES, VehicleTypeId, vehicleTypeIds
packages/shared/chassis-types.ts        — CHASSIS_TYPES, ChassisTypeId, chassisTypeIds
packages/shared/axle-configs.ts         — AXLE_CONFIGS, AxleConfigId, axleConfigIds
packages/shared/vehicle-makes-seed.ts   — VEHICLE_MAKES_SEED (50 марок, ~162 модели)
```

Необходимо:
1. Добавить эти файлы в экспорт `packages/shared/index.ts`
2. Использовать их в бэкенде и фронтенде

---

## 2. Задача

Реализовать полный цикл регистрации **тягача** (тип ТС = `tractor_unit` или `semi_truck`) в кабинете водителя. Включает:

- Новую миграцию Drizzle расширяющую `driver_vehicles`
- Справочные таблицы `vehicle_makes` и `vehicle_models` с seed
- API эндпоинты (Elysia.js)
- Страницу создания `/cabinet/driver/vehicles/create` (Nuxt 3 + Naive UI)
- Страницу просмотра/редактирования `/cabinet/driver/vehicles/[id]` (заменить заглушку)
- Обновление i18n ключей (ru.json / en.json)

---

## 3. Поля формы (по ТЗ из таблицы на фото)

| № | Поле | Тип поля (UI) | Обяз. | Назначение |
|---|------|---------------|-------|-----------|
| 1 | VIN номер | `n-input` с маской 17 симв. | да | Идентификатор ТС |
| 2 | Тип ТС | `n-select` (из `VEHICLE_TYPES`) | да | Классификация |
| — | Тип шасси | `n-select` (из `CHASSIS_TYPES`) | нет | Конструктив |
| 3 | Марка | `n-select` каскадный (из `vehicle_makes`) | да | Идентификация |
| 4 | Модель | `n-select` каскадный (зависит от марки) | да | Спецификация |
| 5 | Год выпуска | `n-input-number` (1950–текущий) | нет | Тех. состояние |
| 6 | Номер шасси | `n-input` | нет | Доп. идентификация |
| 7 | Цвет | `n-color-picker` или `n-select` (список цветов) | да | Визуальная ID |
| 8 | Госномер | `n-input` с валидацией | да | Регистрация |
| 9 | Год выпуска (повтор) | — | нет | Из п.5, не дублировать |
| 10 | Грузоподъёмность | `n-input-number` + суффикс «т» | да | Расчёт рейсов |
| 11 | Наличие GPS/ГЛОНАСС | `n-switch` | нет | Отслеживание |
| 12 | Страхование | вложенный блок: номер полиса + `n-date-picker` до даты | нет | Безопасность |

**Дополнительные поля (тягач-специфика):**

| Поле | Тип поля | Обяз. |
|------|----------|-------|
| Колёсная формула | `n-select` (из `AXLE_CONFIGS`) | нет |
| Владение ТС | `n-radio-group` (own / company / leased) | нет |
| Тип топлива | `n-select` (дизель / LPG / LNG / электро) | нет |
| Объём двигателя (л) | `n-input-number` | нет |
| Мощность (л.с.) | `n-input-number` | нет |
| Объём топливного бака 1 (л) | `n-input-number` | нет |
| Объём топливного бака 2 (л) | `n-input-number` | нет |
| Тип КПП | `n-select` (механика / автомат / роботизированная) | нет |
| Экологический класс | `n-select` (Euro 3 / Euro 4 / Euro 5 / Euro 6) | нет |
| Расход топлива (л/100 км) | `n-input-number` | нет |
| Грузоподъёмность сцепного устройства (кг) | `n-input-number` | нет |
| Макс. допустимая масса (т) | `n-input-number` | нет |

---

## 4. База данных

### 4.1 Новая миграция: расширить `driver_vehicles`

Создать новый файл миграции `packages/backend/drizzle/0018_driver_vehicles_extended.sql`:

```sql
-- Расширение driver_vehicles для тягача

-- Новые enum'ы
DO $$ BEGIN
  CREATE TYPE "fuel_type" AS ENUM ('diesel', 'lpg', 'lng', 'electric', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "transmission_type" AS ENUM ('manual', 'automatic', 'robotized');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "euro_class" AS ENUM ('euro3', 'euro4', 'euro5', 'euro6');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Добавить колонки в driver_vehicles
ALTER TABLE "driver_vehicles"
  ADD COLUMN IF NOT EXISTS "vin"                    varchar(17),
  ADD COLUMN IF NOT EXISTS "chassis_number"         text,
  ADD COLUMN IF NOT EXISTS "chassis_type"           text,       -- ChassisTypeId
  ADD COLUMN IF NOT EXISTS "axle_config"            text,       -- AxleConfigId
  ADD COLUMN IF NOT EXISTS "color"                  text,
  ADD COLUMN IF NOT EXISTS "capacity_tons"          numeric(6,2),
  ADD COLUMN IF NOT EXISTS "has_gps"                boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "insurance_policy_num"   text,
  ADD COLUMN IF NOT EXISTS "insurance_expires_at"   timestamp,
  ADD COLUMN IF NOT EXISTS "fuel_type"              "fuel_type",
  ADD COLUMN IF NOT EXISTS "engine_volume_l"        numeric(4,1),
  ADD COLUMN IF NOT EXISTS "power_hp"               integer,
  ADD COLUMN IF NOT EXISTS "fuel_tank_1_l"          integer,
  ADD COLUMN IF NOT EXISTS "fuel_tank_2_l"          integer,
  ADD COLUMN IF NOT EXISTS "transmission"           "transmission_type",
  ADD COLUMN IF NOT EXISTS "euro_class"             "euro_class",
  ADD COLUMN IF NOT EXISTS "fuel_consumption_per_100km" numeric(5,1),
  ADD COLUMN IF NOT EXISTS "fifth_wheel_capacity_kg" integer,
  ADD COLUMN IF NOT EXISTS "max_gross_weight_t"     numeric(6,2),
  ADD COLUMN IF NOT EXISTS "make_id"                uuid REFERENCES "vehicle_makes"("id"),
  ADD COLUMN IF NOT EXISTS "model_id"               uuid REFERENCES "vehicle_models"("id"),
  ADD COLUMN IF NOT EXISTS "custom_make"            text,  -- если марки нет в справочнике
  ADD COLUMN IF NOT EXISTS "custom_model"           text;  -- если модели нет в справочнике
```

### 4.2 Новые справочные таблицы

Создать миграцию `packages/backend/drizzle/0018_vehicle_makes_models.sql`:

```sql
CREATE TABLE IF NOT EXISTS "vehicle_makes" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name"         varchar(100) NOT NULL,
  "slug"         varchar(100) NOT NULL UNIQUE,
  "country_code" varchar(2),
  "is_custom"    boolean DEFAULT false NOT NULL,
  "is_active"    boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "vehicle_models" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "make_id"           uuid NOT NULL REFERENCES "vehicle_makes"("id"),
  "name"              varchar(100) NOT NULL,
  "slug"              varchar(100) NOT NULL,
  "compatible_types"  text[] DEFAULT '{}',
  "is_custom"         boolean DEFAULT false NOT NULL,
  "is_active"         boolean DEFAULT true NOT NULL
);
```

### 4.3 Drizzle schema (`packages/backend/src/db/schema.ts`)

Добавить в конец существующего `schema.ts`:

```typescript
// ── Справочник марок ──────────────────────────────────────────────
export const vehicleMakes = pgTable('vehicle_makes', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 100 }).notNull(),
  slug:        varchar('slug', { length: 100 }).notNull().unique(),
  countryCode: varchar('country_code', { length: 2 }),
  isCustom:    boolean('is_custom').default(false).notNull(),
  isActive:    boolean('is_active').default(true).notNull(),
})

// ── Справочник моделей ────────────────────────────────────────────
export const vehicleModels = pgTable('vehicle_models', {
  id:              uuid('id').primaryKey().defaultRandom(),
  makeId:          uuid('make_id').references(() => vehicleMakes.id).notNull(),
  name:            varchar('name', { length: 100 }).notNull(),
  slug:            varchar('slug', { length: 100 }).notNull(),
  compatibleTypes: text('compatible_types').array().notNull().default([]),
  isCustom:        boolean('is_custom').default(false).notNull(),
  isActive:        boolean('is_active').default(true).notNull(),
})
```

Также добавить новые enum'ы и расширить `driverVehicles`:

```typescript
export const fuelTypeEnum       = pgEnum('fuel_type',        ['diesel','lpg','lng','electric','hybrid'])
export const transmissionEnum   = pgEnum('transmission_type',['manual','automatic','robotized'])
export const euroClassEnum      = pgEnum('euro_class',       ['euro3','euro4','euro5','euro6'])

// В driverVehicles добавить новые поля (дополнить существующую таблицу):
// vin, chassisNumber, chassisType, axleConfig, color, capacityTons,
// hasGps, insurancePolicyNum, insuranceExpiresAt,
// fuelType, engineVolumeL, powerHp, fuelTank1L, fuelTank2L,
// transmission, euroClass, fuelConsumptionPer100km,
// fifthWheelCapacityKg, maxGrossWeightT,
// makeId (→ vehicleMakes), modelId (→ vehicleModels),
// customMake, customModel
```

### 4.4 Seed справочника марок

Создать `packages/backend/src/db/seeds/seed-vehicle-makes.ts`:

```typescript
import { db } from '../index'
import { vehicleMakes, vehicleModels } from '../schema'
import { VEHICLE_MAKES_SEED } from '@tmgo/shared'

export async function seedVehicleMakes() {
  for (const make of VEHICLE_MAKES_SEED) {
    const [inserted] = await db
      .insert(vehicleMakes)
      .values({ name: make.name, slug: make.slug, countryCode: make.countryCode })
      .onConflictDoNothing()
      .returning()
    if (!inserted) continue
    for (const model of make.models) {
      await db.insert(vehicleModels).values({
        makeId: inserted.id,
        name: model.name,
        slug: model.slug,
        compatibleTypes: [...model.compatibleTypes],
      }).onConflictDoNothing()
    }
  }
  console.log('vehicle makes/models seeded')
}
```

Запустить один раз: `bun run packages/backend/src/db/seeds/seed-vehicle-makes.ts`

---

## 5. Backend API (Elysia.js)

Файл: `packages/backend/src/routes/cabinet/driver-vehicles.ts`

Полностью переписать (не создавать новый файл). Реализовать следующие эндпоинты:

### 5.1 `GET /cabinet/driver/vehicles`
Возвращает список ТС водителя (только `is_active = true`).  
Response: массив объектов с полями: `id, plateNumber, vehicleType, brand, model, year, isActive`.

### 5.2 `POST /cabinet/driver/vehicles`
Создаёт новое ТС. Body — все поля формы из раздела 3.

**Валидация через Elysia `t.Object()`:**
- `plateNumber`: string, обязательно, minLength(2), maxLength(20)
- `vehicleType`: один из `vehicleTypeIds` из `@tmgo/shared`
- `vin`: optional string, длина 17 символов если указан (regex: `/^[A-HJ-NPR-Z0-9]{17}$/i`)
- `capacityTons`: optional number, min(0.1), max(200)
- `makeId`: optional uuid
- `modelId`: optional uuid
- `customMake`: optional string (если makeId не указан)
- `customModel`: optional string (если modelId не указан)
- `chassisType`: optional, один из `chassisTypeIds`
- `axleConfig`: optional, один из `axleConfigIds`
- Остальные поля — optional

Response: созданный объект с `id`.

### 5.3 `GET /cabinet/driver/vehicles/:id`
Возвращает полную карточку ТС по `id`. Проверить что `carrier_id` принадлежит текущему водителю.

### 5.4 `PATCH /cabinet/driver/vehicles/:id`
Обновить поля ТС. Те же правила валидации что в POST, все поля optional.

### 5.5 `DELETE /cabinet/driver/vehicles/:id`
Soft delete: установить `is_active = false, assigned_until = now()`.

### 5.6 `GET /cabinet/driver/vehicles/makes`
Список всех марок (`is_active = true`). Response: `{ id, name, slug, countryCode }[]`

### 5.7 `GET /cabinet/driver/vehicles/makes/:makeId/models`
Список моделей для марки. Query param `vehicleType?: string` — фильтровать по `compatible_types`.
Response: `{ id, name, slug, compatibleTypes }[]`

---

## 6. Shared пакет — обновить `index.ts`

Файл `packages/shared/index.ts` — добавить экспорты:

```typescript
export * from './vehicle-types'
export * from './chassis-types'
export * from './axle-configs'
export * from './vehicle-makes-seed'
```

---

## 7. Frontend (Nuxt 3 + Naive UI)

### 7.1 Создать страницу `/cabinet/driver/vehicles/create`

Файл: `packages/frontend/pages/cabinet/driver/vehicles/create.vue`

```
definePageMeta({ layout: 'cabinet-driver', middleware: 'cabinet-auth' })
```

**Структура страницы:**

```
← Назад к списку

[Заголовок: "Добавить тягач"]

┌─ Раздел 1: Основная информация ──────────────────────────────┐
│  Тип ТС*          [n-select из VEHICLE_TYPES]                │
│  Тип шасси        [n-select из CHASSIS_TYPES]                │
│  Марка*           [n-select каскадный → загружает модели]    │
│  Модель*          [n-select зависит от марки]                │
│  Год выпуска      [n-input-number 1950–2025]                 │
│  Цвет*            [n-select список цветов]                   │
└───────────────────────────────────────────────────────────────┘

┌─ Раздел 2: Регистрация ───────────────────────────────────────┐
│  VIN номер*       [n-input маска 17 символов]                │
│  Номер шасси      [n-input]                                   │
│  Госномер*        [n-input]                                   │
│  Грузоподъёмность* [n-input-number суффикс "т"]              │
│  GPS/ГЛОНАСС      [n-switch]                                  │
└───────────────────────────────────────────────────────────────┘

┌─ Раздел 3: Страхование (опционально) ────────────────────────┐
│  Номер полиса     [n-input]                                   │
│  Действует до     [n-date-picker]                             │
└───────────────────────────────────────────────────────────────┘

┌─ Раздел 4: Технические параметры (опционально) ──────────────┐
│  Колёсная формула [n-select из AXLE_CONFIGS]                 │
│  Владение ТС      [n-radio-group: own/company/leased]        │
│  Тип топлива      [n-select: diesel/lpg/lng/electric/hybrid] │
│  Объём двигателя  [n-input-number] л                         │
│  Мощность         [n-input-number] л.с.                      │
│  Топливный бак 1  [n-input-number] л                         │
│  Топливный бак 2  [n-input-number] л                         │
│  КПП              [n-select: manual/automatic/robotized]     │
│  Экологический класс [n-select: Euro 3–6]                   │
│  Расход л/100 км  [n-input-number]                           │
│  Сцепное уст-во   [n-input-number] кг                        │
│  Макс. масса      [n-input-number] т                         │
└───────────────────────────────────────────────────────────────┘

[Кнопка: Сохранить]   [Кнопка: Отмена]
```

**Логика каскадного выбора Марка → Модель:**
```typescript
// При изменении make — сбросить model и загрузить список моделей
watch(selectedMakeId, async (makeId) => {
  form.modelId = null
  if (!makeId) { modelOptions.value = []; return }
  const models = await $fetch(`${API}/cabinet/driver/vehicles/makes/${makeId}/models`, {
    query: { vehicleType: form.vehicleType },
    credentials: 'include'
  })
  modelOptions.value = models.map(m => ({ label: m.name, value: m.id }))
})
```

**Логика "кастомная марка/модель":**
- Если пользователь не нашёл марку — показать ссылку "Нет нужной марки? Введите вручную"
- При клике — скрыть селект марки, показать `n-input` для `customMake`
- То же для модели

**После успешного сохранения:**
```typescript
navigateTo('/cabinet/driver/vehicles')
message.success(t('driver.vehicles.added'))
```

### 7.2 Обновить страницу `/cabinet/driver/vehicles/[id]`

Файл: `packages/frontend/pages/cabinet/driver/vehicles/[id].vue`

Заменить заглушку на полноценную карточку просмотра + редактирования:

- Загружать данные через `GET /cabinet/driver/vehicles/:id`
- Отображать все поля в режиме просмотра (read-only `n-descriptions`)
- Кнопка "Редактировать" — переключает в режим формы (те же поля что в create)
- Кнопка "Деактивировать" — soft delete, с `n-popconfirm` подтверждением
- Кнопка "← Назад" — `navigateTo('/cabinet/driver/vehicles')`

### 7.3 Обновить список `/cabinet/driver/vehicles/index.vue`

Обновить колонки таблицы с учётом новых полей:

```typescript
const columns = [
  { title: t('driver.vehicles.type'),        key: 'vehicleType', width: 140 },
  { title: t('driver.vehicles.brand'),       key: 'brand',       width: 120 },
  { title: t('driver.vehicles.model'),       key: 'model',       width: 120 },
  { title: t('driver.vehicles.plateNumber'), key: 'plateNumber'               },
  { title: t('driver.vehicles.capacity'),    key: 'capacityTons', width: 120 },
  { title: t('driver.vehicles.year'),        key: 'year',         width: 80  },
]
```

---

## 8. i18n ключи

Добавить в `packages/frontend/locales/ru.json` → секция `driver.vehicles`:

```json
"vehicles": {
  "title": "Мой транспорт",
  "addTitle": "Добавить транспорт",
  "addTractor": "Добавить тягач",
  "vehicleTitle": "Транспорт",
  "plateNumber": "Госномер",
  "vin": "VIN номер",
  "vinHint": "17 символов, латиница и цифры",
  "chassisNumber": "Номер шасси",
  "type": "Тип ТС",
  "chassisType": "Тип шасси",
  "brand": "Марка",
  "model": "Модель",
  "year": "Год выпуска",
  "color": "Цвет",
  "capacity": "Грузоподъёмность",
  "capacityTons": "Грузоподъёмность (т)",
  "hasGps": "GPS/ГЛОНАСС",
  "insurance": "Страхование",
  "insurancePolicyNum": "Номер полиса",
  "insuranceExpiresAt": "Страховка действует до",
  "axleConfig": "Колёсная формула",
  "ownership": "Владение ТС",
  "ownershipOwn": "Личное",
  "ownershipCompany": "Компания",
  "ownershipLeased": "Аренда",
  "fuelType": "Тип топлива",
  "engineVolumeL": "Объём двигателя (л)",
  "powerHp": "Мощность (л.с.)",
  "fuelTank1L": "Топливный бак 1 (л)",
  "fuelTank2L": "Топливный бак 2 (л)",
  "transmission": "КПП",
  "transmissionManual": "Механика",
  "transmissionAutomatic": "Автомат",
  "transmissionRobotized": "Роботизированная",
  "euroClass": "Экологический класс",
  "fuelConsumption": "Расход (л/100 км)",
  "fifthWheelCapacity": "Сцепное устройство (кг)",
  "maxGrossWeight": "Макс. масса (т)",
  "customMakeHint": "Нет нужной марки? Введите вручную",
  "customModelHint": "Нет нужной модели? Введите вручную",
  "backToSelect": "Выбрать из справочника",
  "sectionBasic": "Основная информация",
  "sectionRegistration": "Регистрация",
  "sectionInsurance": "Страхование",
  "sectionTechnical": "Технические параметры",
  "added": "Транспорт добавлен",
  "saved": "Транспорт сохранён",
  "deactivated": "Транспорт деактивирован",
  "deactivateConfirm": "Деактивировать этот транспорт?",
  "editMode": "Редактировать",
  "viewMode": "Просмотр",
  "notFound": "Транспорт не найден"
}
```

Аналогичные ключи добавить в `en.json` (на английском).

---

## 9. Цвета для поля "Цвет ТС"

Использовать фиксированный список (не color picker — водители выбирают из стандартного списка):

```typescript
export const VEHICLE_COLORS = [
  { id: 'white',       label: 'Белый',        labelEn: 'White'      },
  { id: 'black',       label: 'Чёрный',       labelEn: 'Black'      },
  { id: 'silver',      label: 'Серебристый',  labelEn: 'Silver'     },
  { id: 'gray',        label: 'Серый',        labelEn: 'Gray'       },
  { id: 'red',         label: 'Красный',       labelEn: 'Red'       },
  { id: 'blue',        label: 'Синий',         labelEn: 'Blue'      },
  { id: 'green',       label: 'Зелёный',       labelEn: 'Green'     },
  { id: 'yellow',      label: 'Жёлтый',        labelEn: 'Yellow'    },
  { id: 'orange',      label: 'Оранжевый',     labelEn: 'Orange'    },
  { id: 'brown',       label: 'Коричневый',    labelEn: 'Brown'     },
  { id: 'beige',       label: 'Бежевый',       labelEn: 'Beige'     },
  { id: 'other',       label: 'Другой',        labelEn: 'Other'     },
] as const
```

Добавить в `packages/shared/vehicle-colors.ts` и экспортировать из `index.ts`.

---

## 10. Порядок выполнения (для Claude Code)

1. **Shared пакет** — создать `vehicle-colors.ts`, обновить `index.ts` (добавить все новые экспорты)
2. **Миграции** — создать `0018_vehicle_makes_models.sql` и `0018_driver_vehicles_extended.sql`
3. **Schema.ts** — добавить `vehicleMakes`, `vehicleModels`, новые enum'ы, расширить `driverVehicles`
4. **Seed** — создать и запустить `seed-vehicle-makes.ts`
5. **API роуты** — переписать `driver-vehicles.ts` с новыми эндпоинтами (5.1–5.7)
6. **i18n** — обновить `ru.json` и `en.json`
7. **Frontend create.vue** — создать страницу создания тягача
8. **Frontend [id].vue** — заменить заглушку на карточку просмотра/редактирования
9. **Frontend index.vue** — обновить колонки таблицы

---

## 11. Важные правила проекта

- **Данные не удаляются физически** — только soft delete (`is_active = false`)
- **Конфликт onConflictDoNothing** — при seed'е марок/моделей
- **Авторизация** — все эндпоинты проверяют через `getUserFromRequest`, роль `driver`
- **carrier_id** — получать через `carrierProfiles` по `user.id`, не из body запроса
- **Валидация** — использовать `t.Object()` Elysia на всех POST/PATCH
- **Типы из shared** — использовать `vehicleTypeIds`, `chassisTypeIds`, `axleConfigIds` для enum значений в Elysia `t.Union(t.Literal(...))` или через `t.Enum`
- **Naive UI** — использовать только Naive UI компоненты (не другие UI библиотеки)
- **i18n** — все строки через `t('...')`, не хардкодить текст
- **Загрузка марок** — при маунте страницы create загрузить список марок один раз и кешировать в `ref`