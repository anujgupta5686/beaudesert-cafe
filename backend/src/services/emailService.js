const { enqueueEmail, sendEmailNow } = require('../jobs/emailQueue');
const emailConfig = require('../config/email');
const env = require('../config/environment');
const { formatMoney } = require('../utils/helpers');
const chrome = require('../utils/emailTemplates');

const orderIdLabel = (order) =>
  order.orderNumber || `#${order._id.toString().slice(-6).toUpperCase()}`;

const itemRows = (items) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
    ${items
      .map(
        (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;color:#3f3f46;font-size:14px;">
          ${item.name}${item.size ? ` <span style="color:#a1a1aa;">(${item.size})</span>` : ''}
          <span style="color:#a1a1aa;"> × ${item.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-weight:bold;color:#18181b;font-size:14px;">
          ${formatMoney(item.price * item.quantity)}
        </td>
      </tr>`
      )
      .join('')}
  </table>`;

const emailService = {
  async sendPasswordResetOTP(email, otp) {
    const html = chrome.wrap({
      title: 'Password Reset OTP',
      preheader: `Your OTP is ${otp}`,
      bodyHtml: `
        <p style="color:#52525b;line-height:1.6;">Use this one-time password to reset your admin account. It expires in <strong>10 minutes</strong>.</p>
        ${chrome.infoBox(`
          <p style="margin:0;text-align:center;color:#71717a;font-size:13px;">Your OTP</p>
          <p style="margin:8px 0 0;text-align:center;font-size:36px;letter-spacing:10px;font-weight:bold;color:#b45309;">${otp}</p>
        `)}
        <p style="color:#a1a1aa;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
      `,
    });
    return enqueueEmail(email, 'Password Reset OTP - Beaudesert Cafe', html);
  },

  async sendPasswordChangedEmail(email) {
    const html = chrome.wrap({
      title: 'Password Changed',
      preheader: 'Your password was updated successfully',
      bodyHtml: chrome.infoBox(
        `<p style="margin:0;color:#065f46;text-align:center;">Your password has been changed successfully.</p>
         <p style="margin:8px 0 0;color:#6b7280;text-align:center;font-size:13px;">If this wasn’t you, contact support immediately.</p>`,
        '#d1fae5'
      ),
    });
    return enqueueEmail(email, 'Password Changed - Beaudesert Cafe', html);
  },

  async sendOrderConfirmationToUser(order) {
    const html = chrome.wrap({
      title: 'Order Confirmed',
      preheader: `Order ${orderIdLabel(order)} placed successfully`,
      bodyHtml: `
        <p style="color:#52525b;line-height:1.6;">Hi <strong>${order.customerName}</strong>, thanks for ordering with Beaudesert Cafe!</p>
        ${chrome.infoBox(`
          <p style="margin:0;"><strong>Order ID:</strong> ${orderIdLabel(order)}</p>
          <p style="margin:6px 0 0;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('en-US')}</p>
        `, '#f4f4f5')}
        <h3 style="margin:20px 0 8px;font-size:15px;color:#18181b;">Items</h3>
        ${itemRows(order.items)}
        <p style="margin:16px 0 0;font-size:18px;font-weight:bold;color:#b45309;">Total: ${formatMoney(order.totalAmount)}</p>
        ${chrome.infoBox(`
          <p style="margin:0;"><strong>Delivery:</strong> ${order.address}</p>
          <p style="margin:6px 0 0;"><strong>Phone:</strong> ${order.fullMobile || (order.countryCode ? `${order.countryCode} ${order.mobile}` : order.mobile)}</p>
        `, '#ecfdf5')}
      `,
    });
    return enqueueEmail(order.email, `Order Confirmed ${orderIdLabel(order)}`, html);
  },

  async sendOrderNotificationToAdmin(order) {
    const html = chrome.wrap({
      title: 'New Order Received',
      preheader: `${order.customerName} — ${formatMoney(order.totalAmount)}`,
      bodyHtml: `
        ${chrome.infoBox(`
          <p style="margin:0;"><strong>Order ID:</strong> ${orderIdLabel(order)}</p>
          <p style="margin:6px 0 0;"><strong>Customer:</strong> ${order.customerName}</p>
          <p style="margin:6px 0 0;"><strong>Email:</strong> ${order.email}</p>
          <p style="margin:6px 0 0;"><strong>Mobile:</strong> ${order.fullMobile || (order.countryCode ? `${order.countryCode} ${order.mobile}` : order.mobile)}</p>
          <p style="margin:6px 0 0;"><strong>Address:</strong> ${order.address}</p>
        `, '#f4f4f5')}
        ${itemRows(order.items)}
        <p style="margin:16px 0 0;font-size:18px;font-weight:bold;color:#b45309;">Total: ${formatMoney(order.totalAmount)}</p>
      `,
    });
    return enqueueEmail(
      emailConfig.adminEmail,
      `New Order ${orderIdLabel(order)} — ${order.customerName}`,
      html
    );
  },

  async sendOrderSuccessWithFeedback(order, feedbackToken) {
    const base = (env.frontendUrl || 'http://localhost:5173').replace(/\/$/, '');
    const feedbackUrl = `${base}/feedback/${feedbackToken}`;
    const to = String(order.email || '').trim().toLowerCase();
    const html = chrome.wrap({
      title: 'Order Completed',
      preheader: 'How was your experience? Leave feedback',
      bodyHtml: `
        <p style="color:#52525b;line-height:1.6;">Hi <strong>${order.customerName}</strong>, your order <strong>${orderIdLabel(order)}</strong> is complete!</p>
        ${chrome.infoBox(`
          <p style="margin:0;"><strong>Total:</strong> ${formatMoney(order.totalAmount)}</p>
        `, '#ecfdf5')}
        <div style="text-align:center;margin:24px 0;">
          <p style="color:#3b82f6;margin:0 0 12px;">We’d love your feedback (valid ${env.feedbackExpiryDays} days)</p>
          ${chrome.button(feedbackUrl, 'Rate Your Order')}
        </div>
      `,
    });
    return sendEmailNow(
      to,
      `Order Completed ${orderIdLabel(order)} — Share Feedback`,
      html
    );
  },

  async notifyAdminContactMessage(msg) {
    const html = chrome.wrap({
      title: 'New Contact Message',
      preheader: `From ${msg.name}`,
      bodyHtml: `
        ${chrome.infoBox(`
          <p style="margin:0;"><strong>Name:</strong> ${msg.name}</p>
          <p style="margin:6px 0 0;"><strong>Email:</strong> ${msg.email}</p>
        `, '#f4f4f5')}
        <p style="color:#52525b;line-height:1.7;white-space:pre-wrap;">${msg.message}</p>
      `,
    });
    return enqueueEmail(
      emailConfig.adminEmail,
      `Contact form — ${msg.name}`,
      html
    );
  },
};

module.exports = emailService;
