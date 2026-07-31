const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['order', 'message', 'feedback'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    /** Frontend path, e.g. /admin/orders?order=BC-... */
    link: { type: String, default: '/admin/orders' },
    relatedId: { type: String, default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
