const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');
const redisConfig = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Background email queue.
 * - If REDIS_URL is set and bullmq is installed: uses BullMQ
 * - Otherwise: setImmediate fallback (non-blocking, no Redis required on Render)
 */

let transporter = null;
let queue = null;
let queueReady = false;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }
  return transporter;
};

const deliverEmail = async ({ to, subject, html }) => {
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

const initQueue = async () => {
  if (!redisConfig.enabled) {
    logger.warn('REDIS_URL not set — using async fallback for emails');
    return;
  }

  try {
    // Optional dependency — only load when Redis is configured
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
      'BullMQ unavailable — falling back to setImmediate. Install bullmq + ioredis and set REDIS_URL to enable.',
      { error: error.message }
    );
    queue = null;
    queueReady = false;
  }
};

/**
 * Enqueue email without blocking the API response.
 */
const enqueueEmail = async (to, subject, html) => {
  const payload = { to, subject, html };

  if (queueReady && queue) {
    await queue.add('send', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    });
    return true;
  }

  // Non-blocking fallback
  setImmediate(() => {
    deliverEmail(payload).catch((err) =>
      logger.error('Async email failed', { error: err.message, to })
    );
  });
  return true;
};

module.exports = {
  initQueue,
  enqueueEmail,
  deliverEmail,
};
