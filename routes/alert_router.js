const express = require("express");
const router = express.Router();
const alertController = require("../controller/alert_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/me", isloginMiddleware, alertController.getMyAlerts);
router.get("/company", isloginMiddleware, roleMiddleware(["admin", "hr"]), alertController.getCompanyAlerts);
router.post("/acknowledge", isloginMiddleware, alertController.acknowledgeAlert);

module.exports = router;
