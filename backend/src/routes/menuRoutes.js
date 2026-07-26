const express = require('express');
const router = express.Router();
const {
    getMenuItems,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
} = require('../controllers/menuController');
const { verifyToken } = require('../middleware/auth');

console.log('🔧 Loading Menu Routes...');

// Public routes
router.get('/', getMenuItems);
router.get('/:id', getMenuItem);

// Admin routes (Protected with JWT)
router.post('/', verifyToken, createMenuItem);
router.put('/:id', verifyToken, updateMenuItem);
router.delete('/:id', verifyToken, deleteMenuItem);

console.log('✅ Menu Routes Loaded Successfully');

module.exports = router;