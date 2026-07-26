const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { sendPasswordResetOTP, sendPasswordChangedEmail } = require('../utils/email');

console.log('🔧 Loading Admin Controller...');

// Generate JWT Token
const generateToken = (id) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('🔑 Token generated for admin ID:', id);
    return token;
};

// Register Admin (First time setup)
exports.registerAdmin = async (req, res) => {
    console.log('📝 REGISTER ADMIN - Request received');
    console.log('📝 Request body:', req.body);

    try {
        const { email, password, name } = req.body;

        // Validate required fields
        if (!email || !password) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check if admin already exists
        console.log('🔍 Checking if admin exists...');
        const adminExists = await Admin.findOne({ email });
        console.log('📝 Admin exists:', adminExists ? 'Yes' : 'No');

        if (adminExists) {
            console.log('❌ Admin already exists');
            return res.status(400).json({
                success: false,
                message: 'Admin already exists'
            });
        }

        // Create admin
        console.log('👤 Creating new admin...');
        const admin = new Admin({
            email,
            password,
            name: name || 'Admin'
        });

        await admin.save();

        console.log('✅ Admin created successfully:', admin._id);

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: {
                id: admin._id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Login Admin
exports.loginAdmin = async (req, res) => {
    console.log('📝 LOGIN ADMIN - Request received');
    console.log('📝 Request body:', req.body);

    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check if admin exists
        console.log('🔍 Checking if admin exists...');
        const admin = await Admin.findOne({ email });
        console.log('📝 Admin exists:', admin ? 'Yes' : 'No');

        if (!admin) {
            console.log('❌ Admin not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!admin.isActive) {
            console.log('❌ Account is deactivated');
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Check password - USING PROMISE
        console.log('🔍 Comparing password...');
        try {
            const isPasswordValid = await admin.comparePassword(password);
            console.log('📝 Password valid:', isPasswordValid);

            if (!isPasswordValid) {
                console.log('❌ Invalid password');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
        } catch (error) {
            console.error('❌ Password comparison error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error comparing password'
            });
        }

        // Generate token
        const token = generateToken(admin._id);

        console.log('✅ Login successful for:', admin.email);
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                admin: {
                    id: admin._id,
                    email: admin.email,
                    name: admin.name
                }
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Current Admin Profile
exports.getCurrentAdmin = async (req, res) => {
    console.log('📝 GET PROFILE - Request received');
    console.log('📝 Admin ID:', req.admin._id);

    try {
        res.json({
            success: true,
            data: {
                id: req.admin._id,
                email: req.admin.email,
                name: req.admin.name
            }
        });
    } catch (error) {
        console.error('❌ Get profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ✅ FORGOT PASSWORD - SEND OTP
// ============================================
exports.forgotPassword = async (req, res) => {
    console.log('📝 FORGOT PASSWORD - Request received');
    console.log('📝 Request body:', req.body);

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        console.log('🔍 Finding admin with email:', email);
        const admin = await Admin.findOne({ email });

        if (!admin) {
            console.log('❌ Admin not found');
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔑 Generated OTP:', otp);

        // Save OTP and expiry (10 minutes)
        admin.resetPasswordOTP = otp;
        admin.resetPasswordExpires = Date.now() + 600000; // 10 minutes
        await admin.save();

        // Send email with OTP
        console.log('📧 Sending OTP email...');
        await sendPasswordResetOTP(email, otp);

        console.log('✅ OTP sent successfully to:', email);
        res.json({
            success: true,
            message: 'OTP sent to your email address',
            email: email
        });
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ✅ VERIFY OTP
// ============================================
exports.verifyOTP = async (req, res) => {
    console.log('📝 VERIFY OTP - Request received');
    console.log('📝 Request body:', req.body);

    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        console.log('🔍 Finding admin with email:', email);
        const admin = await Admin.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!admin) {
            console.log('❌ Invalid or expired OTP');
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        console.log('✅ OTP verified for:', email);
        res.json({
            success: true,
            message: 'OTP verified successfully',
            email: email
        });
    } catch (error) {
        console.error('❌ Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ✅ RESET PASSWORD WITH OTP
// ============================================
exports.resetPasswordWithOTP = async (req, res) => {
    console.log('📝 RESET PASSWORD WITH OTP - Request received');
    console.log('📝 Request body:', req.body);

    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        console.log('🔍 Finding admin with email and OTP:', email);
        const admin = await Admin.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!admin) {
            console.log('❌ Invalid or expired OTP');
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Update password
        console.log('🔑 Updating password...');
        admin.password = newPassword;
        admin.resetPasswordOTP = null;
        admin.resetPasswordExpires = null;
        await admin.save();

        // Send confirmation email
        console.log('📧 Sending password changed confirmation...');
        await sendPasswordChangedEmail(email);

        console.log('✅ Password reset successfully for:', email);
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('❌ Reset password with OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Logout
exports.logoutAdmin = async (req, res) => {
    console.log('📝 LOGOUT - Request received');

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

// ============================================
// ✅ CHANGE PASSWORD (Logged in user)
// ============================================
exports.changePassword = async (req, res) => {
    console.log('📝 CHANGE PASSWORD - Request received');
    console.log('📝 Admin ID:', req.admin._id);

    try {
        const { currentPassword, newPassword } = req.body;
        const adminId = req.admin._id;

        // Validate required fields
        if (!currentPassword || !newPassword) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Check if new password is at least 6 characters
        if (newPassword.length < 6) {
            console.log('❌ New password too short');
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Find admin
        console.log('🔍 Finding admin...');
        const admin = await Admin.findById(adminId);
        if (!admin) {
            console.log('❌ Admin not found');
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Verify current password
        console.log('🔍 Verifying current password...');
        const isPasswordValid = await admin.comparePassword(currentPassword);
        if (!isPasswordValid) {
            console.log('❌ Current password is incorrect');
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        console.log('🔑 Updating password...');
        admin.password = newPassword;
        await admin.save();

        console.log('✅ Password changed successfully for:', admin.email);
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

console.log('✅ Admin Controller Loaded Successfully');