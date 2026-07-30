const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');

dotenv.config();

const env = require('./src/config/environment');
const connectDB = require('./src/config/db');
const cloudinaryConnection = require('./src/config/cloudinary');
const { initQueue } = require('./src/jobs/emailQueue');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const { authLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

connectDB();
cloudinaryConnection();
initQueue().catch((err) => logger.warn('Email queue init failed', { error: err.message }));

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
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins].filter(Boolean))];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (Postman, health checks) with no Origin
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
    tempFileDir: '/tmp',
  })
);

// Routes
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
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${env.nodeEnv}`);
});

module.exports = app;
