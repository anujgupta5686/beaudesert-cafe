const env = require('./environment');
const logger = require('../utils/logger');

/**
 * Validate storage-related env at boot so misconfig fails fast.
 */
function assertStorageConfig() {
  const provider = env.storageProvider;

  if (!['local', 'cloudinary', 's3'].includes(provider)) {
    throw new Error(
      `Invalid STORAGE_PROVIDER="${provider}". Use: local | cloudinary | s3`
    );
  }

  if (provider === 'cloudinary') {
    const { cloudName, apiKey, apiSecret } = env.cloudinary;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'STORAGE_PROVIDER=cloudinary requires CLOUD_NAME, API_KEY, and API_SECRET'
      );
    }
  }

  if (provider === 's3') {
    if (!env.aws.bucket) {
      throw new Error('STORAGE_PROVIDER=s3 requires AWS_S3_BUCKET');
    }
    if (!env.aws.region) {
      throw new Error('STORAGE_PROVIDER=s3 requires AWS_REGION');
    }
    // Keys optional on EC2 (IAM role). Warn only when neither keys nor typical IAM setup hint.
    if (!env.aws.accessKeyId || !env.aws.secretAccessKey) {
      logger.warn(
        'AWS access keys not set — using default credential chain (EC2 IAM role / AWS CLI profile)'
      );
    }
  }

  logger.info(`Storage provider: ${provider}`, {
    appEnv: env.appEnv,
    backendUrl: env.backendUrl,
  });
}

module.exports = { assertStorageConfig };
