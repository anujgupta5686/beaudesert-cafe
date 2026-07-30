const logger = require('../utils/logger');

/**
 * Centralized Express error handler
 */
const errorHandler = (err, req, res, next) => {
  logger.error(err.message || 'Unhandled error', {
    stack: err.stack,
    path: req.path,
  });

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
