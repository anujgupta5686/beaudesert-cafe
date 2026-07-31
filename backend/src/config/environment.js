require('dotenv').config();

/**
 * Centralized environment configuration.
 * Switch environments by changing .env only — no code changes needed.
 *
 * Typical setups:
 *   Local:        APP_ENV=local        STORAGE_PROVIDER=local
 *   GitHub/dev:   APP_ENV=development  STORAGE_PROVIDER=cloudinary|s3
 *   AWS EC2:      APP_ENV=production   STORAGE_PROVIDER=s3
 */
const nodeEnv = process.env.NODE_ENV || 'development';
const appEnv = process.env.APP_ENV || nodeEnv;

const env = {
  nodeEnv,
  /** local | development | production — used for logging / health only */
  appEnv,
  port: Number(process.env.PORT) || 5000,
  isProduction: nodeEnv === 'production' || appEnv === 'production',
  isLocal: appEnv === 'local' || (!process.env.APP_ENV && nodeEnv === 'development'),

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

  /** Public frontend origin (CORS + email/feedback links) */
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  /**
   * Public backend origin (no /api suffix).
   * Used for local disk upload URLs: `${backendUrl}/uploads/...`
   * EC2 example: https://api.yourdomain.com
   */
  backendUrl: (
    process.env.BACKEND_URL ||
    `http://localhost:${Number(process.env.PORT) || 5000}`
  ).replace(/\/$/, ''),

  feedbackExpiryDays: Number(process.env.FEEDBACK_EXPIRY_DAYS) || 30,

  /**
   * Storage: local | cloudinary | s3
   * Default cloudinary so Render/dev keeps working with existing Cloudinary env.
   * Local Windows: set STORAGE_PROVIDER=local in backend/.env
   * EC2/production: set STORAGE_PROVIDER=s3
   */
  storageProvider: (process.env.STORAGE_PROVIDER || 'cloudinary').toLowerCase(),

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
    /**
     * Optional CDN / custom domain for public objects.
     * Example: https://cdn.yourdomain.com  or CloudFront URL
     * If empty, uses virtual-hosted S3 URL.
     */
    publicBaseUrl: (process.env.AWS_S3_PUBLIC_URL || '').replace(/\/$/, ''),
    /** Key prefix inside the bucket, e.g. cafe/prod */
    keyPrefix: (process.env.AWS_S3_KEY_PREFIX || 'beaudesert-cafe').replace(
      /^\/|\/$/g,
      ''
    ),
  },

  redisUrl: process.env.REDIS_URL || '',
};

module.exports = env;
