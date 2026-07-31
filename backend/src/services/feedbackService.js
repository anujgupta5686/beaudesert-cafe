const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const emailService = require('./emailService');
const logger = require('../utils/logger');

const feedbackService = {
  /**
   * Create feedback token (if needed) and send "order completed"
   * email to the customer's order.email.
   */
  async createAndEmail(order) {
    const customerEmail = String(order?.email || '')
      .trim()
      .toLowerCase();

    if (!customerEmail || !customerEmail.includes('@')) {
      const err = new Error(
        'Order has no customer email — cannot send completion mail'
      );
      logger.error(err.message, { orderId: order?._id });
      throw err;
    }

    // Keep email on the in-memory order object in case it was missing casing/spaces
    order.email = customerEmail;

    let feedback = await Feedback.findOne({ order: order._id });
    if (!feedback) {
      try {
        feedback = await Feedback.createForOrder(order);
        order.feedbackStatus = 'pending';
        await order.save();
        logger.info('Feedback link created', {
          orderId: order._id,
          token: feedback.token,
        });
      } catch (err) {
        // Race: another request created it
        if (err.code === 11000) {
          feedback = await Feedback.findOne({ order: order._id });
        } else {
          throw err;
        }
      }
    }

    if (!feedback?.token) {
      throw new Error('Could not create feedback link for completion email');
    }

    await emailService.sendOrderSuccessWithFeedback(order, feedback.token);
    logger.info('Order completion email sent', {
      orderId: order._id,
      email: customerEmail,
    });
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
