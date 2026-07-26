const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrders,
    getCustomerCount,
    updateOrderStatus  // ← ADD THIS
} = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');

// Public route
router.post('/', createOrder);

// Admin routes (Protected with JWT)
router.get('/', verifyToken, getOrders);
router.get('/customers/count', verifyToken, getCustomerCount);
router.put('/:id/status', verifyToken, updateOrderStatus);  // ← ADD THIS

module.exports = router;