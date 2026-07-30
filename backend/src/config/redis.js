/**
 * Redis configuration.
 * Leave REDIS_URL empty to disable queue/cache (emails still send async via setImmediate).
 */
const env = require('./environment');

module.exports = {
  url: env.redisUrl,
  enabled: Boolean(env.redisUrl),
};
