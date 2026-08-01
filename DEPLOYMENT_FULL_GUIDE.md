# Beaudesert Cafe — Full Production Deployment Guide

This document records **everything done** to deploy frontend + backend to production on **AWS EC2** with **GoDaddy** domain, **MongoDB Atlas**, **Cloudinary**, and **Gmail SMTP**.  
No S3 was used (media stays on Cloudinary).

**Live domain:** `https://beaudesertcafe.com`  
**Elastic IP:** `16.176.119.89`  
**GitHub:** `https://github.com/anujgupta5686/beaudesert-cafe.git`  
**AWS region:** Asia Pacific (Sydney) `ap-southeast-2`

---

# 1. Code preparation (local + GitHub)

## 1.1 What was prepared in the repo

- Production checklist: `PRODUCTION_CHECKLIST.md`
- EC2 deploy guide: `DEPLOY_EC2.md`
- Deploy scripts:
  - `deploy/ec2-setup.sh` — install Node, Nginx, PM2, clone repo
  - `deploy/ec2-deploy.sh` — pull `main`, restart API, rebuild frontend
  - `deploy/nginx/cafe.conf` — Nginx template for FE + API
  - `deploy/backend.env.production.example` — backend env template (no secrets)
- Frontend example: `frontend/.env.production.example`
- Email/SMTP hardening (health `smtpReady`, timeouts, contact/password email fixes)

## 1.2 Push / merge to GitHub

