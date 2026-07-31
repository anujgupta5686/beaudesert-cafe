const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 30));
    const unreadOnly = req.query.unread === 'true';

    const filter = unreadOnly ? { isRead: false } : {};
    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ isRead: false }),
    ]);

    res.json({
      success: true,
      data: { items, unreadCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const item = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    const unreadCount = await Notification.countDocuments({ isRead: false });
    res.json({ success: true, data: { item, unreadCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, data: { unreadCount: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
