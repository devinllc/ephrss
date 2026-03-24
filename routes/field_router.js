const express = require("express");
const router = express.Router();
const fieldController = require("../controller/field_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// 📍 Core Field APIs
router.post("/update-location", isloginMiddleware, fieldController.updateLocation);
router.get("/:employeeId/history", isloginMiddleware, roleMiddleware(["admin", "hr"]), fieldController.getHistory);
router.get("/route/:employeeId", isloginMiddleware, roleMiddleware(["admin", "hr"]), fieldController.getRoute);
router.get("/stops/:employeeId", isloginMiddleware, roleMiddleware(["admin", "hr"]), fieldController.getStops);
router.get("/visits/:employeeId", isloginMiddleware, roleMiddleware(["admin", "hr"]), fieldController.getVisits);
router.get("/summary/me", isloginMiddleware, fieldController.getSummaryMe);
router.get("/summary/:employeeId", isloginMiddleware, roleMiddleware(["admin", "hr"]), fieldController.getSummaryEmployee);

// 🧠 Field Analytics APIs
router.get("/analytics/me", isloginMiddleware, fieldController.getAnalyticsMe);
router.get("/analytics/:employeeId", isloginMiddleware, roleMiddleware(["admin", "hr"]), fieldController.getAnalyticsEmployee);
router.get("/analytics/company", isloginMiddleware, roleMiddleware(["admin", "hr"]), fieldController.getAnalyticsCompany);

// 🚨 Monitoring / Alerts APIs
router.get("/idle-report", isloginMiddleware, roleMiddleware(["admin", "hr"]), fieldController.getIdleReport);
router.get("/suspicious-activity", isloginMiddleware, roleMiddleware(["admin", "hr"]), fieldController.getSuspiciousActivity);
router.get("/missed-visits", isloginMiddleware, roleMiddleware(["admin", "hr"]), fieldController.getMissedVisits);

module.exports = router;
