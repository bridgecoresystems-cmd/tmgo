#!/usr/bin/env bash
# После git pull на сервере: обновить зависимости, миграции, сборка, перезапуск.
set -euo pipefail
cd /opt/tmgo
bun install
bun run db:migrate
bun run build
sudo systemctl restart tmgo-backend tmgo-frontend
sudo nginx -t && sudo systemctl reload nginx
echo "OK: tmgo-backend, tmgo-frontend restarted."
