# Beaudesert Cafe — Production checklist (AWS + client)

Use this after development mail works. Do **not** commit real secrets into git.

---

## A. Fix development email first (do this before production)

Live Render currently reports: `emailConfigured: true` but **`smtpReady: false`**.  
That means mail env vars exist, but Gmail rejects login (wrong App Password / normal password / typo).

### On Render → your backend service → Environment

Set **exactly** (same values that work on your laptop):

```
MAIL_HOST=smtp.gmail.com
MAIL_USER=the-gmail-that-owns-the-app-password@gmail.com
MAIL_PASS=xxxxxxxxxxxxxxxx
ADMIN_EMAIL=client-or-cafe-inbox@gmail.com
FRONTEND_URL=https://YOUR-VERCEL-FRONTEND.vercel.app
```

Rules:

1. `MAIL_PASS` must be a **Google App Password** (16 chars), not the Gmail login password.
2. 2-Step Verification must be ON for that Google account.
3. No quotes around values in Render. Spaces in App Password are OK (code strips them).
4. Redeploy after saving env vars.
5. Open `https://YOUR-BACKEND.onrender.com/health`  
   - Need: `"smtpReady": true`  
   - If false: read `"smtpError"` (new field after this deploy).
6. Optional: `POST https://YOUR-BACKEND.onrender.com/health/smtp-verify`

Test flows after `smtpReady: true`:

| Flow | Expect |
|------|--------|
| Place order | Customer + admin emails; API `userEmailSent` / `adminEmailSent` |
| Mark completed | Customer feedback email; API `emailSent` |
| Forgot password | OTP email |
| Contact form | Admin alert email |

---

## B. What to collect from the client

| Item | Why | Who provides |
|------|-----|--------------|
| Business email (Gmail / Google Workspace / Microsoft 365) | Order + OTP + contact mails | Client (you already have access) |
| MongoDB Atlas URI (prod cluster) | Database | You created this |
| Domain (GoDaddy) | Public website URL | Client |
| AWS account (root email + billing) | EC2 + S3 | Create with client email / their card |
| Cafe brand details | Name, phone, address for settings | Client |
| Logo / images (optional) | Branding | Client |

### GoDaddy access — do you need it?

**Yes, limited access is useful**, or ask the client to do DNS for you:

- Point domain / subdomain DNS to AWS (or Cloudflare → AWS).
- Typical records:
  - `A` / `ALIAS` for `@` → EC2 Elastic IP (or Load Balancer)
  - `CNAME` for `www` → `@` or your host
  - Later: SPF/DKIM for mail if using SES

You do **not** need GoDaddy for S3/EC2 creation — only for DNS.

---

## C. Production architecture (EC2 — no S3)

Keep images on **Cloudinary** (already working). Deploy API + frontend on **one EC2**.

```
GoDaddy DNS
    │
    ├── yourdomain.com         → Nginx → frontend build (EC2)
    └── api.yourdomain.com     → Nginx → Express API (EC2 :5000)
              │
              ├── MongoDB Atlas (prod URI)
              ├── Cloudinary (images)
              └── Gmail SMTP App Password (client inbox)
```

> **Why leave Render for mail?** Many Render instances cannot reliably reach Gmail SMTP
> (`smtpReady: false` / verify hangs). EC2 outbound port 587 usually works with a Gmail App Password.

---

## D. Step-by-step: AWS EC2 only (no S3)

### 1) Create AWS account (client)

1. Use client email / business email.
2. Add payment method (client card).
3. Enable MFA on root + create an IAM admin user for you (never use root daily).

### 2) Create EC2 instance

1. Region: closest to client (e.g. `ap-southeast-2` Australia).
2. AMI: **Ubuntu 22.04 LTS**.
3. Instance: **t3.small** (ok to start).
4. Storage: **20–30 GB** gp3.
5. Key pair: create/download `.pem` (keep safe).
6. Security group inbound:
   - `22` SSH → your IP only
   - `80` HTTP → `0.0.0.0/0`
   - `443` HTTPS → `0.0.0.0/0`
7. Launch → **Elastic IP** → Associate to instance (stable public IP for DNS).

### 3) First SSH + install stack

```bash
ssh -i your-key.pem ubuntu@ELASTIC_IP

sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm i -g pm2
sudo snap install --classic certbot
```

### 4) Deploy backend on EC2

```bash
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/anujgupta5686/beaudesert-cafe.git
cd beaudesert-cafe/backend
npm ci --omit=dev
nano .env   # paste production env from section E
pm2 start index.js --name cafe-api
pm2 save
pm2 startup   # follow the command it prints
```

