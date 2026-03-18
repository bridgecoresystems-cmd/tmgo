# Changelog

Все значимые изменения в проекте TMGO Logistics Platform.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/).

---

## [Unreleased]

### Security
- Хардкод секретов: DATABASE_URL и CHAT_ATTACHMENT_SECRET обязательны в production
- CORS: в production только разрешённые домены (CORS_ORIGIN, FRONTEND_URL)
- Валидация email: `t.String({ format: 'email' })` для sign-in/sign-up
- Secure флаг на cookie (session, impersonate) в production
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- elysia-rate-limit для sign-in (10 попыток / 15 мин, по IP)
- Защита storage: docs/SECURITY_STORAGE.md

### Fixed
- onAfterHandle вместо onResponse для security headers (Elysia API)

---

## [0.1.0] - 2026-03-17

### Added
- **Security:** rate limiting на sign-in, инвалидация сессий при смене пароля
- **Security:** path traversal fix (basename) для avatars и document-files
- **Auth UX:** ошибки входа в форме (не toast), страница /rate-limited для 429
- **Auth UX:** русский текст ошибок (из body ответа бэкенда)
- **Auth UX:** i18n для rate-limited (ru, en, tk)
- **Скрытие полей:** hidden_fields в карточке водителя — админ может скрывать поля в карточке
- **Скрытие полей:** глаз слева от текста, flex .section-header (глаз и текст в одну строку)
- **Документы:** печать, кнопка «Наверх»

### Changed
- useAuth: извлечение сообщений из body при 401/429

---

## [0.0.9] - 2026-03-16

### Added
- **Admin:** unified passports/licenses, admin documents API
- **Admin:** fix contact/citizenship deletion
- **i18n:** @nuxtjs/i18n с явной загрузкой переводов
- **Auth UX:** index footer, admin/driver updates
- **Driver:** карточка водителя, верификация, добавить документы
- **Driver card V2:** верификация, auth, footer
- **Admin:** удаление пользователей

### Refactored
- **Admin:** отдельная форма AdminDriverCardForm, улучшение user management

---

## [0.0.8] - 2026-03-14

### Added
- Второй паспорт, статус активности, уведомления
- Верификация и запросы на изменение полей
- **Impersonate:** вход под пользователем для админа
- Draggable scan modal, главная в меню
- Admin users improvements

---

## [0.0.7] - 2026-03-13

### Added
- Профиль с аватаром, оповещения, паспорт серия/номер
- **Admin:** создание пользователей, мягкое удаление, защита последнего админа
- Карточка водителя, верификация, админка
- Driver profile, card page и DB migrations

---

## [0.0.6] - 2026-03-12

### Changed
- **Chore:** remove Nuxt proxy, direct API to backend :8000
- **LAN:** доступ по IP, без CORS для мобильных

### Added
- Переговоры заказчик-перевозчик, чат с фото, услуги
- **Рассылки:** админ создаёт, заказчики и перевозчики видят
- Разделение кабинета на заказчика и перевозчика

---

## [0.0.1] - 2026-03-12

### Added
- Initial monorepo setup (Elysia, Nuxt 3, Drizzle, Better Auth)
- Базовая структура backend и frontend

---