Work was done on branch `cursor/cafe-platform-enhancements`, then merged via PRs into `main` (examples: PR #7, #8, #9, #10).

Typical local git flow:

```powershell
cd C:\Users\DELL\Desktop\beaudesert-cafe
git status
git add <files>
git commit -m "Your message"
git push origin HEAD
```

Create/merge PR into `main` so EC2 can `git pull origin main`.

**Important:** Never commit `backend/.env` (secrets). It is gitignored.

---

# 2. Client production secrets (local `.env` only)

These were stored in **`backend/.env` on the developer machine and later on EC2** — not in GitHub.

| Area | Variables |
|------|-----------|
| App | `APP_ENV=production`, `NODE_ENV=production`, `PORT=5000` |
| MongoDB Atlas | `MONGODB_URI=...` |
| Mail | `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS`, `ADMIN_EMAIL` |
| Cloudinary | `STORAGE_PROVIDER=cloudinary`, `CLOUD_NAME`, `API_KEY`, `API_SECRET` |
| Auth | `JWT_SECRET`, `JWT_EXPIRES_IN` |
| URLs | `BACKEND_URL`, `FRONTEND_URL` (updated after domain + HTTPS) |

Notes from setup:

- Client wrote `ADMIN_MAIL` — code requires **`ADMIN_EMAIL`**.
- First Mongo password failed (`bad auth`); client provided a new URI → connection OK.
- Production DB started **empty** (0 products/admins) — expected for a new Atlas cluster.
- Local SMTP verify with client Gmail App Password: **`smtpReady: true`**.
- Render development mail often failed (`smtpReady: false`) — production mail works better on EC2.

---

# 3. AWS EC2 — create the server

## 3.1 Console clicks

1. Login AWS → region **Asia Pacific (Sydney)**.
2. Open **EC2** → **Instances** → **Launch instances**.
3. Settings used:
   - Name: production cafe server
   - AMI: Ubuntu (24.04 / newer LTS)
   - Type: `t3.micro` (upgrade later if needed)
   - Storage: **25 GiB** (not 8 GiB)
   - Security group inbound:
     - SSH `22` (My IP)
     - HTTP `80` (Anywhere)
     - HTTPS `443` (Anywhere)
   - Auto-assign public IP: Enable
4. **Launch instance**.

## 3.2 Key pair issue (and fix)

**Issue:** Key name `beaudesertcafe` already existed (created on another PC). AWS showed *“Key pair already exists.”* Private `.pem` cannot be re-downloaded.

**Fix:** Create a **new** key on this PC, e.g. `beaudesertcafenewkey` → download `beaudesertcafenewkey.pem` to Desktop. Use that key when launching / connecting.

## 3.3 Elastic IP

1. EC2 → **Elastic IPs** → **Allocate** (Amazon pool, `ap-southeast-2`).
2. **Associate** to the running instance.
3. Production Elastic IP: **`16.176.119.89`**.

---

# 4. PowerShell — connect from Windows

## 4.1 Open PowerShell

Windows key → type **PowerShell** → open it.

## 4.2 SSH commands (Windows only)

```powershell
cd $env:USERPROFILE\Desktop

icacls beaudesertcafenewkey.pem /inheritance:r
icacls beaudesertcafenewkey.pem /grant:r "$($env:USERNAME):(R)"

ssh -i beaudesertcafenewkey.pem ubuntu@16.176.119.89
```

Type `yes` if asked about host fingerprint.

Success looks like:

```text
ubuntu@ip-172-31-12-218:~$
```

## 4.3 Critical confusion (issue faced many times)

| Prompt | Where you are | Allowed commands |
|--------|----------------|------------------|
| `PS C:\Users\DELL\Desktop>` | Your Windows PC | Only `ssh`, `cd` to Desktop, `icacls` |
| `ubuntu@ip-172-31-12-218:~$` | AWS server | `sudo`, `apt`, `npm`, `pm2`, `nginx`, `certbot` |

**Issue examples:**

- Running `cd ~/apps/beaudesert-cafe/frontend` in PowerShell → path not found on Windows.
- Running `sudo apt update` in PowerShell → “Sudo is disabled on this machine”.
- Running `ssh -i beaudesertcafenewkey.pem ...` **while already on the server** → permission denied (`.pem` is on Windows, not on EC2).

**Rule:** SSH once from Windows → then run all deploy commands on the `ubuntu@...` prompt.

---

# 5. Server setup — install stack + clone GitHub

On the **server** (`ubuntu@...`):

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx
sudo npm i -g pm2

mkdir -p ~/apps && cd ~/apps
git clone https://github.com/anujgupta5686/beaudesert-cafe.git
cd beaudesert-cafe
git checkout main
git pull origin main
```

Nginx default page appeared early at `http://16.176.119.89` (“Welcome to nginx!”) — normal before app config.

---

# 6. Backend deploy (API + mail)

## 6.1 Create `backend/.env` on EC2

```bash
nano ~/apps/beaudesert-cafe/backend/.env
```

Paste production values (Mongo, mail, Cloudinary, JWT).  
Temporary URLs before HTTPS:

```env
BACKEND_URL=http://16.176.119.89
FRONTEND_URL=http://16.176.119.89
APP_ENV=production
STORAGE_PROVIDER=cloudinary
PORT=5000
```

Save: `Ctrl+O` → Enter → `Ctrl+X`

## 6.2 Install + start with PM2

```bash
cd ~/apps/beaudesert-cafe/backend
npm ci --omit=dev
pm2 delete cafe-api 2>/dev/null || true
pm2 start index.js --name cafe-api
pm2 save
pm2 startup
# then run the exact "sudo env PATH=..." command PM2 prints
```

## 6.3 Health check (successful result)

```bash
curl -s http://127.0.0.1:5000/health
```

Example success:

```json
{
  "status": "ok",
  "appEnv": "production",
  "storageProvider": "cloudinary",
  "emailConfigured": true,
  "smtpReady": true,
  "smtpHost": "smtp.gmail.com",
  "smtpError": null
}
```

`smtpReady: true` means order / OTP / completion emails can send from production.

---

# 7. Frontend deploy

## 7.1 Issue: `npm ci` failed

```text
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
Missing: @emnapi/core ... @emnapi/runtime ...
```

**Fix used on server:** use `npm install` instead of `npm ci`.

## 7.2 Build commands

```bash
cd ~/apps/beaudesert-cafe/frontend
nano .env.production
```

First (HTTP):

```env
VITE_API_URL=http://16.176.119.89/api
```

Later (HTTPS domain):

```env
VITE_API_URL=https://beaudesertcafe.com/api
```

```bash
npm install
npm run build
ls -la dist
```

`dist` should contain `index.html` and `assets/`.

---

# 8. Nginx — serve frontend + proxy `/api`

## 8.1 Issue: browser showed `500 Internal Server Error`

Cause: Nginx (`www-data`) could not read files under `/home/ubuntu/...` (permissions).

**Fix:**

```bash
chmod o+x /home/ubuntu
chmod o+x /home/ubuntu/apps
chmod o+x /home/ubuntu/apps/beaudesert-cafe
chmod o+x /home/ubuntu/apps/beaudesert-cafe/frontend
chmod -R o+rX /home/ubuntu/apps/beaudesert-cafe/frontend/dist
```

## 8.2 Nginx site config (final style)

```bash
sudo tee /etc/nginx/sites-available/cafe >/dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name beaudesertcafe.com www.beaudesertcafe.com 16.176.119.89;

    root /home/ubuntu/apps/beaudesert-cafe/frontend/dist;
    index index.html;
    client_max_body_size 25M;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/cafe /etc/nginx/sites-enabled/cafe
sudo nginx -t && sudo systemctl reload nginx
```

Test:

- `http://16.176.119.89`
- `http://beaudesertcafe.com`

---

# 9. GoDaddy domain

## 9.1 Domain used

`beaudesertcafe.com`

## 9.2 DNS records (needed / used)

| Type | Name | Value |
|------|------|--------|
| A | `@` | `16.176.119.89` |
| CNAME | `www` | `beaudesertcafe.com` (or `@`) |

API is served under same domain as `/api` (no separate `api.` subdomain required for this setup).

DNS was verified: `beaudesertcafe.com` → `16.176.119.89`.

---

# 10. HTTPS (Let's Encrypt / Certbot)

## 10.1 Issue: `sudo: certbot: command not found`

Certbot was not installed.

**Install:**

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
certbot --version
```

## 10.2 Issue: ran certbot from Windows PowerShell

That cannot work. Must be on `ubuntu@...` after SSH.

## 10.3 Issue / prompt: certificate already exists

```text
Certificate not yet due for renewal
What would you like to do?
1: Attempt to reinstall this existing certificate
2: Renew & replace the certificate
```

**Choose `1`** (reinstall existing cert into Nginx).

```bash
sudo certbot --nginx -d beaudesertcafe.com -d www.beaudesertcafe.com
```

## 10.4 After HTTPS — update app URLs

`backend/.env`:

```env
BACKEND_URL=https://beaudesertcafe.com
FRONTEND_URL=https://beaudesertcafe.com
```

```bash
pm2 restart cafe-api --update-env

cd ~/apps/beaudesert-cafe/frontend
echo 'VITE_API_URL=https://beaudesertcafe.com/api' > .env.production
npm run build
chmod -R o+rX dist
sudo systemctl reload nginx
```

Open: **https://beaudesertcafe.com**

---

# 11. First admin (empty MongoDB)

Production Atlas DB had **no data**. Do **not** insert admin manually with a plain password (login will fail; password must be bcrypt-hashed).

## 11.1 Register via API (on server)

```bash
curl -s -X POST http://127.0.0.1:5000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "beaudesertcafe@gmail.com",
    "password": "YourStrongPasswordHere",
    "name": "Beaudesert Cafe Admin"
  }'
