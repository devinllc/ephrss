const express = require("express");
const router = express.Router();
const performanceController = require("../controller/performance_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", isloginMiddleware, roleMiddleware(["admin", "hr"]), performanceController.createReview);
router.get("/:employeeId", isloginMiddleware, performanceController.getReviews);

module.exports = router;
