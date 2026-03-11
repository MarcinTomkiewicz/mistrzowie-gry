#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ROOT="/var/www/mistrzowie-gry"
BACKUP_ROOT="/var/www/mistrzowie-gry/backup"
KEEP_BACKUPS=5
ARCHIVE_PATH="${1:-/tmp/mistrzowie-gry-dist.tgz}"

umask 022
mkdir -p "$DEPLOY_ROOT" "$BACKUP_ROOT"

STAMP="$(date +%F_%H-%M-%S)"
mkdir -p "$BACKUP_ROOT/$STAMP"

echo "[deploy] backing up current browser/server to $BACKUP_ROOT/$STAMP"
if [ -d "$DEPLOY_ROOT/browser" ]; then
  mv "$DEPLOY_ROOT/browser" "$BACKUP_ROOT/$STAMP/browser"
fi
if [ -d "$DEPLOY_ROOT/server" ]; then
  mv "$DEPLOY_ROOT/server" "$BACKUP_ROOT/$STAMP/server"
fi

echo "[deploy] extracting new dist to $DEPLOY_ROOT"
tar xzf "$ARCHIVE_PATH" -C "$DEPLOY_ROOT"

(ls -1dt "$BACKUP_ROOT"/* 2>/dev/null || true) | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -rf || true

echo "[deploy] ensuring pm2 process is running"
if /usr/bin/pm2 describe mistrzowie-gry-ssr >/dev/null 2>&1; then
  APP_BASE_HREF=/mistrzowie-gry/ PORT=4100 /usr/bin/pm2 restart mistrzowie-gry-ssr --update-env
else
  APP_BASE_HREF=/mistrzowie-gry/ PORT=4100 /usr/bin/pm2 start "$DEPLOY_ROOT/server/server.mjs" --name mistrzowie-gry-ssr
fi

/usr/bin/pm2 save
echo "[deploy] done"