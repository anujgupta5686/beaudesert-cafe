const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/environment');
const logger = require('../utils/logger');

/**
 * Unified media storage service.
 *
 * Switch with STORAGE_PROVIDER only:
 *   local      → backend/uploads (stores absolute BACKEND_URL link in DB)
 *   cloudinary → Cloudinary secure_url stored in DB
 *   s3         → S3/CloudFront public URL stored in DB
 *
 * Menu.create / update always persist `uploaded.url` on `image` + `images[]`.
 * Frontend never hardcodes product data — it always loads from the API.
 */
const toFileArray = (files) => {
  if (!files) return [];
  return Array.isArray(files) ? files : [files];
};

/** Collect image files from express-fileupload (handles images / image / images[0]) */
const collectImageFiles = (reqFiles) => {
  if (!reqFiles) return [];
  const collected = [];
  for (const key of Object.keys(reqFiles)) {
    const lower = key.toLowerCase();
    if (
      lower === 'images' ||
      lower === 'image' ||
      lower.startsWith('images[') ||
      lower === 'images[]'
    ) {
      collected.push(...toFileArray(reqFiles[key]));
    }
  }
  return collected.slice(0, 6);
};

const readFileBuffer = (file) => {
  if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
    return fs.readFileSync(file.tempFilePath);
  }
  if (file.data && file.data.length) {
    return file.data;
  }
  throw new Error(
    'Upload file has no temp path or data buffer — check express-fileupload tempFileDir'
  );
};

const safeExt = (file) => {
  const fromName = path.extname(file.name || '').toLowerCase();
  if (fromName && fromName.length <= 8) return fromName;
  const mime = (file.mimetype || '').toLowerCase();
  if (mime.includes('png')) return '.png';
  if (mime.includes('webp')) return '.webp';
  if (mime.includes('gif')) return '.gif';
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  if (mime.includes('mp4')) return '.mp4';
  if (mime.includes('webm')) return '.webm';
  return '.bin';
};

const uniqueName = (file) =>
  `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${safeExt(file)}`;

let s3Client = null;

const getS3Client = () => {
  if (s3Client) return s3Client;
  const { S3Client } = require('@aws-sdk/client-s3');
  const s3Config = require('../config/s3');

  const options = { region: s3Config.region };
  if (s3Config.hasExplicitCredentials) {
    options.credentials = {
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
    };
  }
  s3Client = new S3Client(options);
  return s3Client;
};

const publicS3Url = (key) => {
  const s3Config = require('../config/s3');
  if (s3Config.publicBaseUrl) {
    return `${s3Config.publicBaseUrl}/${key}`;
  }
  return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
};

const storageService = {
  collectImageFiles,

  async uploadImage(file, folder = 'cafe_menu') {
    if (!file) throw new Error('No file provided for upload');
    const provider = env.storageProvider;

    if (provider === 's3') {
      return this.uploadToS3(file, folder);
    }
    if (provider === 'local') {
      return this.uploadToLocal(file, folder);
    }
    if (provider === 'cloudinary') {
      return this.uploadToCloudinary(file, folder);
    }

    throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
  },

  /** Upload one or many express-fileupload files; returns URL strings (max 6) */
  async uploadImages(files, folder = 'cafe_menu') {
    const list = toFileArray(files).slice(0, 6);
    if (!list.length) return [];
    const urls = [];
    for (const file of list) {
      const uploaded = await this.uploadImage(file, folder);
      if (uploaded?.url) urls.push(uploaded.url);
    }
    return urls;
  },

  async uploadToLocal(file, folder) {
    const uploadsRoot = path.join(__dirname, '../../uploads');
    const destDir = path.join(uploadsRoot, folder);
    fs.mkdirSync(destDir, { recursive: true });

    const name = uniqueName(file);
    const dest = path.join(destDir, name);
    fs.writeFileSync(dest, readFileBuffer(file));

    // File on disk under backend/uploads; DB stores the public link for this environment
    const relativePath = `/uploads/${folder}/${name}`;
    const absoluteUrl = `${env.backendUrl}${relativePath}`;
    logger.info('Uploaded to local disk', { relativePath, absoluteUrl });
    return {
      url: absoluteUrl,
      relativePath,
      publicId: `${folder}/${name}`,
      provider: 'local',
    };
  },

  async uploadToCloudinary(file, folder) {
    const cloudinary = require('cloudinary').v2;
    const bufferPath = file.tempFilePath;
    if (!bufferPath || !fs.existsSync(bufferPath)) {
      throw new Error(
        'Temp upload file missing — check express-fileupload tempFileDir on Windows'
      );
    }

    logger.info('Uploading to Cloudinary', {
      folder,
      name: file.name,
    });

    const result = await cloudinary.uploader.upload(bufferPath, {
      folder,
      resource_type: 'auto',
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
   * AWS S3 upload — production path for EC2 / AWS.
   * Bucket should allow public read for uploaded objects (bucket policy)
   * or serve via CloudFront (set AWS_S3_PUBLIC_URL).
   */
  async uploadToS3(file, folder) {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3Config = require('../config/s3');

    if (!s3Config.bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    const name = uniqueName(file);
    const prefix = s3Config.keyPrefix ? `${s3Config.keyPrefix}/` : '';
    const key = `${prefix}${folder}/${name}`;
    const body = readFileBuffer(file);
    const contentType = file.mimetype || 'application/octet-stream';

    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    const url = publicS3Url(key);
    logger.info('Uploaded to S3', { key, url });
    return { url, publicId: key, provider: 's3' };
  },
};

module.exports = storageService;
