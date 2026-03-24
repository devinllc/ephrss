const express = require("express");
const router = express.Router();
const logsController = require("../controller/activity_audit_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const checkManagerMiddleware = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  if (req.user && req.user.isManager === true) return next();
  return res.status(403).json({ error: "Access denied. Manager role required." });
};
const roleMiddleware = require("../middleware/roleMiddleware");

// Activity
router.get("/live/employee-status", isloginMiddleware, logsController.getEmployeeLiveStatus);
router.get("/live/team-activity", isloginMiddleware, checkManagerMiddleware, logsController.getTeamActivity);

// Audit
router.get("/audit/logs", isloginMiddleware, roleMiddleware(["admin"]), logsController.getAuditLogs);

module.exports = router;
