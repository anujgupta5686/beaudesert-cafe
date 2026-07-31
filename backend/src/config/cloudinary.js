const cloudinary = require('cloudinary').v2;
const env = require('./environment');

/**
 * Configure Cloudinary only when STORAGE_PROVIDER=cloudinary.
 * Safe no-op for local / S3 environments.
 */
const cloudinaryConnection = () => {
  if (env.storageProvider !== 'cloudinary') {
    return false;
  }

  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    console.warn(
      '⚠️  STORAGE_PROVIDER=cloudinary but CLOUD_NAME / API_KEY / API_SECRET are missing'
    );
    return false;
  }

  try {
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
    });
    console.log('✅ Cloudinary Connected Successfully');
    return true;
  } catch (error) {
    console.log('❌ Error connecting to Cloudinary:', error);
    return false;
  }
};

module.exports = cloudinaryConnection;
