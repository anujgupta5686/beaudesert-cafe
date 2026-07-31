/**
 * Email / SMTP configuration
 * Required on Render for order emails:
 *   MAIL_HOST=smtp.gmail.com
 *   MAIL_USER=your@gmail.com
 *   MAIL_PASS=16-char Google App Password (no spaces)
 *   ADMIN_EMAIL=admin@cafe.com
 */
const env = require('./environment');

const strip = (v) => (typeof v === 'string' ? v.trim() : v);
/** Gmail app passwords are often copied with spaces — remove them */
const appPassword = strip(env.mail.pass || '').replace(/\s+/g, '');

const user = strip(env.mail.user || '');
const host = strip(env.mail.host || '') || 'smtp.gmail.com';
const adminEmail = strip(env.mail.adminEmail || '') || user;

module.exports = {
  host,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === 'true',
  requireTLS: process.env.MAIL_SECURE !== 'true',
  auth: {
    user,
    pass: appPassword,
  },
  from: user ? `"Beaudesert Cafe" <${user}>` : undefined,
  adminEmail,
  isConfigured: Boolean(host && user && appPassword),
};
