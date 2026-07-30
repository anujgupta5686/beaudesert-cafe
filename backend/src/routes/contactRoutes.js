const express = require('express');
const router = express.Router();
const {
  createMessage,
  getMessages,
  markRead,
  deleteMessage,
} = require('../controllers/contactController');
const { verifyToken } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');

router.post('/', orderLimiter, createMessage);
router.get('/', verifyToken, getMessages);
router.patch('/:id/read', verifyToken, markRead);
router.delete('/:id', verifyToken, deleteMessage);

module.exports = router;
