const mongoose = require('mongoose');

console.log('🔧 Loading Menu Model...');

const menuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const Menu = mongoose.model('Menu', menuSchema);
console.log('✅ Menu Model Loaded Successfully');

module.exports = Menu;