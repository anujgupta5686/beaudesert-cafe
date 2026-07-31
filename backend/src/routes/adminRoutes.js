const express = require('express');
const router = express.Router();
const {
    registerAdmin,
    loginAdmin,
    getCurrentAdmin,
    updateProfile,
    forgotPassword,
    verifyOTP,
    resetPasswordWithOTP,
    logoutAdmin,
    changePassword
} = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

console.log('🔧 Loading Admin Routes...');

// ============================================
// PUBLIC ROUTES (No authentication required)
// Rate-limit only auth-sensitive endpoints (not notifications polling)
// ============================================

router.post('/register', authLimiter, registerAdmin);
router.post('/login', authLimiter, loginAdmin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/reset-password-otp', authLimiter, resetPasswordWithOTP);

// Logout
router.post('/logout', logoutAdmin);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Get Current Admin Profile
router.get('/profile', verifyToken, getCurrentAdmin);

// Update profile (name + avatar)
router.put('/profile', verifyToken, updateProfile);

// Change Password (Logged in)
router.put('/change-password', verifyToken, changePassword);

// Notifications (PATCH + PUT for broader proxy/CORS compatibility)
router.get('/notifications', verifyToken, getNotifications);
router.patch('/notifications/read-all', verifyToken, markAllAsRead);
router.put('/notifications/read-all', verifyToken, markAllAsRead);
router.patch('/notifications/:id/read', verifyToken, markAsRead);
router.put('/notifications/:id/read', verifyToken, markAsRead);

console.log('✅ Admin Routes Loaded Successfully');

module.exports = router;