### 5) Deploy frontend on same EC2

```bash
cd ~/apps/beaudesert-cafe/frontend
# create .env.production (see section E)
npm ci
npm run build
# Nginx will serve frontend/dist
```

### 6) Nginx + SSL

Create `/etc/nginx/sites-available/cafe`:

- `yourdomain.com` / `www` → `root` = `.../frontend/dist`
- `api.yourdomain.com` → `proxy_pass http://127.0.0.1:5000`

Then:

```bash
sudo ln -s /etc/nginx/sites-available/cafe /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### 7) GoDaddy DNS

| Type | Name | Value |
|------|------|--------|
| A | @ | EC2 Elastic IP |
| CNAME | www | yourdomain.com |
| A | api | EC2 Elastic IP |

Wait for DNS, then run Certbot if not done yet.

---

## E. Production environment variables

### Backend — `backend/.env` on EC2 (never commit)

```env
APP_ENV=production
NODE_ENV=production
PORT=5000

MONGODB_URI=<client Atlas URI>
# or use MONGODB_URI_PRODUCTION when APP_ENV=production (code supports it)

JWT_SECRET=<long random 32+ chars>
JWT_EXPIRES_IN=7d

BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

MAIL_HOST=smtp.gmail.com
MAIL_USER=<client gmail>
MAIL_PASS=<client app password>
ADMIN_EMAIL=<cafe inbox for new orders>

# Keep Cloudinary for images (no S3 required)
STORAGE_PROVIDER=cloudinary
CLOUD_NAME=...
API_KEY=...
API_SECRET=...

FEEDBACK_EXPIRY_DAYS=30
```

### Frontend — build-time `frontend/.env.production`

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

Rebuild frontend after any `VITE_*` change.

### Code files that already read these (no hardcoding needed)

| Concern | Files |
|---------|--------|
| Env selection / Mongo / storage | `backend/src/config/environment.js` |
| S3 / Cloudinary / local | `backend/src/services/storageService.js` |
| SMTP | `backend/src/config/email.js`, `backend/src/jobs/emailQueue.js` |
| CORS + FRONTEND_URL | `backend/index.js` |
| API base URL (frontend) | `frontend/src/utils/constants.ts` + `VITE_API_URL` |
| Cafe public details | Admin → Cafe Settings (DB), not env |

---

## F. Client email for production

**Option 1 — Client Gmail / Google Workspace (fastest)**  
Same as development: App Password → `MAIL_*`.

**Option 2 — Amazon SES (more professional long-term)**  
1. Verify domain in SES (needs GoDaddy DNS TXT/CNAME).  
2. Move out of SES sandbox (request production access).  
3. Set:

```env
MAIL_HOST=email-smtp.<region>.amazonaws.com
MAIL_PORT=587
MAIL_USER=<SES SMTP username>
MAIL_PASS=<SES SMTP password>
MAIL_SECURE=false
ADMIN_EMAIL=orders@yourdomain.com
```

Until SES is verified, use Gmail App Password so orders never go silent.

---

## G. Go-live order (follow in sequence)

1. Confirm development `/health` → `smtpReady: true` and test all mail flows.  
2. Create AWS account + IAM user.  
3. Create EC2 + Elastic IP + security group.  
4. Create prod Atlas DB user + allow EC2 IP (or `0.0.0.0/0` temporarily).  
5. Put production `.env` on EC2 (Cloudinary + Gmail App Password); start API with PM2.  
6. Build frontend with prod `VITE_API_URL`.  
7. Nginx + SSL.  
8. Point GoDaddy DNS.  
9. Create admin user on prod DB / login.  
10. Update Cafe Settings in admin.  
11. `curl https://api.yourdomain.com/health` → `smtpReady: true`.  
12. Place test order → confirm customer + admin inbox.  
13. Mark completed → feedback email.  

---

## H. What you already have vs what’s next

| Done | Next |
|------|------|
| Client email access | Create Gmail App Password; put on **EC2** `.env` |
| MongoDB Atlas | Whitelist EC2 IP; use prod URI |
| Domain on GoDaddy | DNS A/CNAME → Elastic IP + SSL |
| — | AWS account, EC2, PM2, Nginx (Cloudinary stays — no S3) |

---

## I. Quick commands after deploy

```bash
curl https://api.yourdomain.com/health
# expect smtpReady: true

curl -X POST https://api.yourdomain.com/health/smtp-verify
```
