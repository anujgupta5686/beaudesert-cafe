require('dotenv').config();

/**
 * Centralized environment configuration.
 * Prefer setting values in `.env` / host dashboard.
 * Sensible defaults: local → disk uploads; Render/dev → Cloudinary.
 *
 * Local:        APP_ENV=local          STORAGE_PROVIDER=local (auto)
 * GitHub/dev:   APP_ENV=development    STORAGE_PROVIDER=cloudinary (auto on Render)
 * AWS EC2:      APP_ENV=production     STORAGE_PROVIDER=s3 (set explicitly)
 */

const nodeEnv = process.env.NODE_ENV || 'development';
const appEnv = (process.env.APP_ENV || nodeEnv).toLowerCase();

/** True when running on a known cloud host */
const isHosted = Boolean(
  process.env.RENDER ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.FLY_APP_NAME ||
    process.env.VERCEL
);

const isLocal =
  appEnv === 'local' ||
  (!process.env.APP_ENV && !isHosted && nodeEnv === 'development');

const port = Number(process.env.PORT) || 5000;

/** Public API origin (no /api). Render injects RENDER_EXTERNAL_URL automatically. */
const backendUrl = (
  process.env.BACKEND_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${port}`
).replace(/\/$/, '');

/**
 * Storage provider resolution:
 * 1. Explicit STORAGE_PROVIDER always wins
 * 2. Local machine → local disk
 * 3. Hosted / non-local → cloudinary (override to s3 when ready)
 */
const storageProvider = (
  process.env.STORAGE_PROVIDER ||
  (isLocal && !isHosted ? 'local' : 'cloudinary')
).toLowerCase();

const env = {
  nodeEnv,
  appEnv,
  port,
  isProduction: nodeEnv === 'production' || appEnv === 'production',
  isLocal,
  isHosted,

  mongodbUri: process.env.MONGODB_URI,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  mail: {
    host: process.env.MAIL_HOST,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    adminEmail: process.env.ADMIN_EMAIL,
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl,
  feedbackExpiryDays: Number(process.env.FEEDBACK_EXPIRY_DAYS) || 30,

  storageProvider,

  cloudinary: {
    cloudName: process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.API_KEY || process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.API_SECRET || process.env.CLOUDINARY_API_SECRET,
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || '',
    publicBaseUrl: (process.env.AWS_S3_PUBLIC_URL || '').replace(/\/$/, ''),
    keyPrefix: (process.env.AWS_S3_KEY_PREFIX || 'beaudesert-cafe').replace(
      /^\/|\/$/g,
      ''
    ),
  },

  redisUrl: process.env.REDIS_URL || '',
};

module.exports = env;
