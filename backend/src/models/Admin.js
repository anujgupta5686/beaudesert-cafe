const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('🔧 Loading Admin Model...');

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        default: 'Admin'
    },
    avatar: {
        type: String,
        default: '',
    },
    resetPasswordOTP: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// ✅ COMPLETELY DIFFERENT APPROACH - NO next() at all!
adminSchema.pre('save', function () {
    console.log('🔐 Pre-save hook triggered');
    console.log('📝 Password modified:', this.isModified('password'));

    // If password is not modified, skip hashing
    if (!this.isModified('password')) {
        console.log('⏭️ Password not modified, skipping hash');
        return;
    }

    console.log('🔑 Hashing password...');

    // Use bcrypt with Promise pattern
    const saltRounds = 10;

    // Create a promise-based hash
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if (err) {
                console.error('❌ Error generating salt:', err);
                return reject(err);
            }

            bcrypt.hash(this.password, salt, (err, hash) => {
                if (err) {
                    console.error('❌ Error hashing password:', err);
                    return reject(err);
                }

                this.password = hash;
                console.log('✅ Password hashed successfully');
                resolve();
            });
        });
    });
});

// Compare password method - USING PROMISES
adminSchema.methods.comparePassword = function (candidatePassword) {
    console.log('🔍 Comparing passwords...');
    return new Promise((resolve, reject) => {
        bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
            if (err) {
                console.error('❌ Error comparing password:', err);
                return reject(err);
            }
            console.log('✅ Password match:', isMatch);
            resolve(isMatch);
        });
    });
};

const Admin = mongoose.model('Admin', adminSchema);
console.log('✅ Admin Model Loaded Successfully');

module.exports = Admin;