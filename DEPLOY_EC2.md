# Deploy Beaudesert Cafe on AWS EC2 (frontend + backend, Cloudinary, no S3)

GitHub: https://github.com/anujgupta5686/beaudesert-cafe.git  
Region (from your console): **Asia Pacific (Sydney) `ap-southeast-2`**

---

## Part 1 — Launch EC2 (AWS Console clicks)

You are already on the AWS home screen with **EC2** under Recently visited.

1. Click **EC2**.
2. Left menu → **Instances** → orange **Launch instances**.
3. Settings:
   - **Name:** `beaudesert-cafe-prod`
   - **Application and OS Images:** Ubuntu Server **22.04 LTS**
   - **Instance type:** `t3.small`
   - **Key pair:** Create new key pair → name `beaudesert-cafe` → `.pem` → **Download** (keep this file)
   - **Network settings** → Edit:
     - Allow **SSH** from **My IP**
     - Allow **HTTP** from Anywhere (`0.0.0.0/0`)
     - Allow **HTTPS** from Anywhere (`0.0.0.0/0`)
   - **Storage:** 25 GB gp3
4. Click **Launch instance**.
5. Left menu → **Network & Security** → **Elastic IPs**:
   - **Allocate Elastic IP address** → Allocate
   - **Actions** → **Associate Elastic IP address** → select your instance → Associate
6. Copy the **Elastic IP** (example `13.xx.xx.xx`) and send it in chat.

---

## Part 2 — Connect + install (your PC PowerShell / Terminal)

Replace `ELASTIC_IP` and path to your `.pem`:

```bash
chmod 400 beaudesert-cafe.pem
ssh -i beaudesert-cafe.pem ubuntu@ELASTIC_IP
```

On the server:

```bash
curl -fsSL https://raw.githubusercontent.com/anujgupta5686/beaudesert-cafe/main/deploy/ec2-setup.sh | bash
```

Or:

```bash
git clone https://github.com/anujgupta5686/beaudesert-cafe.git ~/apps/beaudesert-cafe
bash ~/apps/beaudesert-cafe/deploy/ec2-setup.sh
```

---

## Part 3 — Put production secrets on the server

### Backend

```bash
nano ~/apps/beaudesert-cafe/backend/.env
```

Paste production values (Mongo, mail, Cloudinary, JWT).  
Template: `deploy/backend.env.production.example`

Until domain/SSL exists, temporary URLs can be:

```env
BACKEND_URL=http://ELASTIC_IP
FRONTEND_URL=http://ELASTIC_IP
```

After domain + SSL, change to:

```env
BACKEND_URL=https://api.YOUR_DOMAIN.com
FRONTEND_URL=https://YOUR_DOMAIN.com
```

Then `pm2 restart cafe-api --update-env`.

### Frontend (must set before build)

```bash
nano ~/apps/beaudesert-cafe/frontend/.env.production
```

```env
VITE_API_URL=https://api.YOUR_DOMAIN.com/api
```

(Temporary test by IP only if needed: `http://ELASTIC_IP:5000/api` — better wait for domain.)

---

## Part 4 — First deploy (API + frontend build)

```bash
bash ~/apps/beaudesert-cafe/deploy/ec2-deploy.sh
curl -s http://127.0.0.1:5000/health
# Need: "smtpReady": true
```

---

## Part 5 — Nginx

```bash
sudo cp ~/apps/beaudesert-cafe/deploy/nginx/cafe.conf /etc/nginx/sites-available/cafe
sudo nano /etc/nginx/sites-available/cafe
# Replace EVERY Your YOUR_DOMAIN with real domain (e.g. beaudesertcafe.com)
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/cafe /etc/nginx/sites-enabled/cafe
sudo nginx -t
sudo systemctl reload nginx
```

---

## Part 6 — GoDaddy DNS (what we need from you)

**Send in chat:**

1. Exact domain name (example: `beaudesertcafe.com`)
2. Confirm you can edit DNS (or paste a screenshot of DNS records page)

**You will add these records in GoDaddy → DNS → Manage DNS:**

| Type | Name | Value | TTL |
|------|------|--------|-----|
| A | `@` | `ELASTIC_IP` | 600 |
| CNAME | `www` | `@` (or your domain) | 600 |
| A | `api` | `ELASTIC_IP` | 600 |

Wait 5–30 minutes for DNS.

Then on EC2:

```bash
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN -d api.YOUR_DOMAIN
```

Update `backend/.env` `BACKEND_URL` / `FRONTEND_URL` to `https://...`, update frontend `.env.production`, then:

```bash
bash ~/apps/beaudesert-cafe/deploy/ec2-deploy.sh
```

---

## Part 7 — First admin + smoke test

Production Mongo DB is empty until you register/create an admin.

1. Open `https://YOUR_DOMAIN/admin/login` (or register endpoint if first admin)
2. Place a test order → check `beaudesertcafe@gmail.com` inbox
3. Mark order completed → customer mail
4. Upload a product image → Cloudinary URL in admin

Health check:

```bash
curl -s https://api.YOUR_DOMAIN.com/health
```

---

## Later updates (after code push to GitHub main)

```bash
ssh -i beaudesert-cafe.pem ubuntu@ELASTIC_IP
bash ~/apps/beaudesert-cafe/deploy/ec2-deploy.sh
```

---

## What to send me next (order)

1. **Elastic IP** (after Part 1)
2. **Domain name** from GoDaddy  
3. Screenshot or confirmation that DNS A / api records are set  
4. Tell me when SSH works — I can give the exact `.env` lines with your domain filled in (you paste secrets on the server yourself)
