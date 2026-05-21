export type MvpRoadmapTask = { id: string; title: string };
export type MvpRoadmapDay = { day: number; weekdayRu: string; tasks: MvpRoadmapTask[] };
export type MvpRoadmapWeek = { label: string; days: MvpRoadmapDay[] };
export type MvpRoadmapPhase = { id: string; title: string; badge: string; weeks: MvpRoadmapWeek[] };

/** Первый день плана в календаре (рабочий день; дальше только Пн–Пт, выходные пропускаются). */
export const MVP_ROADMAP_DAY1_ISO = '2026-03-12';

export const MVP_ROADMAP_PHASES: MvpRoadmapPhase[] = [
  {
    "id": "p1",
    "title": "Фаза 1 — Фундамент",
    "badge": "Неделя 1–2",
    "weeks": [
      {
        "label": "Неделя 1",
        "days": [
          {
            "day": 1,
            "weekdayRu": "Пн",
            "tasks": [
              {
                "id": "t-1-0",
                "title": "Создать monorepo структуру: packages/backend, packages/frontend, packages/shared"
              },
              {
                "id": "t-1-1",
                "title": "Настроить bun workspaces + tsconfig paths"
              },
              {
                "id": "t-1-2",
                "title": "Git init, .gitignore, README"
              }
            ]
          },
          {
            "day": 2,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-2-0",
                "title": "Docker Compose: PostgreSQL + PostGIS + Redis"
              },
              {
                "id": "t-2-1",
                "title": "Elysia.js базовый сервер, health check endpoint"
              },
              {
                "id": "t-2-2",
                "title": "Drizzle ORM подключение к БД, drizzle.config.ts"
              }
            ]
          },
          {
            "day": 3,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-3-0",
                "title": "Drizzle схема: таблица users (id, email, phone, role, name, createdAt)"
              },
              {
                "id": "t-3-1",
                "title": "Кастомная авторизация: sessions, verification_tokens, bcrypt"
              },
              {
                "id": "t-3-2",
                "title": "Роли: customer / carrier / dispatcher / admin — enum в схеме"
              }
            ]
          },
          {
            "day": 4,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-4-0",
                "title": "Регистрация по email + OTP-верификация (6-значный код на email)"
              },
              {
                "id": "t-4-1",
                "title": "Login / logout + forgot password + reset password"
              },
              {
                "id": "t-4-2",
                "title": "Middleware авторизации в Elysia (requireAuth, requireRole)"
              }
            ]
          },
          {
            "day": 5,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-5-0",
                "title": "Nuxt 3 setup: nuxt.config, layouts, composables/useAuth"
              },
              {
                "id": "t-5-1",
                "title": "$apiFetch composable с credentials:include + @elysiajs/eden"
              },
              {
                "id": "t-5-2",
                "title": "Страница /auth — единая форма: login, register, OTP, forgot password"
              }
            ]
          }
        ]
      },
      {
        "label": "Неделя 2",
        "days": [
          {
            "day": 6,
            "weekdayRu": "Пн",
            "tasks": [
              {
                "id": "t-6-0",
                "title": "Drizzle схема: carrier_profiles (vehicleType, capacity, bodyType, workZones)"
              },
              {
                "id": "t-6-1",
                "title": "Схема: customer_profiles (companyName, inn, address)"
              },
              {
                "id": "t-6-2",
                "title": "Миграции: bun run db:generate + db:migrate"
              }
            ]
          },
          {
            "day": 7,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-7-0",
                "title": "API: GET/PUT /cabinet/driver/profile — профиль водителя"
              },
              {
                "id": "t-7-1",
                "title": "API: GET/PUT /cabinet/client/profile — профиль клиента"
              },
              {
                "id": "t-7-2",
                "title": "lib/storage абстракция: local disk / Cloudflare R2 через Bun.S3Client"
              }
            ]
          },
          {
            "day": 8,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-8-0",
                "title": "Карточка водителя: схема driver_documents (passport, license, selfie, vehicle)"
              },
              {
                "id": "t-8-1",
                "title": "Upload документов в хранилище, сохранение путей в БД"
              },
              {
                "id": "t-8-2",
                "title": "Статусы документов: not_submitted / draft / submitted / verified / rejected"
              }
            ]
          },
          {
            "day": 9,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-9-0",
                "title": "Nuxt: /cabinet/driver/card — карточка водителя с документами"
              },
              {
                "id": "t-9-1",
                "title": "Nuxt: /cabinet/client/profile — профиль клиента"
              },
              {
                "id": "t-9-2",
                "title": "Компонент загрузки документов (drag&drop, превью, статус)"
              }
            ]
          },
          {
            "day": 10,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-10-0",
                "title": "Тест полного флоу: регистрация → OTP → заполнить профиль → загрузить документ"
              },
              {
                "id": "t-10-1",
                "title": "Валидация полей через Zod (Elysia t.Object) на бэке и фронте"
              },
              {
                "id": "t-10-2",
                "title": "i18n: подключить @nuxtjs/i18n, 3 языка (ru / en / tk)"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "p2",
    "title": "Фаза 2 — Заявки, доска, гео-поиск",
    "badge": "Неделя 3–5",
    "weeks": [
      {
        "label": "Неделя 3",
        "days": [
          {
            "day": 11,
            "weekdayRu": "Пн",
            "tasks": [
              {
                "id": "t-11-0",
                "title": "Drizzle схема: orders (id, customerId, fromCity, toCity, fromPoint/toPoint GEOMETRY)"
              },
              {
                "id": "t-11-1",
                "title": "PostGIS расширение: CREATE EXTENSION postgis + postgis типы в Drizzle"
              },
              {
                "id": "t-11-2",
                "title": "Поля заявки: cargoWeight, cargoVolume, bodyType, temperature, isDangerous"
              }
            ]
          },
          {
            "day": 12,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-12-0",
                "title": "Поля заявки: loadingDate, unloadingDate, price, priceType (fix/auction)"
              },
              {
                "id": "t-12-1",
                "title": "Enum статусов заявки: draft / published / in_progress / completed / cancelled"
              },
              {
                "id": "t-12-2",
                "title": "API: POST /cabinet/client/orders — создать заявку"
              }
            ]
          },
          {
            "day": 13,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-13-0",
                "title": "API: GET /orders — лента заявок с пагинацией и фильтрами"
              },
              {
                "id": "t-13-1",
                "title": "Фильтры: по дате, маршруту, типу кузова, цене, весу"
              },
              {
                "id": "t-13-2",
                "title": "API: GET /orders/:id — детали заявки (публичный)"
              }
            ]
          },
          {
            "day": 14,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-14-0",
                "title": "API: PUT /orders/:id — редактировать (только свою, только в статусе draft)"
              },
              {
                "id": "t-14-1",
                "title": "API: PATCH /orders/:id/cancel — отменить заявку"
              },
              {
                "id": "t-14-2",
                "title": "Nominatim геокодер: адрес → координаты при создании заявки (OSM)"
              }
            ]
          },
          {
            "day": 15,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-15-0",
                "title": "Nuxt: /cabinet/client/orders/create — форма заявки с картой Leaflet"
              },
              {
                "id": "t-15-1",
                "title": "useNominatim composable: автодополнение адресов по OpenStreetMap"
              },
              {
                "id": "t-15-2",
                "title": "Тест создания заявки end-to-end"
              }
            ]
          }
        ]
      },
      {
        "label": "Неделя 4",
        "days": [
          {
            "day": 16,
            "weekdayRu": "Пн",
            "tasks": [
              {
                "id": "t-16-0",
                "title": "Nuxt: /orders — доска заявок, карточки с основными данными"
              },
              {
                "id": "t-16-1",
                "title": "Компонент фильтров (дата, маршрут, тип кузова, цена)"
              },
              {
                "id": "t-16-2",
                "title": "Пагинация (cursor-based или offset)"
              }
            ]
          },
          {
            "day": 17,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-17-0",
                "title": "Nuxt: /cabinet/driver/orders/:id — детали заявки"
              },
              {
                "id": "t-17-1",
                "title": "Leaflet: маршрут и маркеры погрузки/разгрузки на карте"
              },
              {
                "id": "t-17-2",
                "title": "/cabinet/driver/orders — мои заявки (принятые водителем)"
              }
            ]
          },
          {
            "day": 18,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-18-0",
                "title": "Drizzle схема: order_responses (id, orderId, carrierId, price, comment, status)"
              },
              {
                "id": "t-18-1",
                "title": "API: POST /orders/:id/respond — перевозчик откликается на заявку"
              },
              {
                "id": "t-18-2",
                "title": "API: GET /orders/:id/responses — список откликов (только для заказчика)"
              }
            ]
          },
          {
            "day": 19,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-19-0",
                "title": "API: POST /orders/:id/confirm — заказчик выбирает перевозчика"
              },
              {
                "id": "t-19-1",
                "title": "Смена статуса заявки: published → in_progress после подтверждения"
              },
              {
                "id": "t-19-2",
                "title": "Nuxt: кнопка «Откликнуться» на карточке заявки (для перевозчика)"
              }
            ]
          },
          {
            "day": 20,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-20-0",
                "title": "Nuxt: список откликов в деталях заявки (для заказчика)"
              },
              {
                "id": "t-20-1",
                "title": "Кнопка «Выбрать перевозчика» — подтверждение сделки"
              },
              {
                "id": "t-20-2",
                "title": "Тест флоу: создать заявку → откликнуться → подтвердить"
              }
            ]
          }
        ]
      },
      {
        "label": "Неделя 5",
        "days": [
          {
            "day": 21,
            "weekdayRu": "Пн",
            "tasks": [
              {
                "id": "t-21-0",
                "title": "PostGIS: колонка current_location GEOMETRY(Point, 4326) в carrier_profiles"
              },
              {
                "id": "t-21-1",
                "title": "GIST индекс на current_location для быстрых гео-запросов"
              },
              {
                "id": "t-21-2",
                "title": "API: PUT /cabinet/driver/location — водитель обновляет свою позицию"
              }
            ]
          },
          {
            "day": 22,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-22-0",
                "title": "PostGIS запрос ST_DWithin: водители в радиусе X км от точки погрузки"
              },
              {
                "id": "t-22-1",
                "title": "API: GET /orders/:id/nearby-drivers?radius=50 — ближайшие свободные"
              },
              {
                "id": "t-22-2",
                "title": "Фильтр по совместимости: тип кузова заявки = тип кузова водителя"
              }
            ]
          },
          {
            "day": 23,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-23-0",
                "title": "PostGIS запрос: заявки в радиусе от текущей позиции водителя"
              },
              {
                "id": "t-23-1",
                "title": "Режим «Рядом со мной» с настраиваемым радиусом (10/25/50/100 км)"
              },
              {
                "id": "t-23-2",
                "title": "API: GET /cabinet/driver/orders-near — заявки рядом со мной по PostGIS"
              }
            ]
          },
          {
            "day": 24,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-24-0",
                "title": "BullMQ + Redis: очереди для фоновых задач"
              },
              {
                "id": "t-24-1",
                "title": "Job: при публикации заявки — найти подходящих водителей (PostGIS)"
              },
              {
                "id": "t-24-2",
                "title": "Resend email: OTP-верификация при регистрации + сброс пароля"
              }
            ]
          },
          {
            "day": 25,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-25-0",
                "title": "Admin-карта: Leaflet с live-позициями всех водителей (/admin/map)"
              },
              {
                "id": "t-25-1",
                "title": "Тест гео-поиска с реальными координатами"
              },
              {
                "id": "t-25-2",
                "title": "Admin-панель: верификация водителей, список заявок, управление пользователями"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "p3",
    "title": "Фаза 3 — Чат, трекинг, отзывы",
    "badge": "Неделя 6–8",
    "weeks": [
      {
        "label": "Неделя 6",
        "days": [
          {
            "day": 26,
            "weekdayRu": "Пн",
            "tasks": [
              {
                "id": "t-26-0",
                "title": "Drizzle схема: chats (id, orderId, customerId, carrierId)"
              },
              {
                "id": "t-26-1",
                "title": "Схема: messages (id, chatId, senderId, type, content, fileUrl, createdAt)"
              },
              {
                "id": "t-26-2",
                "title": "Чат создаётся автоматически при подтверждении заявки"
              }
            ]
          },
          {
            "day": 27,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-27-0",
                "title": "Elysia WebSocket: /ws/chat/:chatId — подключение к чату"
              },
              {
                "id": "t-27-1",
                "title": "Авторизация WebSocket через cookie-сессию"
              },
              {
                "id": "t-27-2",
                "title": "Broadcast сообщений через Redis pub/sub (cluster mode)"
              }
            ]
          },
          {
            "day": 28,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-28-0",
                "title": "API: GET /chats/:id/messages — история сообщений с пагинацией"
              },
              {
                "id": "t-28-1",
                "title": "Загрузка фото в чат: upload в хранилище, signed URL в сообщении"
              },
              {
                "id": "t-28-2",
                "title": "BullMQ job: email-алерт участнику при новом сообщении"
              }
            ]
          },
          {
            "day": 29,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-29-0",
                "title": "Nuxt: /cabinet/driver/chat и /cabinet/client/chat — интерфейс чата"
              },
              {
                "id": "t-29-1",
                "title": "useWebSocket composable: реалтайм через WebSocket"
              },
              {
                "id": "t-29-2",
                "title": "Отображение сообщений, аватарки, timestamp"
              }
            ]
          },
          {
            "day": 30,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-30-0",
                "title": "Загрузка фото прямо из чата (input[type=file])"
              },
              {
                "id": "t-30-1",
                "title": "Шаблоны быстрых сообщений: «Еду», «На месте», «Задерживаюсь»"
              },
              {
                "id": "t-30-2",
                "title": "Тест чата в реальном времени в двух окнах браузера"
              }
            ]
          }
        ]
      },
      {
        "label": "Неделя 7",
        "days": [
          {
            "day": 31,
            "weekdayRu": "Пн",
            "tasks": [
              {
                "id": "t-31-0",
                "title": "Enum статусов заказа: confirmed → loading → in_transit → unloading → completed"
              },
              {
                "id": "t-31-1",
                "title": "API: PUT /orders/:id/status — водитель меняет статус заказа"
              },
              {
                "id": "t-31-2",
                "title": "Лог смены статусов: order_status_log (orderId, status, changedAt, changedBy)"
              }
            ]
          },
          {
            "day": 32,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-32-0",
                "title": "BullMQ job: email заказчику при каждой смене статуса водителем"
              },
              {
                "id": "t-32-1",
                "title": "WebSocket broadcast нового статуса заказчику через канал заказа"
              },
              {
                "id": "t-32-2",
                "title": "API: GET /orders/:id/status-log — история смены статусов"
              }
            ]
          },
          {
            "day": 33,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-33-0",
                "title": "Система change_request: изменение карточки водителя через заявку на проверку"
              },
              {
                "id": "t-33-1",
                "title": "Схема: driver_change_requests (driverId, field, oldValue, newValue, status)"
              },
              {
                "id": "t-33-2",
                "title": "Admin API: одобрить / отклонить изменения карточки водителя"
              }
            ]
          },
          {
            "day": 34,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-34-0",
                "title": "Nuxt: трекинг этапов в деталях заказа ([id].vue) с прогресс-баром статусов"
              },
              {
                "id": "t-34-1",
                "title": "Визуальный прогресс-бар этапов: погрузка → в пути → разгрузка → завершено"
              },
              {
                "id": "t-34-2",
                "title": "Кнопки смены статуса в кабинете водителя"
              }
            ]
          },
          {
            "day": 35,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-35-0",
                "title": "История заказов: /cabinet/*/orders с фильтром по статусу"
              },
              {
                "id": "t-35-1",
                "title": "Просмотр лога смены статусов в деталях заказа (order_status_log)"
              },
              {
                "id": "t-35-2",
                "title": "Тест полного флоу от confirmed до completed"
              }
            ]
          }
        ]
      },
      {
        "label": "Неделя 8",
        "days": [
          {
            "day": 36,
            "weekdayRu": "Пн",
            "tasks": [
              {
                "id": "t-36-0",
                "title": "Drizzle схема: reviews (id, orderId, fromUserId, toUserId, rating 1–5, comment)"
              },
              {
                "id": "t-36-1",
                "title": "Ограничение: отзыв можно оставить только после статуса completed"
              },
              {
                "id": "t-36-2",
                "title": "Один отзыв на пользователя в рамках одного заказа (unique constraint)"
              }
            ]
          },
          {
            "day": 37,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-37-0",
                "title": "API: POST /orders/:id/review — оставить отзыв (заказчик ↔ водитель)"
              },
              {
                "id": "t-37-1",
                "title": "API: GET /users/:id/reviews — отзывы пользователя"
              },
              {
                "id": "t-37-2",
                "title": "Агрегация рейтинга: среднее + количество отображаются в профиле"
              }
            ]
          },
          {
            "day": 38,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-38-0",
                "title": "Nuxt: форма отзыва после завершения заказа (звёзды + текст)"
              },
              {
                "id": "t-38-1",
                "title": "Блок отзывов в профиле водителя (рейтинг + список отзывов)"
              },
              {
                "id": "t-38-2",
                "title": "BullMQ job: email-напоминание оставить отзыв через 2 часа после completed"
              }
            ]
          },
          {
            "day": 39,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-39-0",
                "title": "Сортировка доски заявок по рейтингу откликнувшихся водителей"
              },
              {
                "id": "t-39-1",
                "title": "Статистика в профиле: кол-во рейсов, средний рейтинг, % завершённых"
              },
              {
                "id": "t-39-2",
                "title": "Тест двустороннего отзыва (заказчик → водителю и водитель → заказчику)"
              }
            ]
          },
          {
            "day": 40,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-40-0",
                "title": "Финальный тест: регистрация → заявка → поиск → отклик → чат → трекинг → отзыв"
              },
              {
                "id": "t-40-1",
                "title": "Фикс критических багов фазы 3"
              },
              {
                "id": "t-40-2",
                "title": "Driver-services, driver-trailers, driver-citizenships: API + фронт"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "p4",
    "title": "Фаза 4 — Мобайл и запуск",
    "badge": "Неделя 9–10",
    "weeks": [
      {
        "label": "Неделя 9",
        "days": [
          {
            "day": 41,
            "weekdayRu": "Пн",
            "tasks": [
              {
                "id": "t-41-0",
                "title": "Capacitor init в Nuxt (capacitor.config.ts)"
              },
              {
                "id": "t-41-1",
                "title": "bun cap add android — добавить Android платформу"
              },
              {
                "id": "t-41-2",
                "title": "Первый APK-билд — проверить что открывается на эмуляторе"
              }
            ]
          },
          {
            "day": 42,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-42-0",
                "title": "@capacitor/geolocation: получить текущую позицию водителя"
              },
              {
                "id": "t-42-1",
                "title": "Фоновая отправка координат (watchPosition) в PUT /cabinet/driver/location"
              },
              {
                "id": "t-42-2",
                "title": "Mailing система: BullMQ + Resend + шаблоны email-рассылок (admin-mailing)"
              }
            ]
          },
          {
            "day": 43,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-43-0",
                "title": "Адаптивный UI: проверить все страницы на мобильном viewport (375px)"
              },
              {
                "id": "t-43-1",
                "title": "Bottom navigation bar для мобайла (Главная, Заявки, Чат, Профиль)"
              },
              {
                "id": "t-43-2",
                "title": "Touch-friendly: кнопки min 44px, iOS zoom fix на input, safe area"
              }
            ]
          },
          {
            "day": 44,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-44-0",
                "title": "@capacitor/camera: фото груза с камеры телефона при смене статуса"
              },
              {
                "id": "t-44-1",
                "title": "Тест на реальном Android устройстве (сборка + запуск)"
              },
              {
                "id": "t-44-2",
                "title": "Фикс мобильных багов (scroll, keyboard overlap, safe area insets)"
              }
            ]
          },
          {
            "day": 45,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-45-0",
                "title": "GitHub Actions CI/CD: push в master → SSH на VPS → deploy.sh"
              },
              {
                "id": "t-45-1",
                "title": "Деплой на Hostinger VPS — systemd сервисы backend + frontend"
              },
              {
                "id": "t-45-2",
                "title": "SSL через Let's Encrypt, домен через Cloudflare, nginx reverse proxy"
              }
            ]
          }
        ]
      },
      {
        "label": "Неделя 10",
        "days": [
          {
            "day": 46,
            "weekdayRu": "Пн",
            "tasks": [
              {
                "id": "t-46-0",
                "title": "Полное E2E тестирование: пройти весь цикл как заказчик (web)"
              },
              {
                "id": "t-46-1",
                "title": "Полное E2E тестирование: пройти весь цикл как водитель (web + mobile)"
              },
              {
                "id": "t-46-2",
                "title": "Список всех найденных багов, приоритизация"
              }
            ]
          },
          {
            "day": 47,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-47-0",
                "title": "Фикс критических багов из тестирования"
              },
              {
                "id": "t-47-1",
                "title": "Производительность: DB индексы, избежать N+1 запросов"
              },
              {
                "id": "t-47-2",
                "title": "Rate limiting на API через BullMQ + Redis (защита от спама)"
              }
            ]
          },
          {
            "day": 48,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-48-0",
                "title": "Android APK сборка для внутреннего тестирования (cap sync + Gradle)"
              },
              {
                "id": "t-48-1",
                "title": "Передать 2–3 реальным пользователям (перевозчик + заказчик)"
              },
              {
                "id": "t-48-2",
                "title": "Собрать первую обратную связь от beta-пользователей"
              }
            ]
          },
          {
            "day": 49,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-49-0",
                "title": "Фикс по фидбеку от beta-пользователей"
              },
              {
                "id": "t-49-1",
                "title": "Admin: roadmap-прогресс, impersonate пользователей, admin-dashboard, contacts"
              },
              {
                "id": "t-49-2",
                "title": "Legal pages: Privacy Policy + Terms of Service (/legal/[docType].vue)"
              }
            ]
          },
          {
            "day": 50,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-50-0",
                "title": "Отправка в Google Play (Internal Testing track)"
              },
              {
                "id": "t-50-1",
                "title": "Финальная проверка безопасности: env, открытые порты, CORS, rate limits"
              },
              {
                "id": "t-50-2",
                "title": "🚀 MVP запущен — первые реальные пользователи на продакшне"
              }
            ]
          }
        ]
      }
    ]
  }
] as const satisfies MvpRoadmapPhase[];

