/**
 * AWS S3 configuration (ready to enable).
 * Set STORAGE_PROVIDER=s3 and fill AWS_* env vars to switch.
 */
const env = require('./environment');

module.exports = {
  accessKeyId: env.aws.accessKeyId,
  secretAccessKey: env.aws.secretAccessKey,
  region: env.aws.region,
  bucket: env.aws.bucket,
};
