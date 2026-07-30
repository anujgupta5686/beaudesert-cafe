/**
 * JWT configuration helpers
 */
const env = require('./environment');

module.exports = {
  secret: env.jwt.secret,
  expiresIn: env.jwt.expiresIn,
};
