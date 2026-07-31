const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    /** Dial code e.g. +91 */
    countryCode: {
      type: String,
      default: '',
      trim: true,
    },
    /** ISO 3166-1 alpha-2 e.g. IN */
    countryIso: {
      type: String,
      default: '',
      uppercase: true,
      trim: true,
    },
    /** E.164 full number e.g. +919876543210 */
    fullMobile: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    specialInstructions: {
      type: String,
      default: '',
    },
    items: [
      {
        menuItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Menu',
          required: true,
        },
        name: String,
        price: Number,
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        image: {
          type: String,
          default: '',
        },
        size: {
          type: String,
          default: null,
        },
        productType: {
          type: String,
          enum: ['normal', 'combo'],
          default: 'normal',
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success'],
      default: 'pending',
      index: true,
    },
    feedbackStatus: {
      type: String,
      enum: ['none', 'pending', 'submitted'],
      default: 'none',
    },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ email: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({
  customerName: 'text',
  email: 'text',
  mobile: 'text',
  orderNumber: 'text',
});

module.exports = mongoose.model('Order', orderSchema);
