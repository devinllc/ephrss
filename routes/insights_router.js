const express = require("express");
const router = express.Router();
const { getEmployeeInsights } = require("../controller/insights_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/:id", isloginMiddleware, roleMiddleware(["admin", "hr"]), getEmployeeInsights);

module.exports = router;
