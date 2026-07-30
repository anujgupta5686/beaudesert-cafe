/**
 * Backward-compatible email utils — delegates to queued emailService.
 */
const emailService = require('../services/emailService');
const { enqueueEmail } = require('../jobs/emailQueue');

const sendEmail = async (to, subject, html) => enqueueEmail(to, subject, html);

const sendPasswordResetOTP = (email, otp) =>
  emailService.sendPasswordResetOTP(email, otp);

const sendPasswordChangedEmail = (email) =>
  emailService.sendPasswordChangedEmail(email);

module.exports = { sendEmail, sendPasswordResetOTP, sendPasswordChangedEmail };