```

Endpoint used by the app: `POST /api/admin/register`.

## 11.2 Login

Browser: `https://beaudesertcafe.com/admin/login`  
Email: `beaudesertcafe@gmail.com`  
Password: the one set in the curl command.

Then add categories, products, cafe settings in Admin UI.

---

# 12. Useful ongoing commands

## 12.1 From Windows (connect)

```powershell
cd $env:USERPROFILE\Desktop
ssh -i beaudesertcafenewkey.pem ubuntu@16.176.119.89
```

## 12.2 On server (status / restart / update)

```bash
pm2 status
pm2 logs cafe-api
pm2 restart cafe-api --update-env
curl -s http://127.0.0.1:5000/health

cd ~/apps/beaudesert-cafe
git pull origin main
cd backend && npm ci --omit=dev && pm2 restart cafe-api
cd ../frontend && npm install && npm run build
chmod -R o+rX dist
sudo systemctl reload nginx
```

Or use:

```bash
bash ~/apps/beaudesert-cafe/deploy/ec2-deploy.sh
```

(after adjusting script if `npm ci` still fails on frontend — use `npm install`).

---

# 13. Issues faced — summary table

| Issue | Where | Fix |
|------|--------|-----|
| Mail not working on Render | Development host | SMTP often fails on Render; production EC2 + Gmail App Password worked (`smtpReady: true`) |
| Mongo `bad auth` | First Atlas URI | Reset DB user password / new connection string |
| Key pair already exists | AWS | Create new key `beaudesertcafenewkey.pem` on current PC |
| Commands run in wrong place | Windows vs SSH | Only SSH from PowerShell; run deploy on `ubuntu@` |
| `npm ci` lockfile sync error | Frontend on EC2 | Use `npm install` then `npm run build` |
| Nginx `500 Internal Server Error` | Browser | `chmod o+x` home path + `o+rX` on `dist` |
| `certbot: command not found` | Server | `sudo apt install -y certbot python3-certbot-nginx` |
| Certbot “already exists” menu | Server | Choose option **1** reinstall |
| Empty production DB | Atlas | Register admin via `/api/admin/register`, then add content in Admin |
| Manual Mongo admin document | Atlas | Avoid plain password insert; use register API |

---

# 14. Final production checklist

- [x] Code on GitHub `main`
- [x] EC2 running + Elastic IP `16.176.119.89`
- [x] Backend PM2 + Cloudinary + Gmail SMTP
- [x] Frontend built to `dist`
- [x] Nginx serves site + `/api` proxy
- [x] GoDaddy `A` / `www` → Elastic IP
- [x] HTTPS via Certbot
- [ ] Admin registered + can login
- [ ] Cafe Settings filled
- [ ] Categories / products added
- [ ] Place test order → customer + admin emails received
- [ ] Mark order completed → feedback email received

---

# 15. Architecture (what runs where)

```text
Browser
  → https://beaudesertcafe.com          (Nginx on EC2 → frontend/dist)
  → https://beaudesertcafe.com/api/...  (Nginx → Express :5000 via PM2)

Express
  → MongoDB Atlas (cafe_db)
  → Cloudinary (images)
  → Gmail SMTP (orders, OTP, completion, contact)
```

---

*Keep secrets only in EC2 `backend/.env` and local private `.env`. Rotate passwords if they were shared in chat.*
