const cloudinary = require("cloudinary").v2;

const uploadToCloudinary = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'cafe_menu',
            width: 500,
            height: 500,
            crop: 'limit'
        });
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

module.exports = uploadToCloudinary;