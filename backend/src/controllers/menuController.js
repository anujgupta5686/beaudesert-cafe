const Menu = require('../models/Menu');
const cloudinary = require('cloudinary').v2;

console.log('🔧 Loading Menu Controller...');

// Upload to Cloudinary
const uploadToCloudinary = async (file) => {
    console.log('📤 Uploading to Cloudinary...');
    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'cafe_menu',
            width: 500,
            height: 500,
            crop: 'limit'
        });
        console.log('✅ Uploaded to Cloudinary:', result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        throw error;
    }
};

// Get all menu items
exports.getMenuItems = async (req, res) => {
    console.log('📝 GET ALL MENU ITEMS');

    try {
        const items = await Menu.find().sort({ createdAt: -1 });
        console.log('✅ Found', items.length, 'items');
        res.json({ success: true, data: items });
    } catch (error) {
        console.error('❌ Get menu items error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single menu item
exports.getMenuItem = async (req, res) => {
    console.log('📝 GET SINGLE MENU ITEM - ID:', req.params.id);

    try {
        const item = await Menu.findById(req.params.id);
        if (!item) {
            console.log('❌ Item not found');
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        console.log('✅ Item found:', item.name);
        res.json({ success: true, data: item });
    } catch (error) {
        console.error('❌ Get menu item error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create menu item (Admin)
exports.createMenuItem = async (req, res) => {
    console.log('📝 CREATE MENU ITEM');
    console.log('📝 Request body:', req.body);
    console.log('📝 Files:', req.files ? 'File present' : 'No file');

    try {
        const { name, description, price } = req.body;

        // Check if file is uploaded
        if (!req.files || !req.files.image) {
            console.log('❌ No image uploaded');
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(req.files.image);

        const item = await Menu.create({
            name,
            description,
            price: Number(price),
            image: imageUrl
        });

        console.log('✅ Menu item created:', item.name);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        console.error('❌ Create menu item error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update menu item (Admin)
exports.updateMenuItem = async (req, res) => {
    console.log('📝 UPDATE MENU ITEM - ID:', req.params.id);
    console.log('📝 Request body:', req.body);

    try {
        const { name, description, price } = req.body;
        const updateData = {
            name,
            description,
            price: Number(price)
        };

        // If new image uploaded, upload to Cloudinary
        if (req.files && req.files.image) {
            console.log('📤 New image uploaded, uploading to Cloudinary...');
            const imageUrl = await uploadToCloudinary(req.files.image);
            updateData.image = imageUrl;
        }

        const item = await Menu.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!item) {
            console.log('❌ Item not found');
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        console.log('✅ Menu item updated:', item.name);
        res.json({ success: true, data: item });
    } catch (error) {
        console.error('❌ Update menu item error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete menu item (Admin)
exports.deleteMenuItem = async (req, res) => {
    console.log('📝 DELETE MENU ITEM - ID:', req.params.id);

    try {
        const item = await Menu.findByIdAndDelete(req.params.id);

        if (!item) {
            console.log('❌ Item not found');
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        console.log('✅ Menu item deleted:', item.name);
        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        console.error('❌ Delete menu item error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

console.log('✅ Menu Controller Loaded Successfully');