# Migration Guide — Beaudesert Cafe Professional Upgrade

## What changed

### Backend
- **Categories** — `GET/POST/PUT/DELETE /api/categories`
- **Menu variants** — `hasVariants` + `variants[]` (Small/Medium/Large with prices)
- **Combos** — `POST /api/menu/combo`, products with `productType: "combo"`
- **Feedback** — tokenized links after order success; `GET/POST /api/feedback/:token`, analytics at `GET /api/feedback/analytics`
- **USD** — all emails and APIs format money as `$`
- **Storage** — `storageService.js` (Cloudinary active; S3 ready via `STORAGE_PROVIDER=s3`)
- **Email queue** — `jobs/emailQueue.js` uses BullMQ when `REDIS_URL` is set; otherwise non-blocking `setImmediate`
- **Security** — Helmet, rate limiting, centralized error handler

### Frontend
- USD via `formatPrice`
- Category filters on Menu; Contact page; Feedback page
- Admin: Categories, Combos, Product sizes + category
- Cart supports size (`cartKey`)
- Lazy-loaded routes

## MongoDB update for existing products

Run in MongoDB Compass / mongosh:

```javascript
// 1. Create categories
db.categories.insertMany([
  { name: "Coffee", slug: "coffee", description: "Hot & cold coffee", isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  { name: "Snacks", slug: "snacks", description: "Light bites", isActive: true, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
  { name: "Desserts", slug: "desserts", description: "Sweet treats", isActive: true, sortOrder: 3, createdAt: new Date(), updatedAt: new Date() },
  { name: "Beverages", slug: "beverages", description: "Non-coffee drinks", isActive: true, sortOrder: 4, createdAt: new Date(), updatedAt: new Date() },
  { name: "Combos", slug: "combos", description: "Combo packs", isActive: true, sortOrder: 5, createdAt: new Date(), updatedAt: new Date() }
]);

const coffee = db.categories.findOne({ slug: "coffee" });

// 2. Backfill menu fields + optional USD prices
db.menus.updateMany({}, {
  $set: {
    productType: "normal",
    category: coffee._id,
    hasVariants: true,
    variants: [
      { label: "Small", price: 3.99, isDefault: false },
      { label: "Medium", price: 4.99, isDefault: true },
      { label: "Large", price: 5.99, isDefault: false }
    ],
    comboItems: [],
    originalPrice: 0,
    isActive: true
  }
});

// 3. Example: set base prices in USD for your coffee items
db.menus.updateOne({ name: "Latte Love" }, { $set: { price: 4.99 } });
db.menus.updateOne({ name: "Mocha Motion" }, { $set: { price: 3.49 } });
db.menus.updateOne({ name: "Velvet Roast" }, { $set: { price: 4.79 } });
db.menus.updateOne({ name: "Espresso Etoile" }, { $set: { price: 4.29 } });
db.menus.updateOne({ name: "Caramel Charm" }, { $set: { price: 3.29 } });
db.menus.updateOne({ name: "Rocket Roast" }, { $set: { price: 4.79 } });
```

## Environment

Copy `backend/.env.example` and fill values. Existing Cloudinary vars (`CLOUD_NAME`, `API_KEY`, `API_SECRET`) still work.

Optional:
```
REDIS_URL=redis://...
STORAGE_PROVIDER=cloudinary
FRONTEND_URL=https://beaudesert-cafe-frontend.vercel.app
FEEDBACK_EXPIRY_DAYS=30
```

## Enable BullMQ (optional)

```bash
cd backend
npm install bullmq ioredis
# set REDIS_URL in .env
```

## Enable AWS S3 (optional)

```bash
npm install @aws-sdk/client-s3
# set STORAGE_PROVIDER=s3 and AWS_* vars
# uncomment code in src/services/storageService.js
```

## Deploy

### Render (current)
- Start command: `node index.js`
- Add new env vars from `.env.example`

### EC2 + PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

### Nginx sketch
```
location /api/ {
  proxy_pass http://127.0.0.1:5000;
}
```

## Smoke test checklist
1. Admin → create category
2. Admin → add product with sizes + category
3. Admin → Make Combo from products
4. Public menu filters by category
5. Add sized item to cart → checkout
6. Mark order success → feedback email link works
7. Prices show as `$`
