const express = require('express');
const router = express.Router();
const {
  getFeedbackByToken,
  submitFeedback,
  getFeedbackAnalytics,
} = require('../controllers/feedbackController');
const { verifyToken } = require('../middleware/auth');

router.get('/analytics', verifyToken, getFeedbackAnalytics);
router.get('/:token', getFeedbackByToken);
router.post('/:token', submitFeedback);

module.exports = router;
