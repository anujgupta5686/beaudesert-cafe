const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const notificationService = {
  async create({ type, title, body, link, relatedId }) {
    try {
      return await Notification.create({
        type,
        title,
        body: body || '',
        link: link || '/admin/dashboard',
        relatedId: relatedId || null,
        isRead: false,
      });
    } catch (err) {
      logger.warn('Failed to create notification', { error: err.message });
      return null;
    }
  },

  async createOrderNotification(order) {
    const orderLabel =
      order.orderNumber || `#${String(order._id).slice(-6).toUpperCase()}`;
    return this.create({
      type: 'order',
      title: `New order ${orderLabel}`,
      body: `${order.customerName} · $${Number(order.totalAmount || 0).toFixed(2)} · ${order.items?.length || 0} item(s)`,
      link: `/admin/orders?order=${encodeURIComponent(order.orderNumber || order._id)}`,
      relatedId: String(order._id),
    });
  },

  async createMessageNotification(message) {
    return this.create({
      type: 'message',
      title: 'New contact message',
      body: `${message.name}: ${(message.message || '').slice(0, 80)}`,
      link: '/admin/messages',
      relatedId: String(message._id),
    });
  },
};

module.exports = notificationService;
