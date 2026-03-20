export type MvpRoadmapTask = { id: string; title: string };
export type MvpRoadmapDay = { day: number; weekdayRu: string; tasks: MvpRoadmapTask[] };
export type MvpRoadmapWeek = { label: string; days: MvpRoadmapDay[] };
export type MvpRoadmapPhase = { id: string; title: string; badge: string; weeks: MvpRoadmapWeek[] };

/** Понедельник недели «День 1» плана (12 марта 2026 — четверг той же недели). */
export const MVP_ROADMAP_FIRST_MONDAY_ISO = '2026-03-10';

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
                "title": "Создать monorepo структуру: apps/backend, apps/web, packages/shared"
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
                "title": "Better Auth установка и конфигурация"
              },
              {
                "id": "t-3-2",
                "title": "Роли: customer / carrier / dispatcher — enum в схеме"
              }
            ]
          },
          {
            "day": 4,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-4-0",
                "title": "Регистрация по email + телефону (OTP или пароль)"
              },
              {
                "id": "t-4-1",
                "title": "Login / logout / refresh token"
              },
              {
                "id": "t-4-2",
                "title": "Middleware авторизации в Elysia"
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
                "title": "Eden Treaty подключение к backend"
              },
              {
                "id": "t-5-2",
                "title": "Страницы: /login, /register — базовые формы"
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
                "title": "Схема: customer_profiles (companyName, requisites)"
              },
              {
                "id": "t-6-2",
                "title": "Миграция drizzle-kit generate + migrate"
              }
            ]
          },
          {
            "day": 7,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-7-0",
                "title": "API: GET/PUT /profile/carrier — получить и обновить профиль"
              },
              {
                "id": "t-7-1",
                "title": "API: GET/PUT /profile/customer"
              },
              {
                "id": "t-7-2",
                "title": "Cloudflare R2 подключение (загрузка фото профиля)"
              }
            ]
          },
          {
            "day": 8,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-8-0",
                "title": "Карточка водителя: схема driver_documents (passport, license)"
              },
              {
                "id": "t-8-1",
                "title": "Upload документов в R2, сохранение ссылок в БД"
              },
              {
                "id": "t-8-2",
                "title": "Статусы документов: not_submitted / draft / submitted / verified"
              }
            ]
          },
          {
            "day": 9,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-9-0",
                "title": "Nuxt: страница /profile/carrier — форма заполнения профиля"
              },
              {
                "id": "t-9-1",
                "title": "Nuxt: страница /profile/customer"
              },
              {
                "id": "t-9-2",
                "title": "Компонент загрузки документов (drag&drop или input)"
              }
            ]
          },
          {
            "day": 10,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-10-0",
                "title": "Тест полного флоу: регистрация → заполнить профиль → загрузить документ"
              },
              {
                "id": "t-10-1",
                "title": "Фикс багов, валидация полей (Zod или Valibot)"
              },
              {
                "id": "t-10-2",
                "title": "Буфер: доделать всё незавершённое из недели 1"
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
                "title": "Drizzle схема: orders (id, customerId, fromCity, toCity, fromPoint GEOMETRY, toPoint GEOMETRY, distance)"
              },
              {
                "id": "t-11-1",
                "title": "PostGIS расширение: CREATE EXTENSION postgis в миграции"
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
                "title": "API: POST /orders — создать заявку"
              }
            ]
          },
          {
            "day": 13,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-13-0",
                "title": "API: GET /orders — лента заявок с пагинацией"
              },
              {
                "id": "t-13-1",
                "title": "Фильтры: по дате, маршруту, типу кузова, цене, весу"
              },
              {
                "id": "t-13-2",
                "title": "API: GET /orders/:id — детали заявки"
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
                "title": "API: DELETE /orders/:id — отменить заявку"
              },
              {
                "id": "t-14-2",
                "title": "Yandex Maps Geocoder: адрес → координаты при создании заявки"
              }
            ]
          },
          {
            "day": 15,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-15-0",
                "title": "Nuxt: страница /orders/create — форма заявки с картой"
              },
              {
                "id": "t-15-1",
                "title": "Автодополнение адресов через Yandex Maps Suggest"
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
                "title": "Nuxt: страница /orders — доска заявок, карточки"
              },
              {
                "id": "t-16-1",
                "title": "Компонент фильтров (дата, маршрут, тип кузова, цена)"
              },
              {
                "id": "t-16-2",
                "title": "Infinite scroll или пагинация"
              }
            ]
          },
          {
            "day": 17,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-17-0",
                "title": "Nuxt: страница /orders/:id — детали заявки"
              },
              {
                "id": "t-17-1",
                "title": "Yandex Maps: показать маршрут на карте в деталях заявки"
              },
              {
                "id": "t-17-2",
                "title": "Страница /my-orders — заявки текущего пользователя"
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
                "title": "API: POST /orders/:id/respond — перевозчик откликается"
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
                "title": "Nuxt: кнопка \"Откликнуться\" на карточке заявки (для перевозчика)"
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
                "title": "Кнопка \"Выбрать перевозчика\" — подтверждение сделки"
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
                "title": "GIST индекс на current_location"
              },
              {
                "id": "t-21-2",
                "title": "API: PUT /carrier/location — перевозчик обновляет свою позицию"
              }
            ]
          },
          {
            "day": 22,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-22-0",
                "title": "PostGIS запрос: найти перевозчиков в радиусе X км от точки погрузки"
              },
              {
                "id": "t-22-1",
                "title": "API: GET /orders/:id/nearby-carriers?radius=50 — ближайшие свободные"
              },
              {
                "id": "t-22-2",
                "title": "Фильтр по совместимости: тип кузова заявки = тип кузова перевозчика"
              }
            ]
          },
          {
            "day": 23,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-23-0",
                "title": "PostGIS запрос: перевозчики \"на пути следования\" (буфер вдоль маршрута)"
              },
              {
                "id": "t-23-1",
                "title": "Комбинированный поиск: радиус + маршрут"
              },
              {
                "id": "t-23-2",
                "title": "API: GET /carriers/search — поиск по гео-параметрам"
              }
            ]
          },
          {
            "day": 24,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-24-0",
                "title": "BullMQ + Redis: очередь уведомлений"
              },
              {
                "id": "t-24-1",
                "title": "Job: при публикации заявки — найти подходящих перевозчиков и отправить push"
              },
              {
                "id": "t-24-2",
                "title": "OneSignal или FCM: базовая настройка push-уведомлений"
              }
            ]
          },
          {
            "day": 25,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-25-0",
                "title": "Nuxt: карта с перевозчиками в радиусе на странице заявки"
              },
              {
                "id": "t-25-1",
                "title": "Тест гео-поиска с реальными координатами"
              },
              {
                "id": "t-25-2",
                "title": "Буфер и фикс всего из недель 3–5"
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
                "title": "Drizzle схема: chats (id, orderId, customerID, carrierId)"
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
                "title": "Авторизация WebSocket соединения через токен"
              },
              {
                "id": "t-27-2",
                "title": "Broadcast сообщения всем участникам чата"
              }
            ]
          },
          {
            "day": 28,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-28-0",
                "title": "API: GET /chats/:id/messages — история сообщений"
              },
              {
                "id": "t-28-1",
                "title": "Загрузка фото в чат: upload в R2, ссылка в сообщении"
              },
              {
                "id": "t-28-2",
                "title": "Push-уведомление при новом сообщении (BullMQ job)"
              }
            ]
          },
          {
            "day": 29,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-29-0",
                "title": "Nuxt: страница /chat/:id — интерфейс чата"
              },
              {
                "id": "t-29-1",
                "title": "Реалтайм через useWebSocket composable"
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
                "title": "Шаблоны быстрых сообщений: \"Еду\", \"На месте\", \"Задерживаюсь\""
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
                "title": "API: PUT /orders/:id/status — перевозчик меняет статус"
              },
              {
                "id": "t-31-2",
                "title": "Лог смены статусов: order_status_logs (orderId, status, changedAt, changedBy)"
              }
            ]
          },
          {
            "day": 32,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-32-0",
                "title": "Push при каждой смене статуса (заказчику)"
              },
              {
                "id": "t-32-1",
                "title": "WebSocket broadcast статуса — заказчик видит изменение без перезагрузки"
              },
              {
                "id": "t-32-2",
                "title": "API: GET /orders/:id/status-log — история статусов"
              }
            ]
          },
          {
            "day": 33,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-33-0",
                "title": "Фото-контроль: загрузка фото при погрузке и разгрузке"
              },
              {
                "id": "t-33-1",
                "title": "Схема: order_photos (orderId, stage, fileUrl, uploadedAt)"
              },
              {
                "id": "t-33-2",
                "title": "API: POST /orders/:id/photos — загрузить фото этапа"
              }
            ]
          },
          {
            "day": 34,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-34-0",
                "title": "Nuxt: страница /orders/:id/track — трекинг статусов"
              },
              {
                "id": "t-34-1",
                "title": "Визуальный прогресс-бар этапов: погрузка → в пути → разгрузка → завершено"
              },
              {
                "id": "t-34-2",
                "title": "Кнопки смены статуса (для перевозчика)"
              }
            ]
          },
          {
            "day": 35,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-35-0",
                "title": "История заказов: /my-orders с фильтром по статусу"
              },
              {
                "id": "t-35-1",
                "title": "Просмотр фото по каждому этапу в деталях заказа"
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
                "title": "Ограничение: отзыв можно оставить только после completed"
              },
              {
                "id": "t-36-2",
                "title": "Один отзыв на пользователя в рамках одного заказа"
              }
            ]
          },
          {
            "day": 37,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-37-0",
                "title": "API: POST /orders/:id/review — оставить отзыв"
              },
              {
                "id": "t-37-1",
                "title": "API: GET /users/:id/reviews — отзывы пользователя"
              },
              {
                "id": "t-37-2",
                "title": "Агрегация рейтинга: среднее + количество в профиле"
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
                "title": "Блок отзывов в профиле перевозчика (рейтинг + список)"
              },
              {
                "id": "t-38-2",
                "title": "Push-напоминание оставить отзыв через 2 часа после completed"
              }
            ]
          },
          {
            "day": 39,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-39-0",
                "title": "Сортировка доски заявок по рейтингу откликнувшихся"
              },
              {
                "id": "t-39-1",
                "title": "Статистика в профиле: кол-во рейсов, средний рейтинг, процент завершённых"
              },
              {
                "id": "t-39-2",
                "title": "Тест двустороннего отзыва"
              }
            ]
          },
          {
            "day": 40,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-40-0",
                "title": "Финальный тест полного цикла: регистрация → заявка → гео-поиск → отклик → чат → трекинг → отзыв"
              },
              {
                "id": "t-40-1",
                "title": "Фикс критических багов"
              },
              {
                "id": "t-40-2",
                "title": "Буфер: всё незавершённое из фазы 3"
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
                "title": "Capacitor init в Nuxt проекте, настройка capacitor.config.ts"
              },
              {
                "id": "t-41-1",
                "title": "npx cap add android + npx cap add ios"
              },
              {
                "id": "t-41-2",
                "title": "Первый билд — проверить что открывается на эмуляторе"
              }
            ]
          },
          {
            "day": 42,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-42-0",
                "title": "Capacitor Geolocation plugin — получить текущую позицию"
              },
              {
                "id": "t-42-1",
                "title": "Фоновая отправка координат перевозчика (watchPosition)"
              },
              {
                "id": "t-42-2",
                "title": "Push notifications через Capacitor PushNotifications plugin"
              }
            ]
          },
          {
            "day": 43,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-43-0",
                "title": "Адаптивный UI: проверить все страницы на мобильном viewport"
              },
              {
                "id": "t-43-1",
                "title": "Bottom navigation bar для мобайла (Главная, Заявки, Чат, Профиль)"
              },
              {
                "id": "t-43-2",
                "title": "Touch-friendly: кнопки min 44px, формы без zoom на iOS"
              }
            ]
          },
          {
            "day": 44,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-44-0",
                "title": "Camera plugin: фото груза прямо с камеры телефона"
              },
              {
                "id": "t-44-1",
                "title": "Тест на реальном Android устройстве"
              },
              {
                "id": "t-44-2",
                "title": "Фикс мобильных багов (scroll, keyboard, safe area)"
              }
            ]
          },
          {
            "day": 45,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-45-0",
                "title": "Docker Compose для продакшна: backend + postgres + redis + nginx"
              },
              {
                "id": "t-45-1",
                "title": "Деплой на Hostinger VPS — первый живой сервер"
              },
              {
                "id": "t-45-2",
                "title": "SSL через Let's Encrypt, домен через Cloudflare"
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
                "title": "Полное E2E тестирование: пройти весь цикл как заказчик"
              },
              {
                "id": "t-46-1",
                "title": "Полное E2E тестирование: пройти весь цикл как перевозчик"
              },
              {
                "id": "t-46-2",
                "title": "Список всех найденных багов"
              }
            ]
          },
          {
            "day": 47,
            "weekdayRu": "Вт",
            "tasks": [
              {
                "id": "t-47-0",
                "title": "Фикс критических багов из E2E теста"
              },
              {
                "id": "t-47-1",
                "title": "Производительность: индексы БД, N+1 запросы"
              },
              {
                "id": "t-47-2",
                "title": "Rate limiting на API (защита от спама)"
              }
            ]
          },
          {
            "day": 48,
            "weekdayRu": "Ср",
            "tasks": [
              {
                "id": "t-48-0",
                "title": "Android APK сборка для внутреннего тестирования"
              },
              {
                "id": "t-48-1",
                "title": "Передать 2–3 реальным пользователям (перевозчик + заказчик)"
              },
              {
                "id": "t-48-2",
                "title": "Собрать первую обратную связь"
              }
            ]
          },
          {
            "day": 49,
            "weekdayRu": "Чт",
            "tasks": [
              {
                "id": "t-49-0",
                "title": "Фикс по фидбеку от тестовых пользователей"
              },
              {
                "id": "t-49-1",
                "title": "Подготовка к публикации в Google Play (store listing, скриншоты)"
              },
              {
                "id": "t-49-2",
                "title": "Privacy Policy страница (обязательна для магазинов)"
              }
            ]
          },
          {
            "day": 50,
            "weekdayRu": "Пт",
            "tasks": [
              {
                "id": "t-50-0",
                "title": "Отправка в Google Play (Internal Testing)"
              },
              {
                "id": "t-50-1",
                "title": "Финальная проверка безопасности: env переменные, открытые порты"
              },
              {
                "id": "t-50-2",
                "title": "🎉 MVP готов — первые реальные пользователи"
              }
            ]
          }
        ]
      }
    ]
  }
] as const satisfies MvpRoadmapPhase[];

/** Календарная дата для дня плана (1..50), Пн–Пт от первого понедельника (локальный пояс). */
export function calendarDateForRoadmapDay(dayNum: number): Date {
  if (dayNum < 1 || dayNum > 50) {
    throw new RangeError('Roadmap day must be 1..50');
  }
  const [y, mo, d] = MVP_ROADMAP_FIRST_MONDAY_ISO.split('-').map(Number);
  const base = new Date(y, mo - 1, d, 12, 0, 0, 0);
  const i = dayNum - 1;
  const week = Math.floor(i / 5);
  const dow = i % 5;
  base.setDate(base.getDate() + week * 7 + dow);
  return base;
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
