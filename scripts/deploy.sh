#!/usr/bin/env bash
# TMGO: деплой на VPS (SSR режим).
#
# Использование:
#   ./scripts/deploy.sh
#
# На сервере один раз:
#   - packages/backend/.env          — DATABASE_URL, REDIS_URL, BETTER_AUTH_*, и т.д.
#   - packages/frontend/.env.production — NUXT_PUBLIC_API_BASE, NUXT_PUBLIC_WS_URL

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[deploy] ROOT=$ROOT"

echo "[deploy] install dependencies"
bun install --frozen-lockfile

echo "[deploy] db:migrate"
bun run db:migrate

echo "[deploy] build backend"
bun run build:backend

echo "[deploy] build frontend (SSR)"
bun run build:frontend

echo "[deploy] restart tmgo-backend"
systemctl restart tmgo-backend

echo "[deploy] restart tmgo-frontend"
systemctl restart tmgo-frontend

echo "[deploy] done ✓"
