const express = require('express');
const router = express.Router();
const {
    registerAdmin,
    loginAdmin,
    getCurrentAdmin,
    forgotPassword,
    verifyOTP,
    resetPasswordWithOTP,
    logoutAdmin,
    changePassword
} = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');

console.log('🔧 Loading Admin Routes...');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Register Admin (First time setup)
router.post('/register', registerAdmin);

// Login Admin
router.post('/login', loginAdmin);

// Forgot Password - Send OTP
router.post('/forgot-password', forgotPassword);

// Verify OTP
router.post('/verify-otp', verifyOTP);

// Reset Password with OTP
router.post('/reset-password-otp', resetPasswordWithOTP);

// Logout
router.post('/logout', logoutAdmin);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Get Current Admin Profile
router.get('/profile', verifyToken, getCurrentAdmin);

// Change Password (Logged in)
router.put('/change-password', verifyToken, changePassword);

console.log('✅ Admin Routes Loaded Successfully');

module.exports = router;