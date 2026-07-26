const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const cloudinaryConnection = () => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
        });
        console.log('✅ Cloudinary Connected Successfully');
        console.log('Cloud Name:', process.env.CLOUD_NAME);
        console.log('API Key:', process.env.API_KEY ? '✅ Set' : '❌ Missing');
        console.log('API Secret:', process.env.API_SECRET ? '✅ Set' : '❌ Missing');
    } catch (error) {
        console.log("❌ Error connecting to Cloudinary:", error);
    }
};

module.exports = cloudinaryConnection;