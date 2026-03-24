const express = require("express");
const router = express.Router();
const { getEmployeeInsights } = require("../controller/insights_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/:id", isloginMiddleware, roleMiddleware(["admin", "hr"]), getEmployeeInsights);
// New Analytics Endpoints
const { getUserAutoPerformance, getTaskAnalytics } = require("../controller/insights_controller");

// /insights/performance/:employeeId?timeframe=weekly
router.get("/performance/:employeeId", isloginMiddleware, getUserAutoPerformance);

// /insights/task/:taskId
router.get("/task/:taskId", isloginMiddleware, getTaskAnalytics);

module.exports = router;
