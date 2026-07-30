/**
 * Email / SMTP configuration
 */
const env = require('./environment');

module.exports = {
  host: env.mail.host,
  port: 587,
  secure: false,
  auth: {
    user: env.mail.user,
    pass: env.mail.pass,
  },
  from: env.mail.user,
  adminEmail: env.mail.adminEmail,
};
