const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const cloudinaryConnection = require('./src/config/cloudinary');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Connect to Cloudinary
cloudinaryConnection();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://beaudesert-cafe-frontend.vercel.app',  // Your frontend URL
        'https://beaudesert-cafe-frontend.onrender.com'
    ],
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
app.use('/api/menu', require('./src/routes/menuRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Health check - For Render to know app is running
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🍵 Beaudesert Cafe API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
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
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: /health`);
});

module.exports = app;