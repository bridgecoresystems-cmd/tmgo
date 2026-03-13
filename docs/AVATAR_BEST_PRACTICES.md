# Best Practices: Загрузка и отображение аватаров

## Источники документации

- [Nuxt 3 Server Routes](https://nuxt.com/docs/guide/directory-structure/server)
- [Nitro Routing](https://nitro.build/guide/routing)
- [Nuxt Image Module](https://image.nuxt.com/) — оптимизация изображений
- [Answer Overflow: Proxy images through server](https://www.answeroverflow.com/m/1390480648086618213)

## Рекомендации по документации

### 1. **Same-origin для изображений**

Изображения должны загружаться с того же origin, что и фронтенд (localhost:3000), чтобы избежать CORS и проблем с путями.

**Решение:** Прокси через Nuxt server API (`server/api/avatar/[...path].get.ts`).

### 2. **Прокси-сервер**

Создать API route, который:
- Принимает запрос на `/api/avatar/:filename`
- Запрашивает изображение с backend (`http://localhost:8000/api/auth/avatars/:filename`)
- Возвращает с правильными headers (`Content-Type`, `Cache-Control`)

### 3. **Валидация загрузки**

- Ограничение типов: JPG, PNG, GIF, WEBP
- Максимальный размер: 2 МБ для аватаров
- Проверка MIME на сервере

### 4. **Оптимизация (опционально)**

Модуль `@nuxt/image` даёт:
- Автоматическую оптимизацию (webp, avif)
- Lazy loading
- Responsive sizes

### 5. **Naive UI Avatar**

При проблемах с отображением:
- Использовать `fallback-src` для запасного изображения
- Проверить, что `src` — полный URL или относительный путь

## Текущая реализация в TMGO

1. **Backend** (`/api/auth/upload-avatar`): загрузка файла → сохранение в `storage/avatars/` → URL в `users.image`
2. **Backend** (`/api/auth/avatars/:filename`): отдача файла по запросу
3. **Frontend proxy** (`/api/avatar/:filename`): проксирует запрос на backend, same-origin
4. **useAvatarUrl**: преобразует путь в `/api/avatar/xxx` для отображения

## Отладка

1. **Проверить Network** (DevTools): запрос к `/api/avatar/xxx` должен возвращать 200 и image/jpeg
2. **Проверить session**: после загрузки `fetchSession()` должен вернуть `user.image`
3. **Проверить backend**: `GET http://localhost:8000/api/auth/avatars/filename` напрямую
