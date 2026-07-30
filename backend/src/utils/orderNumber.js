const crypto = require('crypto');

/**
 * Generate a unique human-readable order number.
 * Format: BC-YYYYMMDD-XXXX (e.g. BC-20260730-A3F9)
 */
const generateOrderNumber = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BC-${y}${m}${d}-${suffix}`;
};

module.exports = { generateOrderNumber };
