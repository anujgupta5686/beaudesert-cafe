/**
 * Verifies multi-file upload without auth (active STORAGE_PROVIDER).
 * node scripts/test-upload-images-only.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');

const env = require('../src/config/environment');
const { assertStorageConfig } = require('../src/config/storage');
const cloudinaryConnection = require('../src/config/cloudinary');

assertStorageConfig();
cloudinaryConnection();

const storageService = require('../src/services/storageService');

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

(async () => {
  console.log('Provider:', env.storageProvider);
  const tmp = path.join(
    os.tmpdir(),
    'beaudesert-cafe-uploads',
    'test-' + Date.now()
  );
  fs.mkdirSync(tmp, { recursive: true });

  const fakeReqFiles = { images: [] };
  for (let i = 1; i <= 3; i++) {
    const tempFilePath = path.join(tmp, `t${i}.png`);
    fs.writeFileSync(tempFilePath, png);
    fakeReqFiles.images.push({
      name: `t${i}.png`,
      mimetype: 'image/png',
      tempFilePath,
      size: png.length,
    });
  }

  const collected = storageService.collectImageFiles(fakeReqFiles);
  console.log('collected:', collected.length);

  const urls = await storageService.uploadImages(collected);
  console.log('uploaded:', urls.length);
  urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));

  if (urls.length !== 3) {
    console.error('FAIL');
    process.exit(1);
  }
  console.log('OK — storage uploads 3 images via', env.storageProvider);
  process.exit(0);
})().catch((err) => {
  console.error('ERROR', err);
  process.exit(1);
});
