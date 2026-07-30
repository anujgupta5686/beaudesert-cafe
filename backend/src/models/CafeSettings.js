const mongoose = require('mongoose');

/**
 * Singleton cafe profile — update only, never delete.
 * Always ensure at least one document exists.
 */
const cafeSettingsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Beaudesert Cafe',
    },
    tagline: { type: String, default: 'Cafe & Restaurant' },
    address: {
      type: String,
      required: true,
      default: '12 Brisbane Street, Beaudesert QLD 4285, Australia',
    },
    phone: { type: String, required: true, default: '+61 7 5541 2345' },
    email: {
      type: String,
      required: true,
      default: 'hello@beaudesertcafe.com',
    },
    workingHours: {
      type: String,
      default: 'Mon–Fri: 7:00 AM – 5:00 PM\nSat–Sun: 8:00 AM – 4:00 PM',
    },
    mapEmbedUrl: {
      type: String,
      default:
        'https://www.google.com/maps?q=Beaudesert+QLD+Australia&output=embed',
    },
    /** Temporary closure */
    isTemporarilyClosed: { type: Boolean, default: false },
    closedFrom: { type: Date, default: null },
    closedTo: { type: Date, default: null },
    closureMessage: {
      type: String,
      default: 'We are temporarily closed. Thank you for your patience.',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CafeSettings', cafeSettingsSchema);
