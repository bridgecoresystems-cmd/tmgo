# Защита файлов и папок

## Что уже сделано

### Backend (Elysia)

- **Нет статической раздачи** — папка `storage/` не отдаётся как static. Все файлы идут только через API.
- **Path traversal** — `basename()` отрезает `../`, доступ только к файлам внутри нужной папки.
- **Проверка доступа:**
  - `driver-docs` — только владелец профиля или admin
  - `chat attachments` — только по подписанному token
  - `avatars` — публичные (профильные фото)
- **Security headers** — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection.
- **.gitignore** — `storage/`, `.env` не попадают в git.

### Риски и как их снизить

| Риск | Решение |
|------|---------|
| Прямой доступ к папкам по URL | Нет маршрутов для `/storage`, `/storage/*` — 404 |
| Path traversal (`../`) | Используется `basename()` |
| Доступ к коду/конфигам | `.env` в gitignore, код не отдаётся через API |
| Доступ по SSH/терминалу | Настройка сервера, права, firewall |

---

## Рекомендации для production

### 1. Права на папки

```bash
# storage только для пользователя приложения
chmod 700 storage/
chmod 700 storage/avatars storage/driver-docs storage/chat

# приложение не под root
chown appuser:appuser storage -R
```

### 2. Nginx (если используется)

```nginx
# Не отдавать storage и чувствительные пути
location ~ ^/(storage|\.env|\.git) {
    return 404;
}

# Отключить листинг директорий
autoindex off;
```

### 3. Firewall

```bash
# Только нужные порты (80, 443, 22)
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 4. Файлы вне web root

- `storage/` — рядом с приложением, не в `public/`
- `.env` — в корне backend, не в репозитории

### 5. Аватары

Сейчас аватары доступны по URL `/api/auth/avatars/:filename` без авторизации. Имена файлов вида `{userId}_{uuid}.ext`, перебор сложен. При необходимости можно перейти на подписанные URL (как в чате).

---

## Через браузер

- Нет маршрутов для листинга папок.
- Файлы отдаются только через API с проверкой прав.
- Security headers снижают риски XSS и MIME-sniffing.

## Через терминал / SSH

- Защита на уровне сервера: сильные пароли, SSH-ключи, ограничение доступа.
- Отдельный пользователь для приложения, без root.
