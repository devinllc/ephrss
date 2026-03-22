const express = require("express");
const router = express.Router();
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { createSubscription, getSubscriptionInfo } = require("../controller/subscription_controller");

// Only Admin can create and modify user subscriptions locally
router.post("/", isloginMiddleware, roleMiddleware(["admin"]), createSubscription);
// Users / Admins can check subscription status
router.get("/:id", isloginMiddleware, getSubscriptionInfo);

module.exports = router;
