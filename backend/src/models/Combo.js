const mongoose = require('mongoose');

/**
 * Combo packs are stored as Menu documents with productType: 'combo'.
 * This model is kept as a thin alias for clarity / future expansion.
 * Prefer using Menu with productType === 'combo' in controllers.
 */
module.exports = require('./Menu');
