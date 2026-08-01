#!/usr/bin/env bash
# Run once on a fresh Ubuntu 22.04 EC2 as ubuntu user:
#   curl -fsSL https://raw.githubusercontent.com/anujgupta5686/beaudesert-cafe/main/deploy/ec2-setup.sh | bash
# Or after git clone:
#   bash deploy/ec2-setup.sh

set -euo pipefail

echo "==> Updating system"
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==> Installing Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

echo "==> Installing PM2 + Certbot"
sudo npm install -g pm2
sudo snap install --classic certbot || true
sudo ln -sf /snap/bin/certbot /usr/bin/certbot || true

echo "==> Cloning repo"
mkdir -p "$HOME/apps"
cd "$HOME/apps"
if [ ! -d beaudesert-cafe ]; then
  git clone https://github.com/anujgupta5686/beaudesert-cafe.git
fi
cd beaudesert-cafe
git fetch origin
git checkout main
git pull origin main

echo "==> Backend deps"
cd backend
npm ci --omit=dev

if [ ! -f .env ]; then
  echo ""
  echo "!! Create backend/.env now (copy from your local production values)."
  echo "   nano $HOME/apps/beaudesert-cafe/backend/.env"
  echo ""
fi

echo "==> Frontend deps (build comes after you set .env.production)"
cd ../frontend
npm ci

echo ""
echo "Setup packages done."
echo "Next:"
echo "  1) nano ~/apps/beaudesert-cafe/backend/.env"
echo "  2) nano ~/apps/beaudesert-cafe/frontend/.env.production"
echo "  3) bash ~/apps/beaudesert-cafe/deploy/ec2-deploy.sh"
echo "  4) Configure Nginx from deploy/nginx/cafe.conf"
echo "  5) Point GoDaddy DNS A records to this Elastic IP"
echo "  6) sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN -d api.YOUR_DOMAIN"
