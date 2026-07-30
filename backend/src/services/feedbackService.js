const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const emailService = require('./emailService');
const logger = require('../utils/logger');

const feedbackService = {
  async createAndEmail(order) {
    const existing = await Feedback.findOne({ order: order._id });
    if (existing) {
      return existing;
    }

    const feedback = await Feedback.createForOrder(order);
    order.feedbackStatus = 'pending';
    await order.save();

    await emailService.sendOrderSuccessWithFeedback(order, feedback.token);
    logger.info('Feedback link created', { orderId: order._id, token: feedback.token });
    return feedback;
  },

  async getByToken(token) {
    const feedback = await Feedback.findOne({ token }).populate({
      path: 'order',
      select: 'items customerName totalAmount status createdAt',
    });
    return feedback;
  },

  async submit(token, { overallRating, overallComment, itemRatings }) {
    const feedback = await Feedback.findOne({ token });
    if (!feedback) {
      const err = new Error('Invalid feedback link');
      err.statusCode = 404;
      throw err;
    }
    if (feedback.submitted) {
      const err = new Error('Feedback already submitted');
      err.statusCode = 400;
      throw err;
    }
    if (new Date() > feedback.expiresAt) {
      const err = new Error('Feedback link has expired');
      err.statusCode = 400;
      throw err;
    }

    feedback.overallRating = overallRating;
    feedback.overallComment = overallComment || '';
    feedback.itemRatings = itemRatings || [];
    feedback.submitted = true;
    feedback.submittedAt = new Date();
    await feedback.save();

    await Order.findByIdAndUpdate(feedback.order, {
      feedbackStatus: 'submitted',
    });

    return feedback;
  },

  async getAnalytics() {
    const submitted = await Feedback.find({ submitted: true }).sort({
      submittedAt: -1,
    });

    const total = submitted.length;
    const avgOverall =
      total === 0
        ? 0
        : submitted.reduce((sum, f) => sum + (f.overallRating || 0), 0) / total;

    return {
      totalFeedback: total,
      averageRating: Number(avgOverall.toFixed(2)),
      recent: submitted.slice(0, 20),
    };
  },
};

module.exports = feedbackService;
