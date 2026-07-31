const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  getCustomerCount,
  getDashboardStats,
  updateOrderStatus,
} = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');

router.post('/', orderLimiter, createOrder);
router.get('/customers/count', verifyToken, getCustomerCount);
router.get('/dashboard-stats', verifyToken, getDashboardStats);
router.get('/', verifyToken, getOrders);
router.get('/:id', verifyToken, getOrder);
router.put('/:id/status', verifyToken, updateOrderStatus);

module.exports = router;
