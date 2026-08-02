const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

console.log('🔧 Loading Auth Middleware...');

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                code: 'NO_TOKEN',
                message: 'No token provided. Please login.',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id).select('-password');

        if (!admin) {
            return res.status(401).json({
                success: false,
                code: 'ADMIN_NOT_FOUND',
                message: 'Admin not found. Please login again.',
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                code: 'ACCOUNT_DISABLED',
                message: 'Account is deactivated. Please contact support.',
            });
        }

        // Single-device: reject tokens from a previous login after a new device logs in
        if (!decoded.sid || !admin.sessionId || decoded.sid !== admin.sessionId) {
            return res.status(401).json({
                success: false,
                code: 'SESSION_REPLACED',
                message:
                    'You were logged out because this account signed in on another device.',
            });
        }

        req.admin = admin;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                code: 'INVALID_TOKEN',
                message: 'Invalid token. Please login again.',
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                code: 'TOKEN_EXPIRED',
                message: 'Token expired. Please login again.',
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Authentication error.',
        });
    }
};

console.log('✅ Auth Middleware Loaded Successfully');

module.exports = { verifyToken };