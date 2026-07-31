/**
 * Legacy helper — prefer storageService.uploadImage().
 * Kept so older imports keep working; routes through the active provider.
 */
const storageService = require('../services/storageService');

const uploadToCloudinary = async (file) => {
  try {
    const result = await storageService.uploadImage(file);
    return result.url;
  } catch (error) {
    console.error('Storage upload error:', error);
    return null;
  }
};

module.exports = uploadToCloudinary;
