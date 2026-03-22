const Subscription = require("../model/subscription_model");

exports.createSubscription = async (req, res) => {
  try {
    const { user, planName, price, billingCycle, startDate, endDate, status } = req.body;
    const subscription = await Subscription.create({
      user,
      planName,
      price,
      billingCycle,
      startDate,
      endDate,
      status,
      createdBy: req.user._id
    });
    res.status(201).json({ message: "Subscription activated successfully", subscription });
  } catch (error) {
    res.status(500).json({ error: "Failed to create subscription" });
  }
};

exports.getSubscriptionInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await Subscription.findOne({ user: id }).sort({ createdAt: -1 });
    res.status(200).json({ subscription: sub });
  } catch (error) {
    res.status(500).json({ error: "Failed to get subscription info" });
  }
};
