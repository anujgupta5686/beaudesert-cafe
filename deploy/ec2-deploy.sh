#!/usr/bin/env bash
# Pull latest main, rebuild frontend, restart API (PM2).
# Usage on EC2:
#   bash ~/apps/beaudesert-cafe/deploy/ec2-deploy.sh

set -euo pipefail

APP_DIR="${HOME}/apps/beaudesert-cafe"
cd "$APP_DIR"

echo "==> Pull main"
git fetch origin
git checkout main
git pull origin main

echo "==> Backend install + restart"
cd "$APP_DIR/backend"
npm ci --omit=dev
if ! pm2 describe cafe-api >/dev/null 2>&1; then
  pm2 start index.js --name cafe-api
else
  pm2 restart cafe-api --update-env
fi
pm2 save

echo "==> Frontend build"
cd "$APP_DIR/frontend"
if [ ! -f .env.production ]; then
  echo "ERROR: missing frontend/.env.production"
  echo "Create it with: VITE_API_URL=https://api.YOUR_DOMAIN/api"
  exit 1
fi
npm ci
npm run build

echo "==> Reload nginx (if configured)"
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t && sudo systemctl reload nginx || true
fi

echo ""
echo "Deploy OK."
echo "Health: curl -s http://127.0.0.1:5000/health | head"
pm2 status
