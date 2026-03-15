# TODO: Driver Card System v2 (по ТЗ)

## Backend

- [x] Обновить schema.ts (enums, таблицы driver_documents, citizenships, contacts, change_requests)
- [x] Маршруты документов: /cabinet/driver/documents (CRUD + upload)
- [x] Маршруты гражданств: /cabinet/driver/citizenships
- [x] Маршруты контактов: /cabinet/driver/contacts
- [x] Маршруты change-requests: /cabinet/driver/change-requests + /admin/change-requests
- [x] Рефакторинг driver-profile.ts: новый статус верификации, submit/resubmit, online-status
- [x] Admin-маршруты верификации: /admin/drivers/:id/verify|reject|suspend|restore
- [x] Скрипт миграции данных: scripts/migrate-profiles.ts
- [x] Подключить все роуты в index.ts

## Backend (без BullMQ)

- [x] Trip snapshot при accept заказа (lib/trip-snapshot.ts)
- [x] checkFieldAccess через profile_change_requests в PATCH profile
- [x] Скрипт document-expiry-check (bun run check:expiry) — для cron

## Frontend

- [x] Подключение к новым API (documents, citizenships, contacts, change-requests)
- [x] Тумблер онлайн/оффлайн в хедере
- [x] DocumentsList, CitizenshipsList, ContactsList, ChangeRequestsList с формами добавления
- [x] Admin: верификация/отклонение/приостановка/восстановление водителей

## Позже (когда будет интернет)

- [ ] BullMQ для document-expiry и admin-notifications
