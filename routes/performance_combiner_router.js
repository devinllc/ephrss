const express = require("express");
const router = express.Router();
const combinerController = require("../controller/performance_combiner");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Integrate Task + Field + Attendance Performance Engine
router.get("/employee/:id", isloginMiddleware, roleMiddleware(["admin", "hr", "employee"]), combinerController.getPerformanceEmployee);
router.get("/company", isloginMiddleware, roleMiddleware(["admin", "hr"]), combinerController.getPerformanceCompany);
router.get("/trends/:employeeId", isloginMiddleware, roleMiddleware(["admin", "hr", "employee"]), combinerController.getPerformanceTrends);

module.exports = router;
