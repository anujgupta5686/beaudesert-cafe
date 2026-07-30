const feedbackService = require('../services/feedbackService');

exports.getFeedbackByToken = async (req, res) => {
  try {
    const feedback = await feedbackService.getByToken(req.params.token);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    if (feedback.submitted) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted',
        data: { submitted: true },
      });
    }

    if (new Date() > feedback.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Feedback link has expired',
      });
    }

    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { overallRating, overallComment, itemRatings } = req.body;
    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Overall rating (1-5) is required',
      });
    }

    const feedback = await feedbackService.submit(req.params.token, {
      overallRating: Number(overallRating),
      overallComment,
      itemRatings,
    });

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
      data: feedback,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getFeedbackAnalytics = async (req, res) => {
  try {
    const data = await feedbackService.getAnalytics();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
