const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
const os = require('os');
const path = require('path');

dotenv.config();

const env = require('./src/config/environment');
const connectDB = require('./src/config/db');
const cloudinaryConnection = require('./src/config/cloudinary');
const { assertStorageConfig } = require('./src/config/storage');
const { initQueue } = require('./src/jobs/emailQueue');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const { authLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

assertStorageConfig();
connectDB();
cloudinaryConnection();
initQueue().catch((err) =>
  logger.warn('Email queue init failed', { error: err.message })
);

const app = express();
const PORT = env.port;

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

/** Build allowed CORS origins from env + safe defaults */
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://beaudesert-cafe-frontend.vercel.app',
  'https://beaudesert-cafe-frontend.onrender.com',
];
const envOrigins = [
  env.frontendUrl,
  ...(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
];
const allowedOrigins = [
  ...new Set([...defaultOrigins, ...envOrigins].filter(Boolean)),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      logger.warn('CORS blocked origin', { origin, allowedOrigins });
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(os.tmpdir(), 'beaudesert-cafe-uploads'),
    createParentPath: true,
    limits: { files: 6, fileSize: 12 * 1024 * 1024 },
    abortOnLimit: true,
  })
);

// Served when STORAGE_PROVIDER=local (also harmless if unused)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/menu', require('./src/routes/menuRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/admin', authLimiter, require('./src/routes/adminRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/feedback', require('./src/routes/feedbackRoutes'));
app.use('/api/cafe-settings', require('./src/routes/cafeSettingsRoutes'));
app.use('/api/contact', require('./src/routes/contactRoutes'));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Beaudesert Cafe API is running',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    appEnv: env.appEnv,
    storageProvider: env.storageProvider,
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    appEnv: env.appEnv,
    storageProvider: env.storageProvider,
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`APP_ENV=${env.appEnv} NODE_ENV=${env.nodeEnv}`);
  logger.info(`STORAGE_PROVIDER=${env.storageProvider}`);
  logger.info(`BACKEND_URL=${env.backendUrl}`);
  logger.info(`FRONTEND_URL=${env.frontendUrl}`);
});

module.exports = app;
