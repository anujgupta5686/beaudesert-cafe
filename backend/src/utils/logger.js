/**
 * Simple logger — swap for winston/pino in production if needed.
 */
const env = require('../config/environment');

const log = (level, message, meta) => {
  const entry = {
    level,
    message,
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString(),
  };
  if (env.isProduction) {
    console[level === 'error' ? 'error' : 'log'](JSON.stringify(entry));
  } else {
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console[level === 'error' ? 'error' : 'log'](prefix, message, meta || '');
  }
};

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
};
