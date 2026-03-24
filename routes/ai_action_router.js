const express = require("express");
const router = express.Router();
const engineController = require("../controller/ai_action_engine_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/recommendations", isloginMiddleware, roleMiddleware(["admin", "hr"]), engineController.getRecommendations);
router.post("/reassign-task", isloginMiddleware, roleMiddleware(["admin", "hr"]), engineController.reassignTask);
router.get("/root-cause/:employeeId", isloginMiddleware, roleMiddleware(["admin", "hr"]), engineController.getRootCauseAnalysis);

module.exports = router;
