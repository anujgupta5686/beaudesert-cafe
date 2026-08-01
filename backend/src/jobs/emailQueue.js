const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');
const redisConfig = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Email delivery for order confirmation + order completed mails.
 * Uses direct SMTP with retries (Render-safe).
 */

let transporter = null;
let queue = null;
let queueReady = false;
let smtpReady = false;
/** Last SMTP error message (no secrets) — exposed via /health for ops */
let lastSmtpError = null;

const buildTransporter = () => {
  if (!emailConfig.isConfigured) {
    throw new Error(
      'Email is not configured. Set MAIL_HOST, MAIL_USER, MAIL_PASS on the server.'
    );
  }

  const isGmail =
    /gmail\.com/i.test(emailConfig.host || '') ||
    /@gmail\.com$/i.test(emailConfig.auth.user || '');

  // Gmail "service" mode is more reliable than raw host/port on some hosts
  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });
  }

  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    requireTLS: emailConfig.requireTLS,
    auth: emailConfig.auth,
    connectionTimeout: 25_000,
    greetingTimeout: 25_000,
    socketTimeout: 40_000,
  });
};

const getTransporter = () => {
  if (!transporter) {
    transporter = buildTransporter();
  }
  return transporter;
};

const resetTransporter = () => {
  transporter = null;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const deliverEmail = async ({ to, subject, html }) => {
  if (!emailConfig.isConfigured) {
    throw new Error(
      'Email is not configured. Set MAIL_HOST, MAIL_USER, MAIL_PASS on Render (Environment).'
    );
  }

  const payload = {
    from: emailConfig.from,
    to,
    subject,
    html,
  };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      logger.info('Sending email', { to, subject, attempt });
      const info = await getTransporter().sendMail(payload);
      logger.info('Email sent', { messageId: info.messageId, to, attempt });
      smtpReady = true;
      lastSmtpError = null;
      return true;
    } catch (err) {
      lastError = err;
      lastSmtpError = err.message || 'Failed to send email';
      logger.error('Email send attempt failed', {
        to,
        attempt,
        error: err.message,
        code: err.code,
        responseCode: err.responseCode,
      });
      resetTransporter();
      if (attempt < 3) await sleep(800 * attempt);
    }
  }

  throw new Error(lastError?.message || 'Failed to send email');
};

const verifySmtp = async () => {
  if (!emailConfig.isConfigured) {
    logger.error(
      'SMTP NOT CONFIGURED — order emails will fail. Set MAIL_HOST, MAIL_USER, MAIL_PASS, ADMIN_EMAIL'
    );
    smtpReady = false;
    lastSmtpError =
      'Email is not configured. Set MAIL_HOST, MAIL_USER, MAIL_PASS, ADMIN_EMAIL';
    return false;
  }
  try {
    await getTransporter().verify();
    smtpReady = true;
    lastSmtpError = null;
    logger.info('SMTP verified OK', {
      host: emailConfig.host,
      user: emailConfig.auth.user,
    });
    return true;
  } catch (err) {
    smtpReady = false;
    lastSmtpError = err.message || 'SMTP verify failed';
    logger.error(
      'SMTP verify FAILED — use a Gmail App Password (not normal password)',
      {
        error: err.message,
        code: err.code,
        responseCode: err.responseCode,
        host: emailConfig.host,
        user: emailConfig.auth.user,
      }
    );
    return false;
  }
};

const initQueue = async () => {
  await verifySmtp();

  if (!redisConfig.enabled) {
    logger.warn('REDIS_URL not set — emails send directly via SMTP');
    return;
  }

  try {
    const { Queue, Worker } = require('bullmq');
    const IORedis = require('ioredis');
    const connection = new IORedis(redisConfig.url, {
      maxRetriesPerRequest: null,
    });

    queue = new Queue('emails', { connection });
    new Worker(
      'emails',
      async (job) => {
        await deliverEmail(job.data);
      },
      { connection }
    );

    queueReady = true;
    logger.info('BullMQ email queue ready');
  } catch (error) {
    logger.warn('BullMQ unavailable — using direct SMTP.', {
      error: error.message,
    });
    queue = null;
    queueReady = false;
  }
};

const assertRecipient = (to, subject) => {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    logger.error('Email skipped — invalid recipient', { to, subject });
    throw new Error(`Invalid email recipient: ${to || '(empty)'}`);
  }
  return to.trim().toLowerCase();
};

const enqueueEmail = async (to, subject, html) => sendEmailNow(to, subject, html);

const sendEmailNow = async (to, subject, html) => {
  const recipient = assertRecipient(to, subject);
  return deliverEmail({ to: recipient, subject, html });
};

module.exports = {
  initQueue,
  verifySmtp,
  enqueueEmail,
  sendEmailNow,
  deliverEmail,
  isSmtpReady: () => smtpReady,
  getSmtpStatus: () => ({
    configured: emailConfig.isConfigured,
    ready: smtpReady,
    host: emailConfig.host,
    user: emailConfig.auth.user
      ? emailConfig.auth.user.replace(/(.{2}).+(@.+)/, '$1***$2')
      : null,
    lastError: lastSmtpError,
  }),
};
