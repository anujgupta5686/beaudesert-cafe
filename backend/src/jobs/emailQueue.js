const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');
const redisConfig = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Background email queue.
 * - If REDIS_URL is set and bullmq is installed: uses BullMQ
 * - Otherwise: direct SMTP (awaited for order mails via sendEmailNow)
 */

let transporter = null;
let queue = null;
let queueReady = false;
let smtpReady = false;

const getTransporter = () => {
  if (!transporter) {
    if (!emailConfig.isConfigured) {
      throw new Error(
        'Email is not configured. Set MAIL_HOST, MAIL_USER, MAIL_PASS on the server.'
      );
    }
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      requireTLS: emailConfig.requireTLS,
      auth: emailConfig.auth,
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 30_000,
    });
  }
  return transporter;
};

const deliverEmail = async ({ to, subject, html }) => {
  if (!emailConfig.isConfigured) {
    throw new Error(
      'Email is not configured. Set MAIL_HOST, MAIL_USER, MAIL_PASS on Render.'
    );
  }
  logger.info('Sending email', { to, subject });
  const info = await getTransporter().sendMail({
    from: emailConfig.from,
    to,
    subject,
    html,
  });
  logger.info('Email sent', { messageId: info.messageId, to });
  return true;
};

/** Call once at boot — logs clear SMTP status for Render debugging */
const verifySmtp = async () => {
  if (!emailConfig.isConfigured) {
    logger.error(
      'SMTP NOT CONFIGURED — order emails will fail. Set MAIL_HOST, MAIL_USER, MAIL_PASS, ADMIN_EMAIL'
    );
    smtpReady = false;
    return false;
  }
  try {
    await getTransporter().verify();
    smtpReady = true;
    logger.info('SMTP verified OK', {
      host: emailConfig.host,
      user: emailConfig.auth.user,
    });
    return true;
  } catch (err) {
    smtpReady = false;
    logger.error('SMTP verify FAILED — check MAIL_USER / MAIL_PASS (Gmail App Password)', {
      error: err.message,
      host: emailConfig.host,
      user: emailConfig.auth.user,
    });
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
    logger.warn(
      'BullMQ unavailable — using direct SMTP.',
      { error: error.message }
    );
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

/** Prefer awaited send for reliability (Render can drop fire-and-forget work) */
const enqueueEmail = async (to, subject, html) => {
  return sendEmailNow(to, subject, html);
};

/** Await SMTP delivery so API/logs show real success/failure */
const sendEmailNow = async (to, subject, html) => {
  const recipient = assertRecipient(to, subject);
  // Always send directly — reliable on Render (no dependency on queue worker)
  return deliverEmail({ to: recipient, subject, html });
};

module.exports = {
  initQueue,
  verifySmtp,
  enqueueEmail,
  sendEmailNow,
  deliverEmail,
  isSmtpReady: () => smtpReady,
};
