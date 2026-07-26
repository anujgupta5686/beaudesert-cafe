const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

console.log('🔧 Loading Auth Middleware...');

const verifyToken = async (req, res, next) => {
    console.log('🔐 Verifying token...');

    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login.'
            });
        }

        console.log('📝 Token found, verifying...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token verified, admin ID:', decoded.id);

        const admin = await Admin.findById(decoded.id).select('-password');

        if (!admin) {
            console.log('❌ Admin not found');
            return res.status(401).json({
                success: false,
                message: 'Admin not found. Please login again.'
            });
        }

        console.log('✅ Admin found:', admin.email);
        req.admin = admin;
        next();
    } catch (error) {
        console.error('❌ Token verification error:', error.message);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

console.log('✅ Auth Middleware Loaded Successfully');

module.exports = { verifyToken };