function addOneBusinessDayLocal(d: Date): void {
  d.setDate(d.getDate() + 1);
  let w = d.getDay();
  while (w === 0 || w === 6) {
    d.setDate(d.getDate() + 1);
    w = d.getDay();
  }
}

/** Календарная дата для дня плана (1..50): цепочка рабочих дней от {@link MVP_ROADMAP_DAY1_ISO} (локальный пояс). */
export function calendarDateForRoadmapDay(dayNum: number): Date {
  if (dayNum < 1 || dayNum > 50) {
    throw new RangeError('Roadmap day must be 1..50');
  }
  const [y, mo, d] = MVP_ROADMAP_DAY1_ISO.split('-').map(Number);
  const out = new Date(y, mo - 1, d, 12, 0, 0, 0);
  for (let n = 1; n < dayNum; n++) {
    addOneBusinessDayLocal(out);
  }
  return out;
}

export function formatRoadmapCalendarDate(dayNum: number, locale = 'ru-RU'): string {
  const d = calendarDateForRoadmapDay(dayNum);
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', weekday: 'short' });
}

export function allMvpRoadmapTaskIds(phasesList: MvpRoadmapPhase[]): string[] {
  const ids: string[] = [];
  for (const p of phasesList) {
    for (const w of p.weeks) {
      for (const day of w.days) {
        for (const t of day.tasks) ids.push(t.id);
      }
    }
  }
  return ids;
}

export const MVP_ROADMAP_TOTAL_TASKS = 150;
