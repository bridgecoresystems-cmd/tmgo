#!/usr/bin/env bash
# TMGO: деплой без Docker (VPS).
# Перед первым запуском на сервере:
#   - скопировать packages/frontend/.env.production.example → .env.production и заполнить NUXT_PUBLIC_*
#   - packages/backend/.env с DATABASE_URL, REDIS_*, BETTER_AUTH_* и т.д.
#   - создать каталог статики: sudo mkdir -p /var/www/tmgo && sudo chown "$USER":www-data /var/www/tmgo
# Переменные окружения (опционально):
#   TMGO_WEB_ROOT   — куда класть nuxt generate (по умолчанию /var/www/tmgo)
#   TMGO_SYSTEMD_UNIT — имя unit бэкенда, например tmgo-backend (если задан — выполнится restart)
#   TMGO_SKIP_RSYNC — если 1, не копировать фронт (только бэкенд/миграции)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Опционально на VPS: /etc/tmgo/deploy.env с TMGO_WEB_ROOT=..., TMGO_SYSTEMD_UNIT=...
if [[ -f /etc/tmgo/deploy.env ]]; then
  echo "[deploy] source /etc/tmgo/deploy.env"
  set -a
  # shellcheck disable=SC1091
  source /etc/tmgo/deploy.env
  set +a
fi

TMGO_WEB_ROOT="${TMGO_WEB_ROOT:-/var/www/tmgo}"
TMGO_SKIP_RSYNC="${TMGO_SKIP_RSYNC:-0}"

echo "[deploy] ROOT=$ROOT"

bun install --frozen-lockfile

echo "[deploy] db:migrate"
bun run db:migrate

echo "[deploy] build backend"
bun run build:backend

echo "[deploy] generate frontend (static)"
bun run generate:frontend

PUBLIC_DIR="$ROOT/packages/frontend/.output/public"
if [[ ! -d "$PUBLIC_DIR" ]]; then
  echo "[deploy] ERROR: нет $PUBLIC_DIR — nuxt generate не собрался" >&2
  exit 1
fi

if [[ "$TMGO_SKIP_RSYNC" != "1" ]]; then
  echo "[deploy] publish static → $TMGO_WEB_ROOT"
  mkdir -p "$TMGO_WEB_ROOT"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$PUBLIC_DIR/" "$TMGO_WEB_ROOT/"
  else
    rm -rf "${TMGO_WEB_ROOT:?}/"*
    cp -a "$PUBLIC_DIR"/. "$TMGO_WEB_ROOT/"
  fi
fi

if [[ -n "${TMGO_SYSTEMD_UNIT:-}" ]]; then
  echo "[deploy] systemctl restart $TMGO_SYSTEMD_UNIT"
  systemctl restart "$TMGO_SYSTEMD_UNIT"
fi

echo "[deploy] done"
