const mongoose = require('mongoose');
const env = require('./environment');

const connectDB = async () => {
  try {
    const uri = env.mongodbUri;
    if (!uri) {
      console.error('❌ MongoDB Connection Error: MONGODB_URI is not set in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);

    // Log host only (never credentials) so local vs Atlas is obvious
    const hostLabel = uri.includes('@')
      ? uri.split('@').pop()?.split('/')[0] || 'Atlas'
      : uri.replace(/^mongodb(\+srv)?:\/\//, '').split('/')[0] || 'local';
    console.log(`✅ MongoDB Connected Successfully (${hostLabel})`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;