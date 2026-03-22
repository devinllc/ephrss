const Performance = require("../model/performance_model");

exports.createReview = async (req, res) => {
  try {
    const { 
      employeeId, 
      reviewPeriod, 
      rating, 
      feedback, 
      goalsAchieved, 
      areasOfImprovement,
      technicalRating,
      behavioralRating,
      punctualityRating
    } = req.body;
    const evaluator = req.user._id;

    const review = await Performance.create({
      employee: employeeId,
      evaluator,
      reviewPeriod,
      rating: rating || (technicalRating + behavioralRating + punctualityRating) / 3,
      feedback,
      goalsAchieved,
      areasOfImprovement,
      technicalRating,
      behavioralRating,
      punctualityRating
    });

    res.status(201).json({ message: "Performance review created", review });
  } catch (error) {
    res.status(500).json({ error: "Failed to create performance review" });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const reviews = await Performance.find({ employee: employeeId }).populate('evaluator', 'fullName email');
    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ error: "Failed to get reviews" });
  }
};
