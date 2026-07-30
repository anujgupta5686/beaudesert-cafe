const cloudinary = require('cloudinary').v2;
const env = require('../config/environment');
const logger = require('../utils/logger');

/**
 * Unified media storage service.
 * Switch provider via STORAGE_PROVIDER=cloudinary|s3
 *
 * AWS S3 path is ready — uncomment / install @aws-sdk/client-s3 to enable.
 */
const storageService = {
  async uploadImage(file, folder = 'cafe_menu') {
    const provider = env.storageProvider;

    if (provider === 's3') {
      return this.uploadToS3(file, folder);
    }

    return this.uploadToCloudinary(file, folder);
  },

  async uploadToCloudinary(file, folder) {
    logger.info('Uploading to Cloudinary', { folder });
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder,
      width: 800,
      height: 800,
      crop: 'limit',
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary',
    };
  },

  /**
   * AWS S3 upload (ready to enable).
   * 1. npm install @aws-sdk/client-s3
   * 2. Set STORAGE_PROVIDER=s3 and AWS_* env vars
   */
  async uploadToS3(file, folder) {
    /*
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const fs = require('fs');
    const path = require('path');
    const s3Config = require('../config/s3');

    const client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });

    const key = `${folder}/${Date.now()}-${path.basename(file.name)}`;
    const body = fs.readFileSync(file.tempFilePath);

    await client.send(
      new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
        Body: body,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
    );

    const url = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
    return { url, publicId: key, provider: 's3' };
    */

    throw new Error(
      'S3 storage is not enabled. Install @aws-sdk/client-s3 and uncomment uploadToS3, or set STORAGE_PROVIDER=cloudinary.'
    );
  },
};

module.exports = storageService;
