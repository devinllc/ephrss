const express = require("express");
const router = express.Router();
const managerController = require("../controller/manager_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const checkManagerMiddleware = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  if (req.user && req.user.isManager === true) return next();
  return res.status(403).json({ error: "Access denied. Manager role required." });
};

router.get("/team-performance", isloginMiddleware, checkManagerMiddleware, managerController.getTeamPerformance);
router.get("/team-alerts", isloginMiddleware, checkManagerMiddleware, managerController.getTeamAlerts);
router.post("/assign-task", isloginMiddleware, checkManagerMiddleware, managerController.assignTask);

module.exports = router;
