const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const comboItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    variantLabel: { type: String, default: null },
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    /** Base / combo selling price in USD */
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    productType: {
      type: String,
      enum: ['normal', 'combo'],
      default: 'normal',
      index: true,
    },
    hasVariants: {
      type: Boolean,
      default: false,
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    comboItems: {
      type: [comboItemSchema],
      default: [],
    },
    /** Sum of included items before combo discount */
    originalPrice: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    /** When false, product is sold out / unavailable */
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

menuSchema.index({ name: 'text', description: 'text' });
menuSchema.index({ productType: 1, category: 1, createdAt: -1 });
menuSchema.index({ isAvailable: 1, isActive: 1 });

module.exports = mongoose.model('Menu', menuSchema);
