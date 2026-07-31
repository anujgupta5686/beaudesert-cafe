/**
 * E2E: create a product with 3 images using a short-lived admin JWT.
 * node scripts/test-create-multi-product.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

function buildMultipart(fields, filePaths) {
  const boundary = '----bc' + Date.now();
  const parts = [];
  for (const [name, val] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${val}\r\n`
      )
    );
  }
  for (const filePath of filePaths) {
    const data = fs.readFileSync(filePath);
    const fname = path.basename(filePath);
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="${fname}"\r\nContent-Type: image/png\r\n\r\n`
      )
    );
    parts.push(data);
    parts.push(Buffer.from('\r\n'));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(parts) };
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const Admin = require('../src/models/Admin');
  const admin = await Admin.findOne().lean();
  if (!admin) throw new Error('No admin found');

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  console.log('Using admin:', admin.email);

  const dir = path.join(os.tmpdir(), 'bc-http-test');
  fs.mkdirSync(dir, { recursive: true });
  const files = [1, 2, 3].map((n) => {
    const p = path.join(dir, `t${n}.png`);
    fs.writeFileSync(p, png);
    return p;
  });

  const { boundary, body } = buildMultipart(
    {
      name: 'Carousel Check ' + Date.now(),
      description: 'E2E multi image product',
      price: '4.50',
      hasVariants: 'false',
      isAvailable: 'true',
    },
    files
  );

  const res = await fetch('http://localhost:5000/api/menu', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });
  const text = await res.text();
  console.log('status', res.status);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.log(text.slice(0, 500));
    process.exit(1);
  }

  const images = json?.data?.images || [];
  console.log('images count:', images.length);
  console.log(images);
  await mongoose.disconnect();

  if (res.status !== 201 || images.length < 3) {
    console.error('FAIL', json?.message || text.slice(0, 300));
    process.exit(1);
  }
  console.log('OK — product created with', images.length, 'images');
  console.log('Open Menu page and look for:', json.data.name);
})().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
