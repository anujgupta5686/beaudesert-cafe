const mongoose = require('mongoose');

/**
 * Optional global size presets (Small / Medium / Large).
 * Products can also define custom variants inline on Menu.
 */
const sizeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, unique: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Size', sizeSchema);
