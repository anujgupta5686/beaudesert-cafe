const mongoose = require('mongoose');
const crypto = require('crypto');
const env = require('../config/environment');

const itemRatingSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
    },
    name: String,
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
  },
  { _id: false }
);

const feedbackSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    customerName: String,
    email: String,
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    submitted: {
      type: Boolean,
      default: false,
    },
    submittedAt: Date,
    overallRating: { type: Number, min: 1, max: 5 },
    overallComment: { type: String, default: '' },
    itemRatings: [itemRatingSchema],
  },
  { timestamps: true }
);

feedbackSchema.statics.createForOrder = async function (order) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.feedbackExpiryDays);

  return this.create({
    order: order._id,
    customerName: order.customerName,
    email: order.email,
    token,
    expiresAt,
  });
};

module.exports = mongoose.model('Feedback', feedbackSchema);
