const express = require('express');
const router = express.Router();
const {
  getCafeSettings,
  updateCafeSettings,
} = require('../controllers/cafeSettingsController');
const { verifyToken } = require('../middleware/auth');

router.get('/', getCafeSettings);
router.put('/', verifyToken, updateCafeSettings);

module.exports = router;
