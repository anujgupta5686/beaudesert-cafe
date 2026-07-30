require('dotenv').config();

/**
 * Centralized environment configuration.
 * Update credentials via .env — never hardcode secrets.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  isProduction: process.env.NODE_ENV === 'production',

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
  feedbackExpiryDays: Number(process.env.FEEDBACK_EXPIRY_DAYS) || 30,

  /** Storage provider: 'cloudinary' | 's3' */
  storageProvider: process.env.STORAGE_PROVIDER || 'cloudinary',

  cloudinary: {
    cloudName: process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.API_KEY || process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.API_SECRET || process.env.CLOUDINARY_API_SECRET,
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET,
  },

  redisUrl: process.env.REDIS_URL || '',
};

module.exports = env;
