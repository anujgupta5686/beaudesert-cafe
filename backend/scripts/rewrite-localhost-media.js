/**
 * Rewrite legacy localhost absolute image URLs to portable relative paths.
 * node scripts/rewrite-localhost-media.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const toRelative = (url) => {
  if (!url || typeof url !== 'string') return url;
  try {
    if (url.startsWith('/uploads/')) return url;
    if (!/^https?:\/\//i.test(url)) return url;
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (
      (host === 'localhost' || host === '127.0.0.1') &&
      parsed.pathname.startsWith('/uploads/')
    ) {
      return parsed.pathname;
    }
  } catch {
    return url;
  }
  return url;
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const Menu = require('../src/models/Menu');
  const items = await Menu.find({
    $or: [
      { image: /localhost|127\.0\.0\.1/i },
      { images: { $elemMatch: { $regex: /localhost|127\.0\.0\.1/i } } },
    ],
  });

  let updated = 0;
  for (const item of items) {
    let dirty = false;
    const nextImage = toRelative(item.image);
    if (nextImage !== item.image) {
      item.image = nextImage;
      dirty = true;
    }
    if (Array.isArray(item.images)) {
      const nextImages = item.images.map(toRelative);
      if (JSON.stringify(nextImages) !== JSON.stringify(item.images)) {
        item.images = nextImages;
        dirty = true;
      }
    }
    if (dirty) {
      await item.save();
      updated += 1;
      console.log('updated', item.name, item.image);
    }
  }

  console.log(`Done. Rewrote ${updated} menu document(s).`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
