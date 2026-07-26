const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const cloudinaryConnection = require('./src/config/cloudinary');

console.log('🚀 Starting Cafe Backend Server...');
console.log('🔍 Checking environment variables...');

// Load environment variables
dotenv.config();

// Check critical environment variables
console.log('📝 Environment Variables:');
console.log('  PORT:', process.env.PORT);
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
console.log('  MAIL_USER:', process.env.MAIL_USER ? '✅ Set' : '❌ Missing');

// Connect to database
console.log('📡 Connecting to MongoDB...');
connectDB();

// Connect to Cloudinary
console.log('☁️ Connecting to Cloudinary...');
cloudinaryConnection();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
console.log('🔧 Setting up middleware...');
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp",
    })
);

// Routes
console.log('🔗 Setting up routes...');
app.use('/api/menu', require('./src/routes/menuRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🍵 Cafe API is running!',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error handler caught:', err);
    res.status(500).json({ success: false, message: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🎯 Ready to accept requests!');
});

console.log('🚀 Backend setup complete!');