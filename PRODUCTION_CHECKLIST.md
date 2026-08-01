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

## C. Production architecture (recommended)

```
GoDaddy DNS
    │
    ├── cafe-domain.com        → Frontend (Nginx on EC2 or S3+CloudFront)
    └── api.cafe-domain.com    → Backend Express on EC2
              │
              ├── MongoDB Atlas (prod URI)
              ├── S3 bucket (media)
              └── SMTP (client Gmail App Password  OR  Amazon SES)
```

---

## D. Step-by-step: AWS + EC2 + S3

### 1) Create AWS account (client)

1. Use client email / business email.
2. Add payment method (client card).
3. Enable MFA on root + create an IAM admin user for you (never use root daily).

### 2) Create EC2 instance

1. Region: pick closest (e.g. `ap-southeast-2` for Australia).
2. AMI: Ubuntu 22.04 LTS.
3. Instance: `t3.small` (start); enlarge later if needed.
4. Storage: 20–30 GB gp3.
5. Security group inbound:
   - `22` SSH (your IP only)
   - `80` HTTP (0.0.0.0/0)
   - `443` HTTPS (0.0.0.0/0)
6. Allocate **Elastic IP** and attach (so DNS stays stable).
7. SSH in, install: Node 20, Nginx, Certbot, PM2, git.

### 3) Create S3 bucket for media

1. Bucket name: e.g. `beaudesert-cafe-media-prod` (globally unique).
2. Block public access: turn **off** only if you serve via public object URLs; **or** keep private + CloudFront (better).
3. Simple public-read approach (faster start):
   - Bucket policy allow `s3:GetObject` on `arn:aws:s3:::BUCKET/*`
4. Create IAM user `cafe-s3-uploader` with policy: `s3:PutObject`, `s3:DeleteObject`, `s3:GetObject` on that bucket.
5. Save `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`.

CORS (bucket → Permissions → CORS):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["https://YOUR-DOMAIN.com", "https://www.YOUR-DOMAIN.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 4) Deploy backend on EC2

```bash
# on EC2
git clone <repo>
cd beaudesert-cafe/backend
npm ci --omit=dev
# create /home/ubuntu/apps/beaudesert-cafe/backend/.env  (see section E)
pm2 start index.js --name cafe-api
pm2 save
```

Nginx reverse proxy: `api.yourdomain.com` → `http://127.0.0.1:5000`  
Certbot: `sudo certbot --nginx -d api.yourdomain.com`

### 5) Deploy frontend

Option A — same EC2 (simple):

```bash
cd frontend
# create .env.production with VITE_API_URL=https://api.yourdomain.com/api
npm ci
npm run build
# serve dist/ with Nginx
```

Option B — S3 + CloudFront for static frontend (more “AWS native”).

### 6) GoDaddy DNS

| Type | Name | Value |
|------|------|--------|
| A | @ | EC2 Elastic IP |
| CNAME | www | yourdomain.com |
| A or CNAME | api | EC2 Elastic IP (or subdomain A) |

Wait for DNS propagation, then Certbot HTTPS.

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

STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET=beaudesert-cafe-media-prod
# AWS_S3_PUBLIC_URL=https://beaudesert-cafe-media-prod.s3.ap-southeast-2.amazonaws.com
# AWS_S3_KEY_PREFIX=beaudesert-cafe

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
3. Create S3 + IAM keys.  
4. Create EC2 + Elastic IP + security group.  
5. Create prod Atlas DB user + allow EC2 IP / `0.0.0.0/0` (tighten later).  
6. Put production `.env` on EC2; start API with PM2.  
7. Build frontend with prod `VITE_API_URL`.  
8. Nginx + SSL.  
9. Point GoDaddy DNS.  
10. Seed/create admin user on prod DB.  
11. Update Cafe Settings in admin.  
12. Place a real test order → check customer + admin inbox.  
13. Mark completed → feedback email.  
14. Upload a product image → confirm S3 URL in Mongo.  

---

## H. What you already have vs what’s next

| Done | Next |
|------|------|
| Client email access | Create Gmail App Password; set on Render then EC2 |
| MongoDB Atlas | Separate **prod** cluster/DB if possible; whitelist EC2 IP |
| Domain on GoDaddy | DNS A/CNAME + SSL |
| — | AWS account, EC2, S3, PM2, Nginx, env files |

---

## I. Quick commands after deploy

```bash
curl https://api.yourdomain.com/health
# expect smtpReady: true

curl -X POST https://api.yourdomain.com/health/smtp-verify
```
