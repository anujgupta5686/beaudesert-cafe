const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createCombo,
  updateCombo,
} = require('../controllers/menuController');
const { verifyToken } = require('../middleware/auth');

router.get('/', getMenuItems);

// Combo routes before :id to avoid path conflicts
router.post('/combo', verifyToken, createCombo);
router.put('/combo/:id', verifyToken, updateCombo);

router.get('/:id', getMenuItem);
router.post('/', verifyToken, createMenuItem);
router.put('/:id', verifyToken, updateMenuItem);
router.delete('/:id', verifyToken, deleteMenuItem);

module.exports = router;
