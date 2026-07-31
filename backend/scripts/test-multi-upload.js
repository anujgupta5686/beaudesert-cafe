/**
 * Quick local check: login + create product with 3 images.
 * Usage: node scripts/test-multi-upload.js [email] [password]
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const email = process.argv[2] || process.env.ADMIN_EMAIL || 'anujgupta5686@gmail.com';
const password = process.argv[3] || process.env.ADMIN_PASSWORD || '';

const tmpDir = path.join(require('os').tmpdir(), 'bc-img-test');
fs.mkdirSync(tmpDir, { recursive: true });

// 1x1 PNG
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);
const files = [1, 2, 3].map((n) => {
  const p = path.join(tmpDir, `t${n}.png`);
  fs.writeFileSync(p, png);
  return p;
});

function request(method, urlPath, { headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: urlPath,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {
            /* ignore */
          }
          resolve({ status: res.statusCode, data, json });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

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
  return {
    boundary,
    body: Buffer.concat(parts),
  };
}

(async () => {
  if (!password) {
    console.log(
      'Pass admin password: node scripts/test-multi-upload.js EMAIL PASSWORD'
    );
    process.exit(1);
  }

  const login = await request('POST', '/api/admin/login', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  console.log('Login status:', login.status);
  if (!login.json?.token && !login.json?.data?.token) {
    console.log(login.data.slice(0, 400));
    process.exit(1);
  }
  const token = login.json.token || login.json.data?.token;

  const { boundary, body } = buildMultipart(
    {
      name: 'Multi Image Test ' + Date.now(),
      description: 'Testing multi image upload locally',
      price: '9.99',
      hasVariants: 'false',
      isAvailable: 'true',
    },
    files
  );

  const create = await request('POST', '/api/menu', {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  console.log('Create status:', create.status);
  const images = create.json?.data?.images || [];
  console.log('images count:', images.length);
  console.log('images:', images);
  console.log('cover image:', create.json?.data?.image);
  if (images.length >= 3) {
    console.log('OK — multi-image upload works');
  } else {
    console.log('FAIL — expected 3 images');
    console.log(create.data.slice(0, 600));
    process.exit(1);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
