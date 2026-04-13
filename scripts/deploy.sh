#!/usr/bin/env bash
# TMGO: деплой на VPS через Docker Compose.
#
# Использование:
#   ./scripts/deploy.sh
#
# На сервере один раз создать /opt/tmgo/.env со всеми переменными:
#   POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
#   BETTER_AUTH_SECRET, BETTER_AUTH_URL, FRONTEND_URL
#   CHAT_ATTACHMENT_SECRET, RESEND_API_KEY
#   NUXT_PUBLIC_API_BASE, NUXT_PUBLIC_WS_URL
#   BACKEND_PORT=8020, FRONTEND_PORT=3020

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[deploy] ROOT=$ROOT"

echo "[deploy] docker compose build & up"
docker compose up --build -d

echo "[deploy] done ✓"
echo "[deploy] backend:  http://localhost:${BACKEND_PORT:-8020}"
echo "[deploy] frontend: http://localhost:${FRONTEND_PORT:-3020}"
