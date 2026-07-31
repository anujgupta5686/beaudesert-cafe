/**
 * AWS S3 configuration.
 * Set STORAGE_PROVIDER=s3 and AWS_* env vars (see .env.example).
 *
 * On EC2 you can omit AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY and attach
 * an IAM instance role instead — the SDK default credential chain is used.
 */
const env = require('./environment');

module.exports = {
  accessKeyId: env.aws.accessKeyId,
  secretAccessKey: env.aws.secretAccessKey,
  region: env.aws.region,
  bucket: env.aws.bucket,
  publicBaseUrl: env.aws.publicBaseUrl,
  keyPrefix: env.aws.keyPrefix,

  /** True when explicit keys are present (otherwise rely on IAM / env chain) */
  hasExplicitCredentials: Boolean(
    env.aws.accessKeyId && env.aws.secretAccessKey
  ),
